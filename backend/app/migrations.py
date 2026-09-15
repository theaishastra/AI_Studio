import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger("migrations")

# Base.metadata.create_all() (see main.py) only creates TABLES that don't exist
# yet - it never ALTERs a table that's already there. So any column added to an
# existing model needs an explicit, idempotent backfill here. Every column below
# is nullable with no backfill requirement, so re-running this is always a no-op
# once applied and never touches existing row data or other services' tables.
_COLUMN_MIGRATIONS: dict[str, list[str]] = {
    "products": [
        "ADD COLUMN IF NOT EXISTS address_change_window_hours INTEGER",
        "ADD COLUMN IF NOT EXISTS input_fields JSON DEFAULT '[]'::json",
    ],
    "orders": [
        "ADD COLUMN IF NOT EXISTS carrier VARCHAR(80)",
        "ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(120)",
        "ADD COLUMN IF NOT EXISTS tracking_url TEXT",
        "ADD COLUMN IF NOT EXISTS expected_delivery DATE",
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
