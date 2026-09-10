from datetime import datetime, date

from pydantic import BaseModel, ConfigDict, Field

from .models import CANCELLATION_REASONS

_CANCELLATION_REASON_PATTERN = f"^({'|'.join(CANCELLATION_REASONS)})$"
_REQUEST_ACTION_PATTERN = "^(approve|reject)$"


# ---------------------------------------------------------------- auth

class LoginIn(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    name: str | None
    phone: str | None
    role: str
    created_at: datetime


class StaffIn(BaseModel):
    email: str
    name: str
    password: str
    role: str = Field(default="staff", pattern="^(staff|owner)$")


# ---------------------------------------------------------------- customer auth (OTP)

class OtpRequest(BaseModel):
    email: str


class OtpVerify(BaseModel):
    email: str
    code: str = Field(pattern=r"^\d{6}$")
    name: str | None = None


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None


class CustomerOut(BaseModel):
    id: str
    name: str | None
    email: str
    phone: str | None
    is_active: bool
    joined: datetime
    last_login: datetime | None
    orders: int
    spend: float


# ---------------------------------------------------------------- addresses

class AddressIn(BaseModel):
    label: str = Field(default="Home", max_length=40)
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(pattern=r"^[6-9]\d{9}$")
    line1: str = Field(min_length=3, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=80)
    pincode: str = Field(pattern=r"^\d{6}$")
    is_default: bool = False


class AddressOut(AddressIn):
    model_config = ConfigDict(from_attributes=True)
    id: str


# ---------------------------------------------------------------- cart

class CartItemIn(BaseModel):
    key: str
    product_id: str | None = None
    name: str
    price: str
    img: str | None = None
    qty: int = Field(default=1, ge=1)
    customization: dict | None = None
    requirement: dict | None = None


class CartItemOut(CartItemIn):
    pass


class CartSyncIn(BaseModel):
    items: list[CartItemIn] = []


class CartSyncOut(BaseModel):
    items: list[CartItemOut] = []


# ---------------------------------------------------------------- site pages

class SitePageIn(BaseModel):
    slug: str
    name: str
    sort: int = 0
    is_active: bool = True


class SitePageOut(SitePageIn):
    model_config = ConfigDict(from_attributes=True)
    id: str


# ---------------------------------------------------------------- media

class MediaIn(BaseModel):
    url: str
    alt: str = ""
    kind: str = Field(default="portfolio", pattern="^(portfolio|package)$")
    sort: int = 0


class MediaOut(MediaIn):
    model_config = ConfigDict(from_attributes=True)
    id: str


# ---------------------------------------------------------------- categories

class CategoryIn(BaseModel):
    page_id: str
    slug: str
    name: str
    icon: str | None = None
    description: str | None = None
    thumb_image_url: str | None = None
    hero_image_url: str | None = None
    hero_tagline: str | None = None
    show_in_hero: bool = False
    folio_title: str | None = None
    group_label: str | None = None
    sort: int = 0
    is_active: bool = True


class CategoryOut(CategoryIn):
    model_config = ConfigDict(from_attributes=True)
    id: str


# ---------------------------------------------------------------- products

class ProductIn(BaseModel):
    category_id: str
    tier: str | None = None
    title: str
    slug: str
    description: str = ""
    type: str = Field(default="service", pattern="^(service|product)$")
    price: float
    mrp: float | None = None
    advance_amount: float | None = None
    stock: int | None = None
    address_change_window_hours: int | None = Field(default=None, ge=0, le=720)
    features: list[str] = []
    is_active: bool = True
    is_featured: bool = False
    sort: int = 0
    extra: dict = {}
    media: list[MediaIn] = []


class ProductPatch(BaseModel):
    category_id: str | None = None
    tier: str | None = None
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    type: str | None = None
    price: float | None = None
    mrp: float | None = None
    advance_amount: float | None = None
    stock: int | None = None
    address_change_window_hours: int | None = Field(default=None, ge=0, le=720)
    features: list[str] | None = None
    is_active: bool | None = None
    is_featured: bool | None = None
    sort: int | None = None
    extra: dict | None = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    category_id: str
    tier: str | None
    title: str
    slug: str
    description: str
    type: str
    price: float
    mrp: float | None
    advance_amount: float | None
    stock: int | None
    address_change_window_hours: int | None
    features: list[str]
    is_active: bool
    is_featured: bool
    sort: int
    extra: dict
    media: list[MediaOut] = []


# ---------------------------------------------------------------- coupons

class CouponIn(BaseModel):
    code: str
    type: str = Field(pattern="^(percent|flat)$")
    value: float
    min_order: float = 0
    max_discount: float | None = None
    title: str = ""
    banner_image: str | None = None
    placement: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    is_active: bool = True


class CouponOut(CouponIn):
    model_config = ConfigDict(from_attributes=True)
    id: str


# ---------------------------------------------------------------- bookings

class BookingIn(BaseModel):
    product_id: str | None = None
    customer_name: str
    customer_phone: str
    customer_email: str | None = None
    event_date: date | None = None
    slot: str | None = None
    details: dict = {}


class BookingStatusUpdate(BaseModel):
    status: str = Field(pattern="^(enquiry|advance_pending|confirmed|completed|cancelled)$")


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_id: str | None
    user_id: str | None
    customer_name: str
    customer_phone: str
    customer_email: str | None
    event_date: date | None
    slot: str | None
    details: dict
    advance_paid: float
    status: str
    created_at: datetime


# ---------------------------------------------------------------- orders / payments

class CheckoutItemIn(BaseModel):
    # product_id is set when the item came from the backend catalog; storefront
    # pages that still render hardcoded package data (most of them, today) send
    # just title/price/image straight from the localStorage cart instead.
    product_id: str | None = None
    title: str
    price: float
    qty: int = Field(default=1, ge=1)
    image: str | None = None
    customization: dict | None = None


class CheckoutIn(BaseModel):
    items: list[CheckoutItemIn]
    address_id: str
    delivery_slot: str | None = None
    coupon_code: str | None = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_id: str | None
    product_snapshot: dict
    unit_price: float
    qty: int
    notes: str


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    razorpay_order_id: str
    razorpay_payment_id: str | None
    status: str
    amount: float
    refund_id: str | None
    created_at: datetime


class OrderCustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str | None
    email: str
    phone: str | None


class OrderAddressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    full_name: str
    phone: str
    line1: str
    line2: str | None
    city: str
    state: str
    pincode: str


class OrderTrackingEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    status: str
    title: str
    description: str
    location: str | None
    created_at: datetime


class TrackingUpdateIn(BaseModel):
    carrier: str | None = Field(default=None, max_length=80)
    tracking_number: str | None = Field(default=None, max_length=120)
    tracking_url: str | None = Field(default=None, max_length=500)
    expected_delivery: date | None = None
    event_title: str | None = Field(default=None, max_length=160)
    event_description: str = Field(default="", max_length=1000)
    event_location: str | None = Field(default=None, max_length=160)


class CancellationRequestIn(BaseModel):
    reason: str = Field(pattern=_CANCELLATION_REASON_PATTERN)
    note: str = Field(default="", max_length=500)


class CancellationDecisionIn(BaseModel):
    action: str = Field(pattern=_REQUEST_ACTION_PATTERN)
    admin_note: str = Field(default="", max_length=500)


class CancellationRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    order_id: str
    reason: str
    note: str
    status: str
    admin_note: str
    created_at: datetime
    resolved_at: datetime | None


# Flat, cross-order admin listing (Admin > Orders > Cancellation Requests) needs
# the order number and customer alongside each request - built from a plain
# dict in the router rather than model_validate(), since those two fields
# don't live on the OrderCancellationRequest row itself.
class AdminCancellationRequestOut(CancellationRequestOut):
    order_number: str | None = None
    customer_name: str | None = None
    customer_email: str | None = None


class AddressChangeRequestIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(pattern=r"^[6-9]\d{9}$")
    line1: str = Field(min_length=3, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=80)
    pincode: str = Field(pattern=r"^\d{6}$")
    note: str = Field(default="", max_length=500)


class AddressChangeDecisionIn(BaseModel):
    action: str = Field(pattern=_REQUEST_ACTION_PATTERN)
    admin_note: str = Field(default="", max_length=500)


class AddressChangeRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    order_id: str
    requested_address: dict
    note: str
    status: str
    admin_note: str
    created_at: datetime
    resolved_at: datetime | None


class AdminAddressChangeRequestOut(AddressChangeRequestOut):
    order_number: str | None = None
    customer_name: str | None = None
    customer_email: str | None = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    number: str
    status: str
    subtotal: float
    discount: float
    total: float
    coupon_code: str | None
    address_id: str | None
    delivery_slot: str | None
    carrier: str | None = None
    tracking_number: str | None = None
    tracking_url: str | None = None
    expected_delivery: date | None = None
    created_at: datetime
    items: list[OrderItemOut] = []
    payments: list[PaymentOut] = []
    customer: OrderCustomerOut | None = None
    address: OrderAddressOut | None = None
    tracking_events: list[OrderTrackingEventOut] = []
    cancellation_requests: list[CancellationRequestOut] = []
    address_change_requests: list[AddressChangeRequestOut] = []
    # Computed server-side per request (see services/policy.annotate_order) -
    # not derivable straight from the ORM row, so these default to a safe
    # "no" until a router explicitly fills them in.
    can_cancel: bool = False
    can_request_address_change: bool = False
    address_change_deadline: datetime | None = None


class OrderStatusUpdate(BaseModel):
    status: str = Field(pattern="^(created|payment_pending|cod_confirmed|paid|in_production|shipped|delivered|cancelled|refunded)$")


class PaymentInitOut(BaseModel):
    payment_id: str
    razorpay_order_id: str
    razorpay_key_id: str
    amount: float
    amount_paise: int
    mock: bool
    name: str = "Sai Kumar Studio"
    description: str
    prefill_contact: str | None = None
    prefill_email: str | None = None


class PaymentVerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ---------------------------------------------------------------- reviews

class ReviewIn(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=2000)


class ReviewOut(BaseModel):
    rating: int
    comment: str
    name: str
    created_at: datetime


# ---------------------------------------------------------------- homepage / arrange

class HomepageLayoutIn(BaseModel):
    category_ids: list[str] = Field(default_factory=list, max_length=20)
    product_ids: list[str] = Field(default_factory=list, max_length=20)


class ArrangeIn(BaseModel):
    category_id: str
    ids: list[str]


# ---------------------------------------------------------------- settings

class SettingIn(BaseModel):
    value: dict


class SettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    key: str
    value: dict
