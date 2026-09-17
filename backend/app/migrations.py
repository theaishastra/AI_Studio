import json
import logging
import uuid

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger("migrations")

# Base.metadata.create_all() (see main.py) only creates TABLES that don't exist
# yet - it never ALTERs a table that's already there. So any column added to or
# removed from an existing model needs an explicit, idempotent statement here.
# Re-running this is always a no-op once applied; the one exception is a DROP
# COLUMN, which is only ever added here after the column's data is confirmed
# unneeded (is_featured: removed because no page rendered it correctly, see
# admin.py's homepage builder / catalog.py's page bundles for what replaced it).
_COLUMN_MIGRATIONS: dict[str, list[str]] = {
    "products": [
        "ADD COLUMN IF NOT EXISTS address_change_window_hours INTEGER",
        "ADD COLUMN IF NOT EXISTS input_fields JSON DEFAULT '[]'::json",
        "ADD COLUMN IF NOT EXISTS delivery_days INTEGER",
        "DROP COLUMN IF EXISTS is_featured",
    ],
    "orders": [
        "ADD COLUMN IF NOT EXISTS carrier VARCHAR(80)",
        "ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(120)",
        "ADD COLUMN IF NOT EXISTS tracking_url TEXT",
        "ADD COLUMN IF NOT EXISTS expected_delivery DATE",
        "ADD COLUMN IF NOT EXISTS address_snapshot JSON DEFAULT '{}'::json",
    ],
    "order_items": [
        "ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'",
    ],
    "order_cancellation_requests": [
        "ADD COLUMN IF NOT EXISTS order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE",
    ],
}


def run_column_migrations(engine: Engine) -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, clauses in _COLUMN_MIGRATIONS.items():
            if table not in existing_tables:
                continue  # create_all() just created it fresh, with these columns already in place
            for clause in clauses:
                conn.execute(text(f"ALTER TABLE {table} {clause}"))
    logger.info("Column migrations applied.")


# The admin/customer order lists filter by status and always sort by
# created_at desc - without an index Postgres has to sort the whole table on
# every request, which is the main cost of GET /api/admin/orders as the table
# grows. create_all() never adds indexes to a table that already exists, so
# they're backfilled here the same way columns are.
_INDEX_MIGRATIONS: dict[str, list[str]] = {
    "orders": [
        "CREATE INDEX IF NOT EXISTS ix_orders_created_at ON orders (created_at DESC)",
        "CREATE INDEX IF NOT EXISTS ix_orders_status_created_at ON orders (status, created_at DESC)",
    ],
    "order_cancellation_requests": [
        "CREATE INDEX IF NOT EXISTS ix_order_cancellation_requests_order_item_id "
        "ON order_cancellation_requests (order_item_id)",
    ],
}


def run_index_migrations(engine: Engine) -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, clauses in _INDEX_MIGRATIONS.items():
            if table not in existing_tables:
                continue
            for clause in clauses:
                conn.execute(text(clause))
    logger.info("Index migrations applied.")


def backfill_address_snapshots(engine: Engine) -> None:
    """One-time (idempotent) backfill for orders placed before address_snapshot
    existed: copies each order's still-live Address into address_snapshot, so
    it survives that address later being edited or deleted (address_id is
    ON DELETE SET NULL - without this, every pre-existing order with a saved
    address is one "delete address" click away from losing its ship-to details).
    Only touches rows with an empty snapshot, so it's safe to run on every startup."""
    inspector = inspect(engine)
    if "orders" not in inspector.get_table_names() or "addresses" not in inspector.get_table_names():
        return
    with engine.begin() as conn:
        conn.execute(text("""
            UPDATE orders o
            SET address_snapshot = jsonb_build_object(
                'full_name', a.full_name, 'phone', a.phone,
                'line1', a.line1, 'line2', a.line2,
                'city', a.city, 'state', a.state, 'pincode', a.pincode
            )::json
            FROM addresses a
            WHERE o.address_id = a.id
              AND (o.address_snapshot IS NULL OR o.address_snapshot::text = '{}')
        """))
    logger.info("Address snapshot backfill applied.")


def backfill_requires_photo_upload_fields(engine: Engine) -> None:
    """One-time (idempotent) migration for the old studio-only "Customer must
    upload a photo to order this" checkbox (Product.extra.requiresPhotoUpload)
    - now replaced by the generic Product.input_fields "Customer Questions"
    builder (an upload-type field with Required checked) so every page
    (studio/corporate/gifts) shares one mechanism instead of studio having its
    own separate one. Converts each flagged product's flag into an equivalent
    input_fields entry (skipped if it already has an upload field, so this
    never double-adds one) and strips the old flag, so existing products keep
    requiring a photo upload without the now-removed admin checkbox. Only
    touches rows still carrying the old flag, so it's safe to run on every
    startup."""
    inspector = inspect(engine)
    if "products" not in inspector.get_table_names():
        return
    with engine.begin() as conn:
        rows = conn.execute(text(
            "SELECT id, extra, input_fields FROM products WHERE extra->>'requiresPhotoUpload' = 'true'"
        )).fetchall()
        for row in rows:
            extra = dict(row.extra or {})
            extra.pop("requiresPhotoUpload", None)
            input_fields = list(row.input_fields or [])
            if not any(f.get("type") == "upload" for f in input_fields):
                input_fields.append({
                    "id": f"f_{uuid.uuid4().hex[:8]}",
                    "type": "upload",
                    "label": "Upload your photo",
                    "required": True,
                    "help_text": "",
                    "sort": len(input_fields),
                    "multiple": False,
                    "max_files": 1,
                    "options": [],
                    "multi_select": False,
                })
            conn.execute(
                text("UPDATE products SET extra = :extra, input_fields = :input_fields WHERE id = :id"),
                {"extra": json.dumps(extra), "input_fields": json.dumps(input_fields), "id": row.id},
            )
    if rows:
        logger.info("Migrated requiresPhotoUpload flag to input_fields for %d product(s).", len(rows))


def backfill_studio_quantity_purpose_fields(engine: Engine) -> None:
    """One-time (idempotent) migration folding Studio's separate "Order options"
    admin section (Product.extra.quantityOptions/purposeOptions, a priced
    quantity picker and a required size/purpose picker) into the generic
    Product.input_fields "Customer Questions" builder, so Studio no longer has
    its own separate extra-question mechanism. quantityOptions becomes a
    dropdown field with option_prices (picking an option still replaces the
    item's price, exactly as before); purposeOptions becomes a plain required
    dropdown. Only touches rows still carrying the old extra keys, so it's
    safe to run on every startup."""
    inspector = inspect(engine)
    if "products" not in inspector.get_table_names():
        return
    with engine.begin() as conn:
        rows = conn.execute(text("""
            SELECT p.id, p.extra, p.input_fields
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN site_pages sp ON c.page_id = sp.id
            WHERE sp.slug = 'studio'
              AND (p.extra->'quantityOptions' IS NOT NULL OR p.extra->'purposeOptions' IS NOT NULL)
        """)).fetchall()
        for row in rows:
            extra = dict(row.extra or {})
            input_fields = list(row.input_fields or [])
            sort = len(input_fields)

            qty_options = extra.pop("quantityOptions", None)
            qty_label = extra.pop("qtyLabel", None)
            if qty_options:
                option_prices = {o["label"]: o["price"] for o in qty_options if o.get("label") is not None}
                input_fields.append({
                    "id": f"f_{uuid.uuid4().hex[:8]}", "type": "dropdown",
                    "label": qty_label or "Quantity", "required": True, "help_text": "",
                    "sort": sort, "multiple": False, "max_files": 1,
                    "options": list(option_prices.keys()), "multi_select": False,
                    "option_prices": option_prices,
                })
                sort += 1

            purpose_options = extra.pop("purposeOptions", None)
            purpose_label = extra.pop("purposeLabel", None)
            if purpose_options:
                input_fields.append({
                    "id": f"f_{uuid.uuid4().hex[:8]}", "type": "dropdown",
                    "label": purpose_label or "Size / Purpose", "required": True, "help_text": "",
                    "sort": sort, "multiple": False, "max_files": 1,
                    "options": purpose_options, "multi_select": False,
                })

            conn.execute(
                text("UPDATE products SET extra = :extra, input_fields = :input_fields WHERE id = :id"),
                {"extra": json.dumps(extra), "input_fields": json.dumps(input_fields), "id": row.id},
            )
    if rows:
        logger.info("Migrated quantity/purpose options to input_fields for %d studio product(s).", len(rows))


def backfill_corporate_engraving_fields(engine: Engine) -> None:
    """One-time (idempotent) migration giving every corporate product the
    Customer Questions equivalent of the old hardcoded "Custom Logo &
    Engraving" box (a fixed text + logo-upload + technique picker shown
    unconditionally on every corporate product, never admin-configurable).
    Both the text and upload fields land as NOT required - the old box only
    required "text OR logo", which the required flag can't express as an
    either/or rule, so admin can turn either one on individually going
    forward instead. Only touches corporate products with no input_fields
    yet (true for all of them before this ran), so it's safe on every
    startup and never overwrites an admin's own Customer Questions setup."""
    inspector = inspect(engine)
    if "products" not in inspector.get_table_names():
        return
    with engine.begin() as conn:
        rows = conn.execute(text("""
            SELECT p.id
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN site_pages sp ON c.page_id = sp.id
            WHERE sp.slug = 'corporate'
              AND (p.input_fields IS NULL OR p.input_fields::text = '[]')
        """)).fetchall()
        for row in rows:
            input_fields = [
                {
                    "id": f"f_{uuid.uuid4().hex[:8]}", "type": "text",
                    "label": "Company name or text to engrave", "required": False, "help_text": "",
                    "sort": 0, "multiple": False, "max_files": 1, "options": [], "multi_select": False,
                },
                {
                    "id": f"f_{uuid.uuid4().hex[:8]}", "type": "upload",
                    "label": "Upload your logo", "required": False, "help_text": "",
                    "sort": 1, "multiple": False, "max_files": 1, "options": [], "multi_select": False,
                },
                {
                    "id": f"f_{uuid.uuid4().hex[:8]}", "type": "dropdown",
                    "label": "Customization technique", "required": False, "help_text": "",
                    "sort": 2, "multiple": False, "max_files": 1, "multi_select": False,
                    "options": ["Laser Engraved", "UV Color Print", "Foil Embossed"],
                },
            ]
            conn.execute(
                text("UPDATE products SET input_fields = :input_fields WHERE id = :id"),
                {"input_fields": json.dumps(input_fields), "id": row.id},
            )
    if rows:
        logger.info("Added default engraving/logo Customer Questions to %d corporate product(s).", len(rows))


def backfill_gifts_personalisation_fields(engine: Engine) -> None:
    """One-time (idempotent) migration giving every gift product the Customer
    Questions equivalent of the old hardcoded "Personalise this gift" box (a
    fixed photo upload + message text, always shown and always required on
    every gift product, never admin-configurable). Both fields land as
    required, matching that old unconditional rule exactly. Only touches
    gift products with no input_fields yet (true for all of them before
    this ran), so it's safe on every startup and never overwrites an
    admin's own Customer Questions setup."""
    inspector = inspect(engine)
    if "products" not in inspector.get_table_names():
        return
    with engine.begin() as conn:
        rows = conn.execute(text("""
            SELECT p.id
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN site_pages sp ON c.page_id = sp.id
            WHERE sp.slug = 'gifts'
              AND (p.input_fields IS NULL OR p.input_fields::text = '[]')
        """)).fetchall()
        for row in rows:
            input_fields = [
                {
                    "id": f"f_{uuid.uuid4().hex[:8]}", "type": "upload",
                    "label": "Upload your photo", "required": True, "help_text": "",
                    "sort": 0, "multiple": False, "max_files": 1, "options": [], "multi_select": False,
                },
                {
                    "id": f"f_{uuid.uuid4().hex[:8]}", "type": "text",
                    "label": "Name or message to add", "required": True, "help_text": "",
                    "sort": 1, "multiple": False, "max_files": 1, "options": [], "multi_select": False,
                },
            ]
            conn.execute(
                text("UPDATE products SET input_fields = :input_fields WHERE id = :id"),
                {"input_fields": json.dumps(input_fields), "id": row.id},
            )
    if rows:
        logger.info("Added default photo/message Customer Questions to %d gift product(s).", len(rows))
