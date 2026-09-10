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
    ],
    "orders": [
        "ADD COLUMN IF NOT EXISTS carrier VARCHAR(80)",
        "ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(120)",
        "ADD COLUMN IF NOT EXISTS tracking_url TEXT",
        "ADD COLUMN IF NOT EXISTS expected_delivery DATE",
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
