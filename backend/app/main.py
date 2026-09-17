import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import Response
from starlette.types import Scope

from .config import get_settings
from .database import Base, engine
from .migrations import backfill_address_snapshots, run_column_migrations, run_index_migrations
from .routers import addresses, admin, auth, bookings, cart, catalog, contact, orders, payments, wishlist
from .services.storage import ensure_storage_ready

settings = get_settings()

BACKEND_DIR = Path(__file__).resolve().parent.parent
ADMIN_DIR = BACKEND_DIR.parent / "admin"
MEDIA_DIR = BACKEND_DIR / "storage" / "media"


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_column_migrations(engine)
    run_index_migrations(engine)
    backfill_address_snapshots(engine)
    ensure_storage_ready()
    catalog.warm_catalog_cache()
    yield


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

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(catalog.reviews_router)
app.include_router(bookings.router)
app.include_router(contact.router)
app.include_router(addresses.router)
app.include_router(cart.router)
app.include_router(wishlist.router)
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
def health():
    return {"status": "ok"}
