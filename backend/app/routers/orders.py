import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload

from ..config import get_settings
from ..database import get_db
from ..deps import get_current_user
from ..models import (
    Address, Order, OrderAddressChangeRequest, OrderCancellationRequest,
    OrderItem, OrderTrackingEvent, Payment, Product, User,
)
from ..schemas import AddressChangeRequestIn, CancellationRequestIn, CheckoutIn, OrderOut, PaymentInitOut
from ..services.notifications import order_event
from ..services.policy import (
    IMMEDIATE_CANCEL_STATUSES, REQUESTABLE_CANCEL_STATUSES,
    address_change_deadline, annotate_order, annotate_orders,
)
from ..services.pricing import money, price_cart
from ..services.razorpay_service import create_rzp_order
from ..services.storage import CUSTOM_UPLOAD_FIELDS, upload_data_uri

router = APIRouter(prefix="/api/orders", tags=["orders"])
settings = get_settings()


def _externalize_customization(customization: dict | None, order_number: str) -> dict | None:
    """Swaps any uploaded photo/logo in a cart line's customization from an
    inline base64 data: URI to a small Supabase Storage URL before it's
    persisted - keeps the order (and every admin/customer list that reads it
    back) out of multi-MB-per-item territory. Falls back to the original
    base64 field-by-field if a given upload can't be externalized."""
    if not isinstance(customization, dict):
        return customization
    out = dict(customization)
    for field in CUSTOM_UPLOAD_FIELDS:
        value = out.get(field)
        if isinstance(value, str) and value.startswith("data:"):
            url = upload_data_uri(value, subfolder=order_number)
            if url:
                out[field] = url
    return out

ORDER_LOAD = (
    selectinload(Order.items),
    selectinload(Order.payments),
    # user/address are many-to-one (exactly one row per order) - joinedload
    # folds them into the main query instead of costing their own DB round
    # trip, which matters when the DB is remote and latency-bound.
    joinedload(Order.user),
    joinedload(Order.address),
    selectinload(Order.tracking_events),
    selectinload(Order.cancellation_requests),
    selectinload(Order.address_change_requests),
)


def order_number() -> str:
    return f"SK{datetime.now():%y%m%d}{secrets.randbelow(10000):04d}"


def _payment_init(order: Order, payment: Payment, user: User) -> PaymentInitOut:
    return PaymentInitOut(
        payment_id=payment.id,
        razorpay_order_id=payment.razorpay_order_id,
        razorpay_key_id=settings.razorpay_key_id,
        amount=float(payment.amount),
        amount_paise=int(round(float(payment.amount) * 100)),
        mock=settings.razorpay_mock,
        description=f"Order {order.number}",
        prefill_contact=user.phone,
        prefill_email=user.email,
    )


@router.post("/checkout", status_code=status.HTTP_201_CREATED)
def checkout(body: CheckoutIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(Address).filter(Address.id == body.address_id, Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Address not found")
    if not body.items:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cart is empty")

    # Only items that name a real, resolvable Product get stock-checked and linked —
    # most storefront pages still render hardcoded package data with no backend row.
    product_ids = [entry.product_id for entry in body.items if entry.product_id]
    products = {p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()} if product_ids else {}
    for entry in body.items:
        if not entry.product_id:
            continue
        product = products.get(entry.product_id)
        if not product or not product.is_active:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f'"{entry.title}" is no longer available')
        if product.type == "product" and product.stock is not None and product.stock < entry.qty:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f'"{product.title}" is out of stock')

    priced = price_cart(
        db,
        [{"product_id": i.product_id, "title": i.title, "price": i.price, "qty": i.qty, "image": i.image, "customization": i.customization} for i in body.items],
        body.coupon_code,
    )
    if not priced["lines"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cart is empty")

    order = Order(
        number=order_number(),
        user_id=user.id,
        status="payment_pending",
        subtotal=priced["subtotal"],
        discount=priced["discount"],
        total=priced["total"],
        coupon_code=priced["coupon"].code if priced["coupon"] else None,
        address_id=address.id,
        delivery_slot=body.delivery_slot,
    )
    db.add(order)
    db.flush()

    for line in priced["lines"]:
        db.add(OrderItem(
            order_id=order.id,
            product_id=line.get("product_id"),
            product_snapshot={
                "title": line["title"], "image": line.get("image"),
                "customization": _externalize_customization(line.get("customization"), order.number),
            },
            unit_price=line["unit_price"],
            qty=line["qty"],
        ))

    rzp_order = create_rzp_order(int(round(float(order.total) * 100)), receipt=order.number)
    payment = Payment(
        order_id=order.id,
        razorpay_order_id=rzp_order["id"],
        amount=order.total,
    )
    db.add(payment)
    db.add(OrderTrackingEvent(order_id=order.id, status=order.status, title="Order placed"))
    db.commit()
    db.refresh(order)
    db.refresh(payment)

    return {"order": annotate_order(db, order), "payment": _payment_init(order, payment, user)}


@router.post("/{order_id}/confirm-cod", response_model=OrderOut)
def confirm_cod(order_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Cash-on-Delivery skips the Razorpay verify/webhook path entirely (no online
    # payment happens), so without this the order would sit in "payment_pending"
    # forever — indistinguishable from a checkout the customer simply abandoned.
    order = db.query(Order).options(*ORDER_LOAD).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    if order.status == "payment_pending":
        order.status = "cod_confirmed"
        # Mirrors the stock deduction _mark_paid() does for online payments - a
        # confirmed COD order reserves stock the same way a paid one does, so it
        # isn't oversold to someone else before it's delivered.
        product_ids = [item.product_id for item in order.items if item.product_id]
        products = {p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()} if product_ids else {}
        for item in order.items:
            product = products.get(item.product_id)
            if product and product.type == "product" and product.stock is not None:
                product.stock = max(0, product.stock - item.qty)
        db.add(OrderTrackingEvent(order_id=order.id, status="cod_confirmed", title="Order confirmed (Cash on Delivery)"))
        order_event(db, order, "cod_confirmed")
        db.commit()
        db.refresh(order)
    return annotate_order(db, order)


@router.get("/my", response_model=list[OrderOut])
def my_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(*ORDER_LOAD)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .limit(100)
        .all()
    )
    return annotate_orders(db, orders)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = (
        db.query(Order).options(*ORDER_LOAD)
        .filter(Order.id == order_id, Order.user_id == user.id).first()
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return annotate_order(db, order)


@router.post("/{order_id}/retry-payment")
def retry_payment(order_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    if order.status != "payment_pending":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Order is not awaiting payment")

    rzp_order = create_rzp_order(int(round(float(order.total) * 100)), receipt=f"{order.number}-retry")
    payment = Payment(order_id=order.id, razorpay_order_id=rzp_order["id"], amount=order.total)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {"payment": _payment_init(order, payment, user)}


@router.post("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(order_id: str, body: CancellationRequestIn,
                 user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Before anything's been charged (created/payment_pending) this cancels
    immediately - nothing to refund or unwind yet. Once payment has gone
    through or production has started, it instead files a cancellation
    request for staff to approve or reject (they may already be mid-production
    or have a courier booked), visible on the admin Orders page."""
    order = db.query(Order).options(*ORDER_LOAD).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    if order.status in IMMEDIATE_CANCEL_STATUSES:
        order.status = "cancelled"
        db.add(OrderTrackingEvent(order_id=order.id, status="cancelled", title="Order cancelled",
                                   description=f"Cancelled by customer. Reason: {body.reason}"))
        order_event(db, order, "cancelled")
        db.commit()
        db.refresh(order)
        return annotate_order(db, order)

    if order.status not in REQUESTABLE_CANCEL_STATUSES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This order can no longer be cancelled")
    if any(r.status == "pending" for r in order.cancellation_requests):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A cancellation request is already pending for this order")

    db.add(OrderCancellationRequest(order_id=order.id, user_id=user.id, reason=body.reason, note=body.note))
    db.commit()
    db.refresh(order)
    return annotate_order(db, order)


@router.post("/{order_id}/address-change", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def request_address_change(order_id: str, body: AddressChangeRequestIn,
                           user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).options(*ORDER_LOAD).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

    deadline = address_change_deadline(db, order)
    if not deadline or datetime.now(timezone.utc) > deadline:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Address changes are no longer allowed for this order")
    if any(r.status == "pending" for r in order.address_change_requests):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "An address change request is already pending for this order")

    requested = body.model_dump(exclude={"note"})
    db.add(OrderAddressChangeRequest(order_id=order.id, user_id=user.id, requested_address=requested, note=body.note))
    db.commit()
    db.refresh(order)
    return annotate_order(db, order)
