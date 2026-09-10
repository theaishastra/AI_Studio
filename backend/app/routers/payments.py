import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..deps import audit, get_current_user, require_owner
from ..models import Order, Payment, Product, User, WebhookEvent
from ..schemas import PaymentVerifyIn
from ..security import verify_razorpay_signature, verify_webhook_signature
from ..services.notifications import order_event
from ..services.razorpay_service import create_refund, mock_payment_signature

router = APIRouter(prefix="/api/payments", tags=["payments"])
settings = get_settings()


def _mark_paid(db: Session, payment: Payment, razorpay_payment_id: str, signature: str | None):
    if payment.status == "captured":
        return
    payment.status = "captured"
    payment.razorpay_payment_id = razorpay_payment_id
    payment.signature = signature

    order = db.get(Order, payment.order_id)
    if order.status in ("created", "payment_pending"):
        order.status = "paid"
        product_ids = [item.product_id for item in order.items if item.product_id]
        products = {p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()} if product_ids else {}
        for item in order.items:
            product = products.get(item.product_id)
            if product and product.type == "product" and product.stock is not None:
                product.stock = max(0, product.stock - item.qty)
        order_event(db, order, "paid")


@router.post("/verify")
def verify_payment(body: PaymentVerifyIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.razorpay_order_id == body.razorpay_order_id).first()
    if not payment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment not found")
    order = db.get(Order, payment.order_id)
    if not order or order.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment not found")

    if not verify_razorpay_signature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature, settings.razorpay_key_secret):
        payment.status = "failed"
        db.commit()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Payment signature verification failed")

    _mark_paid(db, payment, body.razorpay_payment_id, body.razorpay_signature)
    db.commit()
    return {"message": "Payment verified", "order_id": order.id, "order_number": order.number, "status": order.status}


def _process_webhook(db: Session, body: bytes, event_id: str) -> None:
    payload = json.loads(body)
    if event_id:
        db.add(WebhookEvent(event_id=event_id, event_type=payload.get("event", ""), payload=payload))

    event = payload.get("event")
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    razorpay_order_id = entity.get("order_id")
    payment = db.query(Payment).filter(Payment.razorpay_order_id == razorpay_order_id).first() if razorpay_order_id else None

    if payment:
        if event in ("payment.captured", "order.paid"):
            _mark_paid(db, payment, entity.get("id", payment.razorpay_payment_id), None)
        elif event == "payment.failed" and payment.status != "captured":
            payment.status = "failed"
        elif event == "refund.processed":
            payment.status = "refunded"

    db.commit()


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    # Reading the body is genuinely async I/O; everything after it is synchronous
    # DB work (network round trips to the remote Postgres) and must not run
    # directly on the event loop, or it blocks every other concurrent request
    # for its duration - so it's pushed to a worker thread via run_in_threadpool.
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    event_id = request.headers.get("X-Razorpay-Event-Id", "")

    if not verify_webhook_signature(body, signature, settings.razorpay_webhook_secret):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid webhook signature")

    if event_id and db.query(WebhookEvent).filter(WebhookEvent.event_id == event_id).first():
        return {"message": "ok"}

    await run_in_threadpool(_process_webhook, db, body, event_id)
    return {"message": "ok"}


@router.post("/mock-pay/{payment_id}")
def mock_pay(payment_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not settings.razorpay_mock:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not available")
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment not found")
    order = db.get(Order, payment.order_id)
    if not order or order.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment not found")

    mock = mock_payment_signature(payment.razorpay_order_id)
    _mark_paid(db, payment, mock["razorpay_payment_id"], mock["razorpay_signature"])
    db.commit()
    return {"message": "Payment verified", "order_id": order.id, "order_number": order.number, "status": order.status}


@router.post("/refund/{order_id}")
def refund_order(order_id: str, request: Request, admin: User = Depends(require_owner), db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    payment = (
        db.query(Payment)
        .filter(Payment.order_id == order.id, Payment.status == "captured")
        .order_by(Payment.created_at.desc())
        .first()
    )
    if not payment:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No captured payment to refund")

    refund = create_refund(payment.razorpay_payment_id, int(round(float(payment.amount) * 100)))
    payment.status = "refunded"
    payment.refund_id = refund.get("id")

    if order.status in ("paid", "in_production", "cancelled"):
        product_ids = [item.product_id for item in order.items if item.product_id]
        products = {p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()} if product_ids else {}
        for item in order.items:
            product = products.get(item.product_id)
            if product and product.type == "product" and product.stock is not None:
                product.stock += item.qty
    order.status = "refunded"

    order_event(db, order, "refunded")
    audit(db, admin, "refund", "order", order.id, {"refund_id": refund.get("id")}, request)
    db.commit()
    return {"message": "Refund initiated", "refund_id": refund.get("id")}
