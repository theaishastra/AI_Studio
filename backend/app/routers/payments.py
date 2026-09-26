import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..deps import audit, get_current_user, require_owner
from ..models import Order, OrderTrackingEvent, Payment, Product, User, WebhookEvent
from ..schemas import PaymentVerifyIn
from ..security import verify_razorpay_signature, verify_webhook_signature
from ..services.inventory import restock
from ..services.notifications import notify, order_event
from ..services.pricing import to_paise
from ..services.razorpay_service import create_refund, mock_payment_signature

router = APIRouter(prefix="/api/payments", tags=["payments"])
settings = get_settings()


def _mark_paid(db: Session, payment: Payment, razorpay_payment_id: str, signature: str | None):
    if payment.status == "captured":
        return
    payment.status = "captured"
    payment.razorpay_payment_id = razorpay_payment_id
    payment.signature = signature

    # Locks the row for this transaction - closes the narrow window where
    # orders.py's expire_stale_reservations() sweep could otherwise expire/restock
    # this exact order at the same instant its payment is being confirmed.
    order = db.get(Order, payment.order_id, with_for_update=True)
    if order.status in ("created", "payment_pending"):
        order.status = "paid"
        # Stock is no longer touched here - checkout() now reserves it atomically
        # (see services/inventory.py, orders.py's checkout()) at order-creation
        # time, not at payment-confirmation time. By the time a payment for this
        # order is being confirmed, its stock was already decremented; doing it
        # again here would double-decrement every paid order.
        db.add(OrderTrackingEvent(order_id=order.id, status="paid", title="Payment received"))
        order_event(db, order, "paid")
    else:
        # The order moved on (most likely cancelled by the customer) before this
        # payment confirmation arrived (a race between checkout and a delayed
        # Razorpay webhook/verify/mock-pay call). Real money has still been
        # captured above - silently dropping that here would leave an order
        # showing e.g. "cancelled" while the customer was actually charged, with
        # no stock adjusted and nobody ever told a manual refund is owed.
        db.add(OrderTrackingEvent(
            order_id=order.id, status=order.status,
            title="Payment received after order status changed",
            description=(
                f"Razorpay confirmed payment {razorpay_payment_id}, but the order had "
                f"already moved to '{order.status}' - needs manual review for a refund."
            ),
        ))
        notify(db, order.user_id, "Payment received on a changed order",
               f"We received your payment for order {order.number}, but its status had "
               f"already changed to '{order.status}'. Our team will review this and "
               "contact you if a refund is needed.")


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

    refund = create_refund(payment.razorpay_payment_id, to_paise(payment.amount))
    payment.status = "refunded"
    payment.refund_id = refund.get("id")

    if order.status in ("paid", "in_production", "cancelled"):
        # Only restock items still "active" - an order.status == "cancelled" here
        # means one or more items may have already been individually restocked
        # by an earlier per-item or whole-order cancellation; crediting them
        # again would inflate stock above the true on-hand count.
        active_items = [item for item in order.items if item.status == "active"]
        product_ids = [item.product_id for item in active_items if item.product_id]
        products = {p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()} if product_ids else {}
        for item in active_items:
            product = products.get(item.product_id)
            if product and product.type == "product" and product.stock is not None:
                restock(db, product.id, item.qty)
            item.status = "cancelled"
    order.status = "refunded"

    db.add(OrderTrackingEvent(order_id=order.id, status="refunded", title="Order refunded"))
    order_event(db, order, "refunded")
    audit(db, admin, "refund", "order", order.id, {"refund_id": refund.get("id")}, request)
    db.commit()
    return {"message": "Refund initiated", "refund_id": refund.get("id")}
