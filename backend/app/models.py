import uuid
from datetime import datetime, date

from sqlalchemy import (
    String, Text, Boolean, Integer, Numeric, DateTime, Date, ForeignKey,
    UniqueConstraint, Index, JSON, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def uid() -> str:
    return str(uuid.uuid4())


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ---------------------------------------------------------------- users / auth

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="customer")  # customer | staff | owner
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)  # staff/owner only
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    addresses: Mapped[list["Address"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    email: Mapped[str] = mapped_column(String(255), index=True)
    code_hash: Mapped[str] = mapped_column(String(128))
    purpose: Mapped[str] = mapped_column(String(20), default="login")
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------- site pages (top-level nav)

class SitePage(Base, TimestampMixin):
    """One row per storefront page (photography, corporate, gifts, catalog, ...).
    Categories/products are scoped to a page so the same admin screens and public
    catalog endpoint shape can serve every section of the site."""
    __tablename__ = "site_pages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    slug: Mapped[str] = mapped_column(String(60), unique=True, index=True)  # e.g. "photography"
    name: Mapped[str] = mapped_column(String(120))
    sort: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    categories: Mapped[list["Category"]] = relationship(back_populates="page", order_by="Category.sort")


# ---------------------------------------------------------------- catalog

class Category(Base, TimestampMixin):
    """A service/product category within a page — e.g. "Wedding Photography" on the
    photography page, or "Corporate Hampers" on the corporate page. Carries the
    sidebar/hero display data that used to be hardcoded per page (icon, images,
    tagline, hero visibility, sidebar grouping)."""
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    page_id: Mapped[str] = mapped_column(ForeignKey("site_pages.id", ondelete="CASCADE"), index=True)
    slug: Mapped[str] = mapped_column(String(80), index=True)  # unique within a page, e.g. "wedding"
    name: Mapped[str] = mapped_column(String(160))
    icon: Mapped[str | None] = mapped_column(String(20), nullable=True)  # emoji
    description: Mapped[str | None] = mapped_column(Text, nullable=True)  # category blurb, e.g. studio/corporate/gifts "desc"
    thumb_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)   # sidebar / "All Services" card
    hero_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)    # large hero banner image
    hero_tagline: Mapped[str | None] = mapped_column(String(200), nullable=True)
    show_in_hero: Mapped[bool] = mapped_column(Boolean, default=False)
    folio_title: Mapped[str | None] = mapped_column(String(200), nullable=True)  # e.g. "Videography Reel"
    group_label: Mapped[str | None] = mapped_column(String(40), nullable=True)   # e.g. "Functions" / "Equipment"
    sort: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    page: Mapped["SitePage"] = relationship(back_populates="categories")
    products: Mapped[list["Product"]] = relationship(
        back_populates="category", cascade="all, delete-orphan", order_by="Product.sort"
    )
    media: Mapped[list["Media"]] = relationship(
        back_populates="category", cascade="all, delete-orphan", order_by="Media.sort",
        foreign_keys="Media.category_id",
    )

    __table_args__ = (UniqueConstraint("page_id", "slug", name="uq_category_page_slug"),)


class Product(Base, TimestampMixin):
    """A sellable/bookable item. For tiered services (photography packages) each tier
    (Standard/Premium/Platinum) is its own Product row under the same category."""
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    tier: Mapped[str | None] = mapped_column(String(40), nullable=True)  # Standard | Premium | Platinum | null
    title: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    type: Mapped[str] = mapped_column(String(10), default="service")  # service | product
    price: Mapped[float] = mapped_column(Numeric(10, 2))
    mrp: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)  # strike-through price, optional
    advance_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)  # booking deposit
    stock: Mapped[int | None] = mapped_column(Integer, nullable=True)  # physical products only
    # How many hours after an order is placed a customer may still request a
    # delivery-address change on it, before this product's production/packing
    # is assumed to start. Null -> falls back to the site-wide default in
    # Setting["order_policy"] (see services/policy.py).
    address_change_window_hours: Mapped[int | None] = mapped_column(Integer, nullable=True)
    features: Mapped[list] = mapped_column(JSON, default=list)  # ["150+ High-Res Photos", ...]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)  # "Most Booked" badge
    sort: Mapped[int] = mapped_column(Integer, default=0)
    # Free-form JSON for fields with no dedicated column yet (studio's configurator:
    # quantityOptions/purposeOptions/requiresPhotoUpload) - admin edits this as raw JSON
    # rather than each one-off field needing its own migration + form control.
    extra: Mapped[dict] = mapped_column(JSON, default=dict)

    category: Mapped["Category"] = relationship(back_populates="products")
    media: Mapped[list["Media"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="Media.sort",
        foreign_keys="Media.product_id",
    )


class Media(Base, TimestampMixin):
    """An image attached either to a Category (portfolio gallery photo, kind="portfolio")
    or to a Product (package carousel photo, kind="package")."""
    __tablename__ = "media"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    category_id: Mapped[str | None] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), nullable=True, index=True
    )
    product_id: Mapped[str | None] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True
    )
    url: Mapped[str] = mapped_column(Text)
    alt: Mapped[str] = mapped_column(String(200), default="")  # portfolio caption
    kind: Mapped[str] = mapped_column(String(20), default="portfolio")  # portfolio | package
    sort: Mapped[int] = mapped_column(Integer, default=0)

    category: Mapped["Category | None"] = relationship(back_populates="media", foreign_keys=[category_id])
    product: Mapped["Product | None"] = relationship(back_populates="media", foreign_keys=[product_id])


# ---------------------------------------------------------------- addresses / orders / payments

class Address(Base, TimestampMixin):
    __tablename__ = "addresses"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    label: Mapped[str] = mapped_column(String(40), default="Home")
    full_name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(15))
    line1: Mapped[str] = mapped_column(String(255))
    line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(80))
    state: Mapped[str] = mapped_column(String(80))
    pincode: Mapped[str] = mapped_column(String(10))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="addresses")


class CartItem(Base, TimestampMixin):
    """A logged-in customer's saved cart line, mirroring the shared localStorage
    cart shape (name/price/img/qty/customization/requirement) used across every
    storefront page, so the cart follows the account across logins/devices
    instead of living only in one browser's localStorage."""
    __tablename__ = "cart_items"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    item_key: Mapped[str] = mapped_column(String(300))  # the localStorage cart object's key
    product_id: Mapped[str | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), nullable=True
    )  # set once a storefront page's data comes from the catalog API instead of hardcoded JS
    name: Mapped[str] = mapped_column(String(300))
    price: Mapped[str] = mapped_column(String(40))  # kept as the formatted string ("₹399") the frontend uses
    img: Mapped[str | None] = mapped_column(Text, nullable=True)
    qty: Mapped[int] = mapped_column(Integer, default=1)
    customization: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    requirement: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user: Mapped["User"] = relationship()

    __table_args__ = (UniqueConstraint("user_id", "item_key", name="uq_cart_item_per_user"),)


ORDER_STATUSES = [
    "created", "payment_pending", "paid", "in_production",
    "shipped", "delivered", "cancelled", "refunded",
]


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="created", index=True)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    discount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    coupon_code: Mapped[str | None] = mapped_column(String(40), nullable=True)
    address_id: Mapped[str | None] = mapped_column(ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True)
    delivery_slot: Mapped[str | None] = mapped_column(String(60), nullable=True)
    carrier: Mapped[str | None] = mapped_column(String(80), nullable=True)
    tracking_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tracking_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_delivery: Mapped[date | None] = mapped_column(Date, nullable=True)

    user: Mapped["User"] = relationship()
    address: Mapped["Address | None"] = relationship()
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    tracking_events: Mapped[list["OrderTrackingEvent"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderTrackingEvent.created_at"
    )
    cancellation_requests: Mapped[list["OrderCancellationRequest"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderCancellationRequest.created_at.desc()"
    )
    address_change_requests: Mapped[list["OrderAddressChangeRequest"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderAddressChangeRequest.created_at.desc()"
    )

    @property
    def customer(self) -> "User":
        # OrderOut.customer reads this instead of `user` directly - "customer" is
        # the term staff actually use in the admin UI.
        return self.user


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[str | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)  # {title, slug, type, image}
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2))
    qty: Mapped[int] = mapped_column(Integer, default=1)
    notes: Mapped[str] = mapped_column(Text, default="")

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product | None"] = relationship()


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    razorpay_order_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    signature: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="created")  # created|authorized|captured|failed|refunded
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    refund_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="payments")


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    event_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    event_type: Mapped[str] = mapped_column(String(60))
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    processed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------- order tracking / customer requests

CANCELLATION_REASONS = [
    "changed_mind", "found_better_price", "ordered_by_mistake",
    "delivery_time_too_long", "product_defect_expected", "duplicate_order", "other",
]

REQUEST_STATUSES = ["pending", "approved", "rejected"]


class OrderTrackingEvent(Base):
    """One entry in an order's shipment timeline (order placed / in production /
    shipped / out for delivery / delivered / cancelled ...). Auto-appended on every
    admin status change, plus any extra checkpoints staff add manually (courier
    handoff, out-for-delivery, hub scan, etc.)."""
    __tablename__ = "order_tracking_events"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20))  # snapshot of Order.status at this point
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default="")
    location: Mapped[str | None] = mapped_column(String(160), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order: Mapped["Order"] = relationship(back_populates="tracking_events")


class OrderCancellationRequest(Base, TimestampMixin):
    """A customer's request to cancel an order that's past the point of an
    instant self-serve cancel (already paid / in production / shipped) - staff
    review and approve or reject it from the admin Orders page."""
    __tablename__ = "order_cancellation_requests"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    reason: Mapped[str] = mapped_column(String(40))
    note: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    admin_note: Mapped[str] = mapped_column(Text, default="")
    resolved_by: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="cancellation_requests")
    user: Mapped["User"] = relationship(foreign_keys=[user_id])


class OrderAddressChangeRequest(Base, TimestampMixin):
    """A customer's request to change the delivery address on an existing order,
    only offered while the order is inside that order's address-change buffer
    window (see services/policy.py). Staff approve (which swaps the order's
    address) or reject it."""
    __tablename__ = "order_address_change_requests"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    requested_address: Mapped[dict] = mapped_column(JSON, default=dict)  # full_name/phone/line1/line2/city/state/pincode
    note: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    admin_note: Mapped[str] = mapped_column(Text, default="")
    resolved_by: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="address_change_requests")
    user: Mapped["User"] = relationship(foreign_keys=[user_id])


# ---------------------------------------------------------------- reviews / notifications

class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text, default="")
    is_approved: Mapped[bool] = mapped_column(Boolean, default=True)

    product: Mapped["Product"] = relationship()
    user: Mapped["User"] = relationship()

    __table_args__ = (UniqueConstraint("product_id", "user_id", name="uq_review_per_user"),)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    channel: Mapped[str] = mapped_column(String(20), default="app")  # app | email
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text, default="")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------- bookings

BOOKING_STATUSES = ["enquiry", "advance_pending", "confirmed", "completed", "cancelled"]


class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    product_id: Mapped[str | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(120))
    customer_phone: Mapped[str] = mapped_column(String(20))
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    slot: Mapped[str | None] = mapped_column(String(40), nullable=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict)  # location, notes, add-ons, snapshot of package
    advance_paid: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    status: Mapped[str] = mapped_column(String(20), default="enquiry", index=True)

    product: Mapped["Product | None"] = relationship()


# ---------------------------------------------------------------- offers / coupons

class Coupon(Base, TimestampMixin):
    __tablename__ = "coupons"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    type: Mapped[str] = mapped_column(String(10))  # percent | flat
    value: Mapped[float] = mapped_column(Numeric(10, 2))
    min_order: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    max_discount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    title: Mapped[str] = mapped_column(String(160), default="")
    banner_image: Mapped[str | None] = mapped_column(Text, nullable=True)
    placement: Mapped[str | None] = mapped_column(String(40), nullable=True)  # home_hero | home_strip | mega_menu
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


# ---------------------------------------------------------------- misc

class Setting(Base, TimestampMixin):
    """Free-form JSON config for anything that doesn't warrant its own table —
    homepage hero ordering, per-page misc copy, feature flags, etc."""
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(60), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=uid)
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(80))
    entity: Mapped[str] = mapped_column(String(60))
    entity_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
