import asyncio
import contextlib
import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.exc import DataError
from starlette.responses import Response
from starlette.types import Scope

from .config import get_settings
from .database import Base, engine
from .migrations import (
    backfill_address_snapshots, backfill_corporate_engraving_fields,
    backfill_gifts_personalisation_fields, backfill_requires_photo_upload_fields,
    backfill_studio_quantity_purpose_fields, run_check_constraint_migrations, run_column_migrations,
    run_constraint_migrations, run_index_migrations,
)
from .routers import (
    addresses, admin, auth, bookings, cart, catalog, contact, notifications, orders, payments, wishlist,
)
from .routers.orders import expire_stale_reservations
from .services.storage import ensure_storage_ready

settings = get_settings()
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parent.parent
ADMIN_DIR = BACKEND_DIR.parent / "admin"
MEDIA_DIR = BACKEND_DIR / "storage" / "media"

# How often the reservation sweep below checks for abandoned, unpaid orders to
# expire. Frequent enough that an abandoned cart doesn't sit on real stock much
# past orders.RESERVATION_TTL_MINUTES; infrequent enough to be a non-event for
# the DB (this is a handful of orders at most on this app's traffic).
RESERVATION_SWEEP_INTERVAL_SECONDS = 5 * 60


async def _reservation_sweep_loop():
    """Runs for the lifetime of the process, periodically releasing the
    checkout-time stock reservation (see services/inventory.py) held by orders
    nobody ever paid for. Single in-process loop, same single-instance
    assumption already documented for this app's other in-process state (see
    AUDIT_REPORT.md H9/H11/M7) - would need to move to a real scheduler/lock
    before running more than one instance of this app at once, or two
    instances could both sweep the same order at the same time. A failed sweep
    just waits for the next interval rather than crashing the loop - the
    consequence of a missed sweep is a delayed restock, not data loss."""
    while True:
        await asyncio.sleep(RESERVATION_SWEEP_INTERVAL_SECONDS)
        try:
            expired = await run_in_threadpool(expire_stale_reservations)
            if expired:
                logger.info("Reservation sweep expired %d abandoned order(s)", expired)
        except Exception:
            logger.warning("Reservation sweep failed", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_column_migrations(engine)
    run_index_migrations(engine)
    run_constraint_migrations(engine)
    run_check_constraint_migrations(engine)
    backfill_address_snapshots(engine)
    backfill_requires_photo_upload_fields(engine)
    backfill_studio_quantity_purpose_fields(engine)
    backfill_corporate_engraving_fields(engine)
    backfill_gifts_personalisation_fields(engine)
    ensure_storage_ready()
    catalog.warm_catalog_cache()
    sweep_task = asyncio.create_task(_reservation_sweep_loop())
    yield
    sweep_task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await sweep_task


app = FastAPI(
    title="Sai Kumar Studio API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    # Server-side processing time (route handler + DB round trips), exposed so
    # latency testing can separate "backend+DB" time from pure network transit.
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time-Ms"] = f"{(time.perf_counter() - start) * 1000:.1f}"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
# Compresses every JSON/text response over 1KB - page_bundle() and friends ship
# a few hundred products' worth of JSON per storefront page load, and gzip
# shrinks that ~70-80% for free on any client that sends Accept-Encoding: gzip
# (every browser).
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.exception_handler(DataError)
async def data_error_handler(request: Request, exc: DataError):
    # Every primary key in this schema is a Postgres UUID column. A path/query
    # param that isn't a well-formed UUID (garbage input, a stale/corrupted
    # localStorage id, a scanner probing the API) makes psycopg2 raise this
    # deep inside the query - it's a malformed-identifier request, not a server
    # fault, so it must not surface as an unhandled 500.
    return JSONResponse(status_code=400, content={"detail": "Invalid identifier"})


app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(catalog.reviews_router)
app.include_router(bookings.router)
app.include_router(contact.router)
app.include_router(addresses.router)
app.include_router(cart.router)
app.include_router(wishlist.router)
app.include_router(notifications.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(admin.router)

if ADMIN_DIR.exists():
    app.mount("/admin", StaticFiles(directory=ADMIN_DIR, html=True), name="admin")


class CachedStaticFiles(StaticFiles):
    """/media filenames are random tokens minted fresh per upload (media.py's
    secrets.token_hex) - a given URL's content never changes, so it's safe to tell
    browsers/CDNs to cache it forever instead of revalidating on every repeat view."""

    async def get_response(self, path: str, scope: Scope) -> Response:
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response


MEDIA_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/media", CachedStaticFiles(directory=MEDIA_DIR), name="media")


@app.get("/api/health")
def health(response: Response):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        response.status_code = 503
        return {"status": "error", "detail": "database unreachable"}
    return {"status": "ok"}
