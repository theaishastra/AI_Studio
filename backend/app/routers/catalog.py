import logging
import re
import threading
import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from ..database import SessionLocal, get_db
from ..deps import get_current_user
from ..models import Category, Coupon, Media, Product, Review, Setting, SitePage, User
from ..schemas import ReviewIn, ReviewOut
from ..services.storage import get_or_create_thumbnail, warm_thumbnails

logger = logging.getLogger("catalog")

router = APIRouter(prefix="/api/catalog", tags=["catalog"])

HOMEPAGE_KEY = "homepage_layout"  # same Setting row admin.py's homepage builder writes

# page_bundle() below is this app's most-requested endpoint (every storefront page
# loads it on every visit) and its most expensive - it costs 3-4 sequential round
# trips to the Supabase DB, which alone runs ~1.4-1.6s (measured) because the DB
# is in a different region from wherever this API is served. That per-request cost
# can't be fixed by better queries; caching the response is what removes it, since
# this data (categories/products/portfolio images) only changes when an admin edits
# it. The TTL below only bounds staleness for a change made *outside* this app
# (a direct DB edit) - every admin write endpoint already calls
# invalidate_catalog_cache() right after commit, so a normal admin edit is live
# immediately regardless of TTL. That means the TTL can be generous (minutes, not
# seconds) purely to cut how often a visitor pays the ~1.5s DB round trip, with
# no real staleness cost.
_PAGE_BUNDLE_CACHE_TTL_SECONDS = 300
# Bumped by invalidate_catalog_cache() on every admin write. A build that started
# before the bump but finishes after it is writing data queried before the edit -
# without this guard it would overwrite the freshly-cleared cache with that stale
# result (the admin's change then stays invisible on the storefront for up to a
# full TTL instead of the "live immediately" every write endpoint promises). Each
# cache-populating block below captures this value before its DB read and only
# writes back if it's unchanged, so a straggling build just quietly discards its
# result instead of clobbering a newer one.
_cache_generation = 0
_page_bundle_cache: dict[str, tuple[float, dict]] = {}
# One lock per page_slug so concurrent requests landing in the same cold window
# don't all independently pay the ~1.5s DB cost - the first one populates the
# cache, the rest just wait on the lock and then read what it wrote.
_page_bundle_locks: dict[str, threading.Lock] = {}
_page_bundle_locks_guard = threading.Lock()


def _lock_for(page_slug: str) -> threading.Lock:
    with _page_bundle_locks_guard:
        return _page_bundle_locks.setdefault(page_slug, threading.Lock())


_WESERV_SKIP = re.compile(r"^https?://(localhost|127\.0\.0\.1)")


def cld_optimize(url: str | None) -> str | None:
    """Shrinks an R2 image URL down to a small WebP thumbnail before it's embedded in
    page_bundle() JSON, instead of shipping the ~500KB-1MB originals as-is for what's
    usually rendered as a card thumbnail. Runs Pillow in-process via
    storage.get_or_create_thumbnail() (cached permanently in R2 - see that function),
    which is the Python-library replacement for the images.weserv.nl proxy this used
    to call (each storefront page's hardcoded catalog data uses a precomputed
    js/shared/thumb-map.js instead - a browser can't run Pillow, and this app has
    no runtime resize endpoint at all - see scripts/generate_thumbnails.py).
    Anything that isn't one of this app's own R2 URLs (localhost dev media, legacy
    /media/ paths) passes through unchanged rather than failing the request."""
    if not url or _WESERV_SKIP.match(url):
        return url
    return get_or_create_thumbnail(url) or url


def format_price(product: Product) -> str:
    """Most products show a real price; a quote-based service (equipment add-ons like
    Drone/Traditional Videography) is flagged with extra.price_on_request instead of
    a fake ₹0, so the storefront shows "On Request" rather than formatting that 0."""
    if (product.extra or {}).get("price_on_request"):
        return "On Request"
    return format_inr(product.price)


def format_inr(value) -> str:
    n = int(round(float(value)))
    s = str(abs(n))
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        s = ",".join(groups + [tail])
    sign = "-" if n < 0 else ""
    return f"{sign}₹{s}"


@router.get("/pages")
def list_pages(db: Session = Depends(get_db)):
    pages = db.query(SitePage).filter(SitePage.is_active == True).order_by(SitePage.sort).all()
    return [{"slug": p.slug, "name": p.name} for p in pages]


@router.get("/offers")
def active_offers(placement: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Coupon).filter(Coupon.is_active == True)
    if placement:
        query = query.filter(Coupon.placement == placement)
    coupons = query.order_by(Coupon.created_at.desc()).all()
    return [
        {
            "code": c.code, "type": c.type, "value": float(c.value), "title": c.title,
            "banner_image": c.banner_image, "placement": c.placement,
            "min_order": float(c.min_order), "max_discount": float(c.max_discount) if c.max_discount else None,
        }
        for c in coupons
    ]


@router.get("/{page_slug}")
def page_bundle(page_slug: str, db: Session = Depends(get_db)):
    """Assembles one page's full storefront data set — categories, tiered packages,
    portfolio galleries, hero carousel — in one call, replacing what used to be
    hardcoded CATEGORIES/PACKAGES/FOLIO/HERO literals in that page's JS file."""
    cached = _page_bundle_cache.get(page_slug)
    if cached and time.monotonic() - cached[0] < _PAGE_BUNDLE_CACHE_TTL_SECONDS:
        return cached[1]

    # Only the first request in a cold window actually hits the DB; anyone else
    # landing here at the same time just waits on this lock and then reads the
    # cache entry that request filled in, instead of each paying the ~1.5s cost.
    with _lock_for(page_slug):
        cached = _page_bundle_cache.get(page_slug)
        if cached and time.monotonic() - cached[0] < _PAGE_BUNDLE_CACHE_TTL_SECONDS:
            return cached[1]
        gen = _cache_generation
        result = _build_page_bundle(page_slug, db)
        if gen == _cache_generation:
            _page_bundle_cache[page_slug] = (time.monotonic(), result)
        return result


def _build_page_bundle(page_slug: str, db: Session) -> dict:
    page = db.query(SitePage).filter(SitePage.slug == page_slug, SitePage.is_active == True).first()
    if not page:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Page not found")

    # Filter is_active/kind at the relationship-load level (not after, in Python) -
    # this page is assembled from a remote DB, so every inactive product/wrong-kind
    # media row skipped here is a row that never has to cross that network round trip.
    categories = (
        db.query(Category)
        .options(
            selectinload(Category.products.and_(Product.is_active == True))
            .selectinload(Product.media.and_(Media.kind == "package")),
            selectinload(Category.media.and_(Media.kind == "portfolio")),
        )
        .filter(Category.page_id == page.id, Category.is_active == True)
        .order_by(Category.sort, Category.name)
        .all()
    )

    # One grouped query for every product's average rating, instead of one query per
    # product. Scoped to just this page's products, not a site-wide reviews scan.
    all_product_ids = [p.id for c in categories for p in c.products]
    ratings: dict[str, float] = {}
    if all_product_ids:
        rating_rows = (
            db.query(Review.product_id, func.avg(Review.rating))
            .filter(Review.product_id.in_(all_product_ids), Review.is_approved == True)
            .group_by(Review.product_id)
            .all()
        )
        ratings = {pid: round(float(avg), 1) for pid, avg in rating_rows}

    cat_list, packages, folio, folio_titles = [], {}, {}, {}
    category_images, hero = {}, []

    for c in categories:
        cat_list.append({
            "id": c.slug,
            "icon": c.icon or "",
            "name": c.name,
            "description": c.description or "",
            "image": cld_optimize(c.thumb_image_url) or "",
            "group_label": c.group_label,
        })

        # Both relationships already carry `order_by` (Product.sort / Media.sort),
        # so c.products / c.media / p.media arrive pre-sorted - no Python re-sort needed.
        active_products = c.products
        # Each product carries its own id/images inline now, instead of a separate
        # package_images dict keyed by "category|tier" - that scheme assumed a small
        # fixed set of tiers per category (true for photography's Standard/Premium/
        # Platinum) but silently collided for flat multi-product categories with no
        # real tier (studio/corporate/gifts), where every product shares an empty
        # tier and would otherwise overwrite each other's images under one key.
        packages[c.slug] = [
            {
                "id": p.id,
                "tier": p.tier or "",
                "title": p.title,
                "description": p.description or "",
                "price": format_price(p),
                "mrp": format_inr(p.mrp) if p.mrp else None,
                "feat": p.features or [],
                "images": [cld_optimize(m.url) for m in p.media],
                "rating": ratings.get(p.id),
                "extra": p.extra or {},
                "input_fields": p.input_fields or [],
                "delivery_days": p.delivery_days,
            }
            for p in active_products
        ]

        folio[c.slug] = [{"url": cld_optimize(m.url), "caption": m.alt} for m in c.media]
        folio_titles[c.slug] = c.folio_title or f"{c.name} Portfolio"

        if c.hero_image_url:
            category_images[c.slug] = cld_optimize(c.hero_image_url)

        if c.show_in_hero and c.hero_image_url:
            hero.append({"id": c.slug, "title": c.name, "tag": c.hero_tagline or "", "img": cld_optimize(c.hero_image_url)})

    result = {
        "page": page.slug,
        "categories": cat_list,
        "packages": packages,
        "folio": folio,
        "folio_titles": folio_titles,
        "category_images": category_images,
        "hero": hero,
    }
    return result


@router.get("/product/{product_id}")
def get_product(product_id: str, db: Session = Depends(get_db)):
    """One product's authoritative record, by id. booking.html fetches this instead
    of trusting the price/tier/features it was linked with in its own URL query
    string — those are only ever a display hint from the page that built the link,
    never something a visitor should be able to edit by hand before checkout."""
    product = (
        db.query(Product)
        .options(selectinload(Product.media), selectinload(Product.category))
        .filter(Product.id == product_id, Product.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")

    avg_rating = (
        db.query(func.avg(Review.rating))
        .filter(Review.product_id == product.id, Review.is_approved == True)
        .scalar()
    )

    category = product.category
    package_media = sorted([m for m in product.media if m.kind == "package"], key=lambda m: m.sort)
    return {
        "id": product.id,
        "category": {"id": category.slug, "name": category.name, "icon": category.icon or ""},
        "tier": product.tier or "",
        "title": product.title,
        "description": product.description or "",
        "price": format_price(product),
        "mrp": format_inr(product.mrp) if product.mrp else None,
        "feat": product.features or [],
        "images": [cld_optimize(m.url) for m in package_media],
        "rating": round(float(avg_rating), 1) if avg_rating else None,
        "extra": product.extra or {},
        "input_fields": product.input_fields or [],
        "delivery_days": product.delivery_days,
    }


# ---------------------------------------------------------------- other public, unprefixed
# endpoints (reviews, homepage, flat product listing) that don't fit under /api/catalog/*

reviews_router = APIRouter(tags=["reviews"])

_homepage_cache: dict[str, tuple[float, dict]] = {}
_products_cache: dict[str, tuple[float, list]] = {}


def invalidate_catalog_cache() -> None:
    """Clears every storefront cache (page bundles, homepage, flat product list) so
    an admin's change is live on the next request instead of waiting out the 30s
    TTL. Admin write endpoints call this right after commit. Clearing is O(1) and
    always safe - worst case the next visitor's request just pays the one DB round
    trip that would've happened anyway once the TTL expired, then re-caches."""
    global _cache_generation
    _cache_generation += 1
    _page_bundle_cache.clear()
    _homepage_cache.clear()
    _products_cache.clear()


def warm_catalog_cache() -> None:
    """Called once at app startup (see main.py's lifespan) so the *first* real
    visitor after a deploy/restart doesn't land on a cold cache and pay the
    ~1.5s Supabase round trip that page_bundle()/public_homepage() would
    otherwise only pay on demand. Best-effort: a failure here (e.g. DB not
    reachable yet) just means the first real request warms the cache the
    normal way instead - it must never block or crash startup."""
    # Every image page_bundle()/public_homepage() touch below goes through
    # cld_optimize() -> storage.get_or_create_thumbnail(), a real R2 round trip
    # (~300ms even on a cache hit, much more on a first-ever cold generate).
    # Warming all of them concurrently first means the sequential page_bundle()
    # calls that follow just hit get_or_create_thumbnail's in-process memo - the
    # difference between a few seconds and several minutes of startup at this
    # image count (see warm_thumbnails()). The url list is gathered through its
    # own short-lived session, closed *before* that network-bound call - holding
    # a session open across a 100s+ call would leave a long "idle in transaction"
    # connection, which is exactly what can block a concurrent migration's
    # ALTER TABLE from acquiring its lock.
    try:
        warm_db = SessionLocal()
        try:
            urls = [r[0] for r in warm_db.query(Media.url).all()]
            for thumb, hero in warm_db.query(Category.thumb_image_url, Category.hero_image_url).all():
                urls += [u for u in (thumb, hero) if u]
        finally:
            warm_db.close()
        warm_thumbnails(urls)
    except Exception:
        logger.warning("Thumbnail warm-up failed", exc_info=True)

    db = SessionLocal()
    try:
        slugs = [p.slug for p in db.query(SitePage).filter(SitePage.is_active == True).all()]
        for slug in slugs:
            try:
                page_bundle(slug, db)
            except Exception:
                logger.warning("Cache warm-up failed for page %r", slug, exc_info=True)
        try:
            public_homepage(db)
        except Exception:
            logger.warning("Cache warm-up failed for homepage", exc_info=True)
    finally:
        db.close()


@reviews_router.get("/api/homepage")
def public_homepage(db: Session = Depends(get_db)):
    """Public, unauthenticated equivalent of admin's homepage builder (admin.py's
    get_homepage) - resolves the curated layout into the actual featured
    categories/products a visitor's index.html should render, rather than the
    admin version's full "pick from everything" list (which is every active
    product site-wide - far more than a homepage needs)."""
    cached = _homepage_cache.get("v")
    if cached and time.monotonic() - cached[0] < _PAGE_BUNDLE_CACHE_TTL_SECONDS:
        return cached[1]
    gen = _cache_generation

    setting = db.get(Setting, HOMEPAGE_KEY)
    layout = setting.value if setting else {}
    category_ids = layout.get("category_ids", [])
    product_ids = layout.get("product_ids", [])

    if category_ids:
        cats = db.query(Category).filter(Category.is_active == True, Category.id.in_(category_ids)).all()
        cat_by_id = {c.id: c for c in cats}
        ordered_cats = [cat_by_id[i] for i in category_ids if i in cat_by_id]
    else:
        # Nothing curated yet - fall back to the first few active categories so
        # the homepage is never blank before an admin sets up the layout.
        ordered_cats = db.query(Category).filter(Category.is_active == True).order_by(Category.sort).limit(8).all()

    if product_ids:
        prods = (
            db.query(Product).options(selectinload(Product.media))
            .filter(Product.is_active == True, Product.id.in_(product_ids)).all()
        )
        prod_by_id = {p.id: p for p in prods}
        ordered_prods = [prod_by_id[i] for i in product_ids if i in prod_by_id]
    else:
        # Nothing curated yet - fall back to the first few active products so
        # the homepage is never blank before an admin sets up the layout.
        ordered_prods = (
            db.query(Product).options(selectinload(Product.media))
            .filter(Product.is_active == True)
            .order_by(Product.sort).limit(8).all()
        )

    result = {
        "categories": [
            {"id": c.id, "slug": c.slug, "name": c.name, "image": cld_optimize(c.thumb_image_url or c.hero_image_url)}
            for c in ordered_cats
        ],
        "products": [
            {
                "id": p.id, "title": p.title,
                "image": cld_optimize(p.media[0].url) if p.media else None,
                "price": float(p.price),
            }
            for p in ordered_prods
        ],
    }
    if gen == _cache_generation:
        _homepage_cache["v"] = (time.monotonic(), result)
    return result


@reviews_router.get("/api/products")
def public_products(category_id: str | None = None, page: int = 1, page_size: int = 24, db: Session = Depends(get_db)):
    """Public flat product listing across every category/page - what catalog.html's
    browse-all/wishlist view needs. Mirrors admin's GET /api/admin/products but
    public and is_active-only. The full active-product set is small (low hundreds
    of rows), so it's cached whole for 30s and paginated in Python rather than
    re-querying per page/filter combination."""
    cached = _products_cache.get("v")
    if not (cached and time.monotonic() - cached[0] < _PAGE_BUNDLE_CACHE_TTL_SECONDS):
        gen = _cache_generation
        rows = (
            db.query(Product)
            .options(
                selectinload(Product.media),
                selectinload(Product.category).selectinload(Category.page),
            )
            .filter(Product.is_active == True)
            .order_by(Product.sort)
            .all()
        )
        serialized = [
            {
                "id": p.id, "title": p.title, "slug": p.slug,
                "description": p.description or "",
                "price": float(p.price), "mrp": float(p.mrp) if p.mrp else None,
                "images": [cld_optimize(m.url) for m in p.media],
                "category_id": p.category_id,
                "category_slug": p.category.slug if p.category else None,
                "category_name": p.category.name if p.category else None,
                # Which storefront tab (gifts/photography/studio/corporate) this product
                # belongs under - needed by any page-agnostic search (nav search dropdown,
                # catalog.html) to link back to the right place / category filter.
                "page_slug": p.category.page.slug if p.category and p.category.page else None,
            }
            for p in rows
        ]
        cached = (time.monotonic(), serialized)
        if gen == _cache_generation:
            _products_cache["v"] = cached
    all_products = cached[1]

    filtered = [p for p in all_products if not category_id or p["category_id"] == category_id]
    total = len(filtered)
    start = (page - 1) * page_size
    return {
        "items": filtered[start:start + page_size],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@reviews_router.get("/api/products/{slug}/reviews", response_model=list[ReviewOut])
def product_reviews(slug: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    rows = (
        db.query(Review, User.name)
        .join(User, Review.user_id == User.id)
        .filter(Review.product_id == product.id, Review.is_approved == True)
        .order_by(Review.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        ReviewOut(rating=r.rating, comment=r.comment, name=name or "Customer", created_at=r.created_at)
        for r, name in rows
    ]


@reviews_router.post("/api/reviews", status_code=status.HTTP_201_CREATED)
def submit_review(body: ReviewIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == body.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")

    review = db.query(Review).filter(Review.product_id == body.product_id, Review.user_id == user.id).first()
    if review:
        review.rating = body.rating
        review.comment = body.comment
    else:
        db.add(Review(product_id=body.product_id, user_id=user.id, rating=body.rating, comment=body.comment))

    db.commit()
    return {"message": "Review saved"}
