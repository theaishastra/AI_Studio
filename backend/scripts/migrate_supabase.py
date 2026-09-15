"""
One-off data migration: copy every table (schema + rows) from the old Supabase
Postgres project to a new one, in FK-safe order, using the app's own SQLAlchemy
models as the source of truth for schema (same approach main.py uses on startup).

Usage (run from `backend/`, with the venv active):

    cd backend
    python scripts/migrate_supabase.py --target "postgresql://postgres.NEWREF:PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres"

Optional:
    --source "postgresql://..."   defaults to DATABASE_URL in backend/.env (the OLD project)
    --wipe-target                 delete existing rows in the target tables first (safe to
                                   re-run the script this way); without it, rows are only
                                   inserted, which will fail on a second run due to PK conflicts.

Always use the "Session pooler" connection string (aws-0-<region>.pooler.supabase.com),
not the direct db.<ref>.supabase.co host - the direct host is IPv6-only on new Supabase
projects and commonly fails to resolve/connect from Windows/most home networks.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # backend/, so `app` is importable

from sqlalchemy import create_engine  # noqa: E402

from app.database import Base  # noqa: E402
from app import models  # noqa: E402  (registers all tables on Base.metadata)
from app.migrations import run_column_migrations, run_index_migrations  # noqa: E402
from app.config import get_settings  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=None, help="Old Supabase DATABASE_URL (defaults to backend/.env)")
    parser.add_argument("--target", required=True, help="New Supabase DATABASE_URL")
    parser.add_argument("--wipe-target", action="store_true", help="Delete existing target rows before inserting")
    args = parser.parse_args()

    source_url = args.source or get_settings().database_url
    target_url = args.target

    if source_url == target_url:
        raise SystemExit("Source and target URLs are identical - refusing to run.")

    source_engine = create_engine(source_url)
    target_engine = create_engine(target_url)

    print(f"Source: {source_engine.url.render_as_string(hide_password=True)}")
    print(f"Target: {target_engine.url.render_as_string(hide_password=True)}")

    print("\n[1/4] Creating schema on target (Base.metadata.create_all)...")
    Base.metadata.create_all(bind=target_engine)
    run_column_migrations(target_engine)
    run_index_migrations(target_engine)
    print("Schema ready.")

    tables = Base.metadata.sorted_tables  # topological order, respects FKs

    if args.wipe_target:
        print("\n[2/4] Wiping existing rows in target tables (reverse FK order)...")
        with target_engine.begin() as conn:
            for table in reversed(tables):
                conn.execute(table.delete())
    else:
        print("\n[2/4] Skipping wipe (pass --wipe-target to clear target first).")

    print("\n[3/4] Copying rows table by table...")
    totals = []
    with source_engine.connect() as src_conn, target_engine.begin() as dst_conn:
        for table in tables:
            rows = src_conn.execute(table.select()).mappings().all()
            if rows:
                batch_size = 500
                for i in range(0, len(rows), batch_size):
                    batch = [dict(r) for r in rows[i:i + batch_size]]
                    dst_conn.execute(table.insert(), batch)
            totals.append((table.name, len(rows)))
            print(f"  {table.name:40s} {len(rows):6d} rows")

    print("\n[4/4] Verifying row counts on target...")
    mismatches = []
    with target_engine.connect() as conn:
        for name, expected in totals:
            actual = conn.execute(Base.metadata.tables[name].select()).mappings().all()
            actual_count = len(actual)
            status = "OK" if actual_count == expected else "MISMATCH"
            if actual_count != expected:
                mismatches.append(name)
            print(f"  {name:40s} source={expected:6d} target={actual_count:6d}  {status}")

    if mismatches:
        print(f"\nDone WITH MISMATCHES in: {', '.join(mismatches)}")
        sys.exit(1)
    print("\nDone. All row counts match.")


if __name__ == "__main__":
    main()
