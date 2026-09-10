from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .database import Base, engine
from .routers import addresses, admin, auth, bookings, cart, catalog, orders, payments

settings = get_settings()

BACKEND_DIR = Path(__file__).resolve().parent.parent
ADMIN_DIR = BACKEND_DIR.parent / "admin"
MEDIA_DIR = BACKEND_DIR / "storage" / "media"


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sai Kumar Studio API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(catalog.reviews_router)
app.include_router(bookings.router)
app.include_router(addresses.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(admin.router)

if ADMIN_DIR.exists():
    app.mount("/admin", StaticFiles(directory=ADMIN_DIR, html=True), name="admin")

MEDIA_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")


@app.get("/api/health")
def health():
    return {"status": "ok"}
