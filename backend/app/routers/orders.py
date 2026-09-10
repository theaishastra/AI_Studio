import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from ..config import get_settings
from ..database import get_db
from ..deps import get_current_user
from ..models import Address, Order, OrderItem, Payment, Product, User
from ..schemas import CheckoutIn, OrderOut, PaymentInitOut
from ..services.notifications import order_event
from ..services.pricing import money, price_cart
from ..services.razorpay_service import create_rzp_order

router = APIRouter(prefix="/api/orders", tags=["orders"])
settings = get_settings()

ORDER_LOAD = (
    selectinload(Order.items),
    selectinload(Order.payments),
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
        [{"product_id": i.product_id, "title": i.title, "price": i.price, "qty": i.qty, "image": i.image} for i in body.items],
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
            product_snapshot={"title": line["title"], "image": line.get("image")},
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
    db.commit()
    db.refresh(order)
    db.refresh(payment)

    return {"order": OrderOut.model_validate(order), "payment": _payment_init(order, payment, user)}


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
        order_event(db, order, "cod_confirmed")
        db.commit()
        db.refresh(order)
    return order


@router.get("/my", response_model=list[OrderOut])
def my_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Order)
        .options(*ORDER_LOAD)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .limit(100)
        .all()
    )


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = (
        db.query(Order).options(*ORDER_LOAD)
        .filter(Order.id == order_id, Order.user_id == user.id).first()
    )
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return order


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
def cancel_order(order_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).options(*ORDER_LOAD).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    if order.status not in ("created", "payment_pending", "cod_confirmed", "paid"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Order can no longer be cancelled")

    if order.status in ("cod_confirmed", "paid"):
        product_ids = [item.product_id for item in order.items if item.product_id]
        products = {p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()} if product_ids else {}
        for item in order.items:
            product = products.get(item.product_id)
            if product and product.type == "product" and product.stock is not None:
                product.stock += item.qty

    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return order
