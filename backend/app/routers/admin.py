import csv
import io
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import audit, require_owner, require_staff
from ..models import (
    Address, AuditLog, Booking, Category, Coupon, Media, Order,
    OrderAddressChangeRequest, OrderCancellationRequest, OrderTrackingEvent,
    Product, Review, Setting, SitePage, User,
)
from ..schemas import (
    AddressChangeDecisionIn, AdminAddressChangeRequestOut, AdminCancellationRequestOut,
    ArrangeIn, BookingOut, BookingStatusUpdate, CancellationDecisionIn, CategoryIn, CategoryOut,
    CouponIn, CouponOut, CustomerOut, HomepageLayoutIn, MediaIn, MediaOut, OrderOut,
    OrderStatusUpdate, ProductIn, ProductOut, ProductPatch, SettingIn, SettingOut, SitePageIn,
    SitePageOut, StaffIn, TrackingUpdateIn, UserOut,
)
from ..security import hash_password
from ..services.media import process_image
from ..services.notifications import notify, order_event
from ..services.policy import annotate_order
from .catalog import invalidate_catalog_cache

router = APIRouter(prefix="/api/admin", tags=["admin"])

ORDER_STATUS_TRACKING_TITLES = {
    "created": "Order placed",
    "payment_pending": "Awaiting payment",
    "cod_confirmed": "Order confirmed (Cash on Delivery)",
    "paid": "Payment received",
    "in_production": "Order in production",
    "shipped": "Order shipped",
    "delivered": "Order delivered",
    "cancelled": "Order cancelled",
    "refunded": "Order refunded",
}

ORDER_ADMIN_LOAD = (
    selectinload(Order.items), selectinload(Order.payments),
    selectinload(Order.user), selectinload(Order.address),
    selectinload(Order.tracking_events),
    selectinload(Order.cancellation_requests),
    selectinload(Order.address_change_requests),
)

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
MEDIA_DIR = BACKEND_DIR / "storage" / "media"
HOMEPAGE_KEY = "homepage_layout"


# ---------------------------------------------------------------- dashboard

@router.get("/summary")
def dashboard_summary(admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    from sqlalchemy import func as sa_func, select

    paid_statuses = ("cod_confirmed", "paid", "in_production", "shipped", "delivered")
    row = db.execute(
        select(
            select(sa_func.count()).select_from(SitePage).scalar_subquery().label("pages"),
            select(sa_func.count()).select_from(Category).scalar_subquery().label("categories"),
            select(sa_func.count()).select_from(Product).scalar_subquery().label("products"),
            select(sa_func.count()).select_from(Coupon)
                .where(Coupon.is_active == True).scalar_subquery().label("coupons"),
            select(sa_func.count()).select_from(Booking)
                .where(Booking.status.in_(["enquiry", "advance_pending"]))
                .scalar_subquery().label("bookings_pending"),
            select(sa_func.count()).select_from(Booking).scalar_subquery().label("bookings_total"),
            select(sa_func.count()).select_from(Order)
                .where(Order.status.in_(["created", "payment_pending"]))
                .scalar_subquery().label("orders_pending"),
            select(sa_func.count()).select_from(Order).scalar_subquery().label("orders_total"),
            select(sa_func.coalesce(sa_func.sum(Order.total), 0))
                .where(Order.status.in_(paid_statuses)).scalar_subquery().label("revenue"),
            select(sa_func.count()).select_from(OrderCancellationRequest)
                .where(OrderCancellationRequest.status == "pending")
                .scalar_subquery().label("cancellation_requests_pending"),
            select(sa_func.count()).select_from(OrderAddressChangeRequest)
                .where(OrderAddressChangeRequest.status == "pending")
                .scalar_subquery().label("address_change_requests_pending"),
        )
    ).one()
    return {
        "pages": row.pages,
        "categories": row.categories,
        "products": row.products,
        "coupons": row.coupons,
        "bookings_pending": row.bookings_pending,
        "bookings_total": row.bookings_total,
        "orders_pending": row.orders_pending,
        "orders_total": row.orders_total,
        "revenue": float(row.revenue),
        "cancellation_requests_pending": row.cancellation_requests_pending,
        "address_change_requests_pending": row.address_change_requests_pending,
    }


# ---------------------------------------------------------------- site pages

@router.get("/pages", response_model=list[SitePageOut])
def list_pages(admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    return db.query(SitePage).order_by(SitePage.sort).all()


@router.post("/pages", response_model=SitePageOut, status_code=status.HTTP_201_CREATED)
def create_page(body: SitePageIn, request: Request,
                admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    if db.query(SitePage).filter(SitePage.slug == body.slug).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Slug already exists")
    page = SitePage(**body.model_dump())
    db.add(page)
    db.flush()
    audit(db, admin, "create", "site_page", page.id, {"slug": page.slug}, request)
    db.commit()
    db.refresh(page)
    return page


# ---------------------------------------------------------------- categories

def _category_out(c: Category) -> CategoryOut:
    return CategoryOut.model_validate(c)


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(page: str | None = None, admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    query = db.query(Category)
    if page:
        site_page = db.query(SitePage).filter(SitePage.slug == page).first()
        if not site_page:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Page not found")
        query = query.filter(Category.page_id == site_page.id)
    return query.order_by(Category.sort, Category.name).all()


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(body: CategoryIn, request: Request,
                    admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    if not db.get(SitePage, body.page_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Page not found")
    clash = db.query(Category).filter(Category.page_id == body.page_id, Category.slug == body.slug).first()
    if clash:
        raise HTTPException(status.HTTP_409_CONFLICT, "Slug already exists on this page")
    cat = Category(**body.model_dump())
    db.add(cat)
    db.flush()
    audit(db, admin, "create", "category", cat.id, {"name": cat.name}, request)
    db.commit()
    db.refresh(cat)
    invalidate_catalog_cache()
    return _category_out(cat)


@router.put("/categories/{cat_id}", response_model=CategoryOut)
def update_category(cat_id: str, body: CategoryIn, request: Request,
                    admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    cat = db.get(Category, cat_id)
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    clash = (
        db.query(Category)
        .filter(Category.page_id == body.page_id, Category.slug == body.slug, Category.id != cat_id)
        .first()
    )
    if clash:
        raise HTTPException(status.HTTP_409_CONFLICT, "Slug already exists on this page")
    for key, value in body.model_dump().items():
        setattr(cat, key, value)
    audit(db, admin, "update", "category", cat.id, {"name": cat.name}, request)
    db.commit()
    db.refresh(cat)
    invalidate_catalog_cache()
    return _category_out(cat)


@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(cat_id: str, request: Request,
                    admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    cat = db.get(Category, cat_id)
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    audit(db, admin, "delete", "category", cat_id, {"name": cat.name}, request)
    db.delete(cat)
    db.commit()
    invalidate_catalog_cache()


# ---------------------------------------------------------------- category portfolio media

@router.get("/categories/{cat_id}/media", response_model=list[MediaOut])
def list_category_media(cat_id: str, admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    cat = db.get(Category, cat_id)
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    return sorted([m for m in cat.media if m.kind == "portfolio"], key=lambda m: m.sort)


@router.post("/categories/{cat_id}/media", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
def add_category_media(cat_id: str, body: MediaIn, request: Request,
                       admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    cat = db.get(Category, cat_id)
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    media = Media(category_id=cat_id, **body.model_dump())
    db.add(media)
    audit(db, admin, "create", "category_media", cat_id, {"url": media.url}, request)
    db.commit()
    db.refresh(media)
    invalidate_catalog_cache()
    return media


@router.delete("/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_media(media_id: str, request: Request,
                 admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    media = db.get(Media, media_id)
    if not media:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Media not found")
    audit(db, admin, "delete", "media", media_id, {}, request)
    db.delete(media)
    db.commit()
    invalidate_catalog_cache()


# ---------------------------------------------------------------- products

def _product_out(p: Product) -> ProductOut:
    return ProductOut.model_validate(p)


@router.get("/products")
def admin_products(
    admin: User = Depends(require_staff), db: Session = Depends(get_db),
    category_id: str | None = None,
    page: int = 1,
    page_size: int = 100,
):
    query = db.query(Product).options(selectinload(Product.media))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    total = query.count()
    products = query.order_by(Product.sort).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [_product_out(p).model_dump() for p in products], "total": total, "page": page}


@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(body: ProductIn, request: Request,
                   admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    if not db.get(Category, body.category_id):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Category not found")
    if db.query(Product).filter(Product.slug == body.slug).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Slug already exists")
    data = body.model_dump(exclude={"media"})
    product = Product(**data)
    db.add(product)
    db.flush()
    for i, m in enumerate(body.media):
        db.add(Media(product_id=product.id, url=m.url, alt=m.alt, kind=m.kind, sort=m.sort or i))
    audit(db, admin, "create", "product", product.id, {"title": product.title}, request)
    db.commit()
    db.refresh(product)
    invalidate_catalog_cache()
    return _product_out(product)


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: str, body: ProductPatch, request: Request,
                   admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    data = body.model_dump(exclude_unset=True)
    if "category_id" in data and not db.get(Category, data["category_id"]):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Category not found")
    if "slug" in data:
        clash = db.query(Product).filter(Product.slug == data["slug"], Product.id != product_id).first()
        if clash:
            raise HTTPException(status.HTTP_409_CONFLICT, "Slug already exists")
    for key, value in data.items():
        setattr(product, key, value)
    audit(db, admin, "update", "product", product.id, {"title": product.title}, request)
    db.commit()
    db.refresh(product)
    invalidate_catalog_cache()
    return _product_out(product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str, request: Request,
                   admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    audit(db, admin, "delete", "product", product_id, {"title": product.title}, request)
    db.delete(product)
    db.commit()
    invalidate_catalog_cache()


@router.post("/products/{product_id}/media", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
def add_product_media(product_id: str, body: MediaIn, request: Request,
                      admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    media = Media(product_id=product_id, **body.model_dump())
    db.add(media)
    audit(db, admin, "create", "product_media", product_id, {"url": media.url}, request)
    db.commit()
    db.refresh(media)
    invalidate_catalog_cache()
    return media


# ---------------------------------------------------------------- coupons

@router.get("/coupons", response_model=list[CouponOut])
def list_coupons(admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    return db.query(Coupon).order_by(Coupon.created_at.desc()).all()


@router.post("/coupons", response_model=CouponOut, status_code=status.HTTP_201_CREATED)
def create_coupon(body: CouponIn, request: Request,
                  admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    if db.query(Coupon).filter(Coupon.code == body.code.upper()).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Coupon code already exists")
    data = body.model_dump()
    data["code"] = data["code"].upper()
    coupon = Coupon(**data)
    db.add(coupon)
    db.flush()
    audit(db, admin, "create", "coupon", coupon.id, {"code": coupon.code}, request)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.put("/coupons/{coupon_id}", response_model=CouponOut)
def update_coupon(coupon_id: str, body: CouponIn, request: Request,
                  admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    coupon = db.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Coupon not found")
    data = body.model_dump()
    data["code"] = data["code"].upper()
    clash = db.query(Coupon).filter(Coupon.code == data["code"], Coupon.id != coupon_id).first()
    if clash:
        raise HTTPException(status.HTTP_409_CONFLICT, "Coupon code already exists")
    for key, value in data.items():
        setattr(coupon, key, value)
    audit(db, admin, "update", "coupon", coupon.id, {"code": coupon.code}, request)
    db.commit()
    db.refresh(coupon)
    return coupon


@router.delete("/coupons/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coupon(coupon_id: str, request: Request,
                  admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    coupon = db.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Coupon not found")
    audit(db, admin, "delete", "coupon", coupon_id, {"code": coupon.code}, request)
    db.delete(coupon)
    db.commit()


# ---------------------------------------------------------------- bookings

@router.get("/bookings", response_model=list[BookingOut])
def list_bookings(status_filter: str | None = None,
                  admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    query = db.query(Booking)
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    return query.order_by(Booking.created_at.desc()).all()


@router.patch("/bookings/{booking_id}", response_model=BookingOut)
def update_booking_status(booking_id: str, body: BookingStatusUpdate, request: Request,
                          admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    booking.status = body.status
    audit(db, admin, "update_status", "booking", booking_id, {"status": body.status}, request)
    db.commit()
    db.refresh(booking)
    return booking


# ---------------------------------------------------------------- settings

@router.get("/settings/{key}", response_model=SettingOut)
def get_setting(key: str, admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    setting = db.get(Setting, key)
    if not setting:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Setting not found")
    return setting


@router.put("/settings/{key}", response_model=SettingOut)
def set_setting(key: str, body: SettingIn, request: Request,
                admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    setting = db.get(Setting, key)
    if setting:
        setting.value = body.value
    else:
        setting = Setting(key=key, value=body.value)
        db.add(setting)
    audit(db, admin, "set", "setting", key, {}, request)
    db.commit()
    db.refresh(setting)
    return setting


# ---------------------------------------------------------------- staff & audit log (owner only)

@router.get("/staff", response_model=list[UserOut])
def list_staff(admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    return db.query(User).filter(User.role.in_(["staff", "owner"])).order_by(User.created_at).all()


@router.post("/staff", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_staff(body: StaffIn, request: Request,
                 admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(email=email, name=body.name, role=body.role, password_hash=hash_password(body.password))
    db.add(user)
    db.flush()
    audit(db, admin, "create", "staff", user.id, {"email": email}, request)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/staff/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_staff(user_id: str, request: Request,
                     admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff not found")
    user.is_active = False
    audit(db, admin, "deactivate", "staff", user_id, {}, request)
    db.commit()


@router.get("/audit-log")
def list_audit_log(limit: int = 100, admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(min(limit, 500)).all()
    return [
        {
            "id": l.id, "user_id": l.user_id, "action": l.action, "entity": l.entity,
            "entity_id": l.entity_id, "detail": l.detail, "ip": l.ip,
            "created_at": l.created_at.isoformat(),
        }
        for l in logs
    ]


@router.get("/activity")
def list_activity(admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.action.in_(["login", "logout", "signup", "admin_login"]))
        .order_by(AuditLog.created_at.desc())
        .limit(60)
        .all()
    )
    user_ids = {l.user_id for l in logs if l.user_id}
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
    return [
        {
            "id": l.id, "action": l.action,
            "who": users[l.user_id].name if l.user_id in users and users[l.user_id].name else None,
            "email": users[l.user_id].email if l.user_id in users else None,
            "ip": l.ip, "at": l.created_at.isoformat(),
        }
        for l in logs
    ]


# ---------------------------------------------------------------- orders

@router.get("/orders", response_model=list[OrderOut])
def list_orders(status_filter: str | None = None,
                admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    query = db.query(Order).options(*ORDER_ADMIN_LOAD)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    orders = query.order_by(Order.created_at.desc()).limit(300).all()
    return [annotate_order(db, o) for o in orders]


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(order_id: str, body: OrderStatusUpdate, request: Request,
                        admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    order = db.query(Order).options(*ORDER_ADMIN_LOAD).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    order.status = body.status
    db.add(OrderTrackingEvent(
        order_id=order.id, status=body.status,
        title=ORDER_STATUS_TRACKING_TITLES.get(body.status, body.status.replace("_", " ").title()),
    ))
    order_event(db, order, body.status)
    audit(db, admin, "update_status", "order", order_id, {"status": body.status}, request)
    db.commit()
    db.refresh(order)
    return annotate_order(db, order)


@router.put("/orders/{order_id}/tracking", response_model=OrderOut)
def update_order_tracking(order_id: str, body: TrackingUpdateIn, request: Request,
                          admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    order = db.query(Order).options(*ORDER_ADMIN_LOAD).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    if body.carrier is not None:
        order.carrier = body.carrier or None
    if body.tracking_number is not None:
        order.tracking_number = body.tracking_number or None
    if body.tracking_url is not None:
        order.tracking_url = body.tracking_url or None
    if body.expected_delivery is not None:
        order.expected_delivery = body.expected_delivery
    if body.event_title:
        db.add(OrderTrackingEvent(
            order_id=order.id, status=order.status, title=body.event_title,
            description=body.event_description, location=body.event_location,
        ))
    audit(db, admin, "update_tracking", "order", order_id,
          {"carrier": order.carrier, "tracking_number": order.tracking_number}, request)
    db.commit()
    db.refresh(order)
    return annotate_order(db, order)


# ---------------------------------------------------------------- order cancellation requests

def _cancellation_out(req: OrderCancellationRequest) -> dict:
    return {
        "id": req.id, "order_id": req.order_id, "reason": req.reason, "note": req.note,
        "status": req.status, "admin_note": req.admin_note,
        "created_at": req.created_at, "resolved_at": req.resolved_at,
        "order_number": req.order.number if req.order else None,
        "customer_name": req.user.name if req.user else None,
        "customer_email": req.user.email if req.user else None,
    }


@router.get("/orders/cancellation-requests", response_model=list[AdminCancellationRequestOut])
def list_cancellation_requests(status_filter: str | None = None,
                               admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    query = db.query(OrderCancellationRequest).options(
        selectinload(OrderCancellationRequest.order), selectinload(OrderCancellationRequest.user),
    )
    if status_filter:
        query = query.filter(OrderCancellationRequest.status == status_filter)
    reqs = query.order_by(OrderCancellationRequest.created_at.desc()).limit(200).all()
    return [_cancellation_out(r) for r in reqs]


@router.patch("/orders/cancellation-requests/{request_id}", response_model=AdminCancellationRequestOut)
def decide_cancellation_request(request_id: str, body: CancellationDecisionIn, request: Request,
                                admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    req = db.query(OrderCancellationRequest).options(
        selectinload(OrderCancellationRequest.order).selectinload(Order.items),
        selectinload(OrderCancellationRequest.user),
    ).filter(OrderCancellationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    if req.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This request has already been resolved")

    order = req.order
    req.admin_note = body.admin_note
    req.resolved_by = admin.id
    req.resolved_at = datetime.now(timezone.utc)

    if body.action == "approve":
        req.status = "approved"
        if order.status in ("cod_confirmed", "paid", "in_production", "shipped"):
            product_ids = [item.product_id for item in order.items if item.product_id]
            products = {p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()} if product_ids else {}
            for item in order.items:
                product = products.get(item.product_id)
                if product and product.type == "product" and product.stock is not None:
                    product.stock += item.qty
        order.status = "cancelled"
        db.add(OrderTrackingEvent(
            order_id=order.id, status="cancelled", title="Order cancelled",
            description=f"Cancellation request approved. Reason: {req.reason}",
        ))
        order_event(db, order, "cancelled")
    else:
        req.status = "rejected"
        notify(db, req.user_id, "Cancellation request declined",
               f"Your cancellation request for order {order.number} was declined."
               + (f" {body.admin_note}" if body.admin_note else ""))

    audit(db, admin, f"{body.action}_cancellation", "order_cancellation_request", req.id, {"order_id": order.id}, request)
    db.commit()
    db.refresh(req)
    return _cancellation_out(req)


# ---------------------------------------------------------------- order address-change requests

def _address_change_out(req: OrderAddressChangeRequest) -> dict:
    return {
        "id": req.id, "order_id": req.order_id, "requested_address": req.requested_address,
        "note": req.note, "status": req.status, "admin_note": req.admin_note,
        "created_at": req.created_at, "resolved_at": req.resolved_at,
        "order_number": req.order.number if req.order else None,
        "customer_name": req.user.name if req.user else None,
        "customer_email": req.user.email if req.user else None,
    }


@router.get("/orders/address-change-requests", response_model=list[AdminAddressChangeRequestOut])
def list_address_change_requests(status_filter: str | None = None,
                                 admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    query = db.query(OrderAddressChangeRequest).options(
        selectinload(OrderAddressChangeRequest.order), selectinload(OrderAddressChangeRequest.user),
    )
    if status_filter:
        query = query.filter(OrderAddressChangeRequest.status == status_filter)
    reqs = query.order_by(OrderAddressChangeRequest.created_at.desc()).limit(200).all()
    return [_address_change_out(r) for r in reqs]


@router.patch("/orders/address-change-requests/{request_id}", response_model=AdminAddressChangeRequestOut)
def decide_address_change_request(request_id: str, body: AddressChangeDecisionIn, request: Request,
                                  admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    req = db.query(OrderAddressChangeRequest).options(
        selectinload(OrderAddressChangeRequest.order), selectinload(OrderAddressChangeRequest.user),
    ).filter(OrderAddressChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    if req.status != "pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This request has already been resolved")

    req.admin_note = body.admin_note
    req.resolved_by = admin.id
    req.resolved_at = datetime.now(timezone.utc)

    if body.action == "approve":
        req.status = "approved"
        addr = req.requested_address
        new_address = Address(
            user_id=req.user_id, label="Order update",
            full_name=addr.get("full_name", ""), phone=addr.get("phone", ""),
            line1=addr.get("line1", ""), line2=addr.get("line2"),
            city=addr.get("city", ""), state=addr.get("state", ""), pincode=addr.get("pincode", ""),
        )
        db.add(new_address)
        db.flush()
        req.order.address_id = new_address.id
        db.add(OrderTrackingEvent(
            order_id=req.order.id, status=req.order.status, title="Delivery address updated",
            description="The delivery address was changed at the customer's request.",
        ))
        notify(db, req.user_id, "Address updated", f"Your new delivery address for order {req.order.number} has been applied.")
    else:
        req.status = "rejected"
        notify(db, req.user_id, "Address change declined",
               f"Your address change request for order {req.order.number} was declined."
               + (f" {body.admin_note}" if body.admin_note else ""))

    audit(db, admin, f"{body.action}_address_change", "order_address_change_request", req.id, {"order_id": req.order_id}, request)
    db.commit()
    db.refresh(req)
    return _address_change_out(req)


@router.get("/reports/orders.csv")
def export_orders_csv(admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).limit(1000).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Number", "Status", "Subtotal", "Discount", "Total", "Coupon", "Created At"])
    for o in orders:
        writer.writerow([o.number, o.status, o.subtotal, o.discount, o.total, o.coupon_code or "", o.created_at.isoformat()])
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders.csv"},
    )


# ---------------------------------------------------------------- customers

@router.get("/customers")
def list_customers(q: str | None = None, page: int = 1,
                   admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    page_size = 30
    query = db.query(User).filter(User.role == "customer")
    if q:
        like = f"%{q}%"
        query = query.filter(or_(User.email.ilike(like), User.name.ilike(like), User.phone.ilike(like)))
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    paid_statuses = ("cod_confirmed", "paid", "in_production", "shipped", "delivered")
    user_ids = [u.id for u in users]
    orders_by_user: dict[str, list[Order]] = {uid: [] for uid in user_ids}
    if user_ids:
        for o in db.query(Order).filter(Order.user_id.in_(user_ids)).all():
            orders_by_user[o.user_id].append(o)

    items = []
    for u in users:
        orders = orders_by_user[u.id]
        spend = sum(float(o.total) for o in orders if o.status in paid_statuses)
        items.append(CustomerOut(
            id=u.id, name=u.name, email=u.email, phone=u.phone, is_active=u.is_active,
            joined=u.created_at, last_login=u.last_login, orders=len(orders), spend=spend,
        ))
    return {"items": items, "total": total, "page": page, "page_size": page_size}


# ---------------------------------------------------------------- reviews

@router.patch("/reviews/{review_id}/toggle")
def toggle_review(review_id: str, request: Request,
                  admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")
    review.is_approved = not review.is_approved
    audit(db, admin, "toggle_review", "review", review_id, {"approved": review.is_approved}, request)
    db.commit()
    invalidate_catalog_cache()  # cached page bundles embed each product's avg rating
    return {"id": review.id, "is_approved": review.is_approved}


@router.get("/reviews")
def list_reviews(admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    rows = (
        db.query(Review, User.name, User.email, Product.title)
        .join(User, Review.user_id == User.id)
        .join(Product, Review.product_id == Product.id)
        .order_by(Review.created_at.desc())
        .limit(300)
        .all()
    )
    return [
        {
            "id": r.id, "rating": r.rating, "comment": r.comment, "is_approved": r.is_approved,
            "reviewer": name or email, "product_title": title, "created_at": r.created_at.isoformat(),
        }
        for r, name, email, title in rows
    ]


# ---------------------------------------------------------------- media library

@router.post("/media/upload")
def upload_media(file: UploadFile, request: Request,
                 admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    # Plain `def`, not `async def` - process_image() below is a blocking Pillow
    # encode + disk write. FastAPI runs sync routes in a worker thread automatically;
    # an `async def` route doing that same work would block the whole event loop
    # (every other concurrent request) for its duration.
    data = file.file.read()
    try:
        filename, mime, size = process_image(data, MEDIA_DIR, to_webp=True)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

    media = Media(url=f"/media/{filename}", alt=file.filename or "", kind="library")
    db.add(media)
    audit(db, admin, "upload", "media", media.id, {"url": media.url}, request)
    db.commit()
    db.refresh(media)
    return {"id": media.id, "url": media.url, "alt": media.alt, "mime": mime, "size": size}


@router.get("/media", response_model=list[MediaOut])
def list_media(admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    return db.query(Media).order_by(Media.created_at.desc()).limit(500).all()


# ---------------------------------------------------------------- settings (all keys)

@router.get("/settings")
def list_settings(admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    return {s.key: s.value for s in db.query(Setting).all()}


# ---------------------------------------------------------------- homepage builder

@router.get("/homepage")
def get_homepage(admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    setting = db.get(Setting, HOMEPAGE_KEY)
    layout = setting.value if setting else {}

    categories = (
        db.query(Category)
        .filter(Category.is_active == True)
        .order_by(Category.sort, Category.name)
        .all()
    )
    products = (
        db.query(Product)
        .options(selectinload(Product.media))
        .filter(Product.is_active == True)
        .order_by(Product.sort)
        .all()
    )

    def cat_image(c):
        return c.thumb_image_url or c.hero_image_url

    def prod_image(p):
        return p.media[0].url if p.media else None

    return {
        "layout": {
            "category_ids": layout.get("category_ids", []),
            "product_ids": layout.get("product_ids", []),
        },
        "all": {
            "categories": [{"id": c.id, "name": c.name, "image": cat_image(c)} for c in categories],
            "products": [
                {"id": p.id, "title": p.title, "image": prod_image(p), "price": float(p.price), "bestseller": p.is_featured}
                for p in products
            ],
        },
    }


@router.put("/homepage")
def set_homepage(body: HomepageLayoutIn, request: Request,
                 admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    value = body.model_dump()
    setting = db.get(Setting, HOMEPAGE_KEY)
    if setting:
        setting.value = value
    else:
        db.add(Setting(key=HOMEPAGE_KEY, value=value))
    audit(db, admin, "set", "setting", HOMEPAGE_KEY, {}, request)
    db.commit()
    invalidate_catalog_cache()
    return {"ok": True, "layout": value}


@router.delete("/homepage")
def reset_homepage(request: Request, admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    setting = db.get(Setting, HOMEPAGE_KEY)
    if setting:
        db.delete(setting)
        audit(db, admin, "delete", "setting", HOMEPAGE_KEY, {}, request)
        db.commit()
        invalidate_catalog_cache()
    return {"ok": True}


# ---------------------------------------------------------------- arrange (per-category product order)

@router.get("/arrange/{category_id}")
def get_arrange(category_id: str, admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    products = (
        db.query(Product)
        .options(selectinload(Product.media))
        .filter(Product.category_id == category_id)
        .order_by(Product.sort, Product.created_at.desc())
        .all()
    )
    return {
        "category": {"id": category.id, "slug": category.slug, "name": category.name},
        "items": [
            {
                "id": p.id, "slug": p.slug, "title": p.title,
                "image": p.media[0].url if p.media else None,
                "price": float(p.price), "active": p.is_active, "type": p.type,
            }
            for p in products
        ],
    }


@router.put("/arrange")
def set_arrange(body: ArrangeIn, request: Request,
                admin: User = Depends(require_staff), db: Session = Depends(get_db)):
    valid_ids = {
        p.id for p in db.query(Product.id).filter(Product.category_id == body.category_id).all()
    }
    mappings = [
        {"id": product_id, "sort": position}
        for position, product_id in enumerate(body.ids)
        if product_id in valid_ids
    ]
    if mappings:
        db.bulk_update_mappings(Product, mappings)
    count = len(mappings)
    audit(db, admin, "arrange", "category", body.category_id, {"count": count}, request)
    db.commit()
    invalidate_catalog_cache()
    return {"ok": True, "count": count}
