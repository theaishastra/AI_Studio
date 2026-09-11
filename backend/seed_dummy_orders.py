"""One-off script: creates a few dummy orders covering address-change
requests, cancellation requests, and image-uploaded customization items from
gifts/studio/corporate - for exercising the admin Orders page end to end.
Run once with: python seed_dummy_orders.py
"""
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import (
    Address, Order, OrderAddressChangeRequest, OrderCancellationRequest,
    OrderItem, OrderTrackingEvent, Payment, User,
)
from app.routers.orders import _externalize_customization, order_number
from app.services.notifications import order_event

TINY_PNG = (
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEUlEQ"
    "VR4nGP8z8DwnwEIGEEEAB8ZBAWMwiuxAAAAAElFTkSuQmCC"
)

db = SessionLocal()

user = db.query(User).filter(User.email == "cart-test-1788373486@example.com").first()
address = db.query(Address).filter(Address.user_id == user.id).first()
print(f"Using customer {user.email} / address {address.city}")


def make_order(status: str, items: list[dict], total: float, payment_status: str):
    order = Order(
        number=order_number(),
        user_id=user.id,
        status=status,
        subtotal=total,
        discount=0,
        total=total,
        address_id=address.id,
        delivery_slot="10am - 2pm",
    )
    db.add(order)
    db.flush()

    for item in items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=None,  # these storefront pages render hardcoded package data, same as real checkouts
            product_snapshot={
                "title": item["title"],
                "image": item["image"],
                "customization": _externalize_customization(item["customization"], order.number),
            },
            unit_price=item["unit_price"],
            qty=item["qty"],
        ))

    db.add(Payment(
        order_id=order.id,
        razorpay_order_id=f"order_dummy_{order.number}",
        razorpay_payment_id=f"pay_dummy_{order.number}" if payment_status == "captured" else None,
        status=payment_status,
        amount=total,
    ))
    db.add(OrderTrackingEvent(order_id=order.id, status=status, title="Order placed"))
    db.flush()
    order_event(db, order, status)
    return order


# 1) Gifts page item (photo mug), status "paid" -> eligible for a pending address-change request.
order1 = make_order(
    status="paid",
    items=[{
        "title": "Personalised Photo Mug",
        "image": "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/gifts-assets/01-cup.png",
        "unit_price": 449, "qty": 1,
        "customization": {
            "photoData": TINY_PNG, "photoName": "family-photo.png",
            "text": "Happy Anniversary", "textStyle": "bold",
            "photoLayout": "single", "accent": "#8C1D40", "finish": "glossy",
            "photoCrop": {"fit": "cover", "zoom": 1.2, "x": 0, "y": 0},
            "previewTemplate": "mug-2d", "previewMode": "2d-fallback",
        },
    }],
    total=449, payment_status="captured",
)
db.add(OrderAddressChangeRequest(
    order_id=order1.id, user_id=user.id,
    requested_address={
        "full_name": "Test Buyer", "phone": "9876543210",
        "line1": "Flat 402, Sunrise Apartments", "line2": "Road No. 12, Banjara Hills",
        "city": "Hyderabad", "state": "Telangana", "pincode": "500034",
    },
    note="Shifted to a new flat, please deliver here instead.",
))
print(f"Order 1 (gifts, paid + pending address-change request): {order1.number}")

# 2) Studio page item (acrylic photo frame), status "in_production" -> eligible for a pending cancellation request.
order2 = make_order(
    status="in_production",
    items=[{
        "title": "Premium Wooden Photo Frame",
        "image": "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/gifts-assets/wooden-frame-2.png",
        "unit_price": 699, "qty": 2,
        "customization": {
            "photoData": TINY_PNG, "photoName": "portrait.jpg",
            "shape": "round", "size": "12x12 inch", "stand": "wooden easel", "background": "black",
            "photoCrop": {"fit": "contain", "zoom": 1.0, "x": 5, "y": -3},
            "previewMode": "3d",
        },
    }],
    total=1398, payment_status="captured",
)
db.add(OrderCancellationRequest(
    order_id=order2.id, user_id=user.id,
    reason="delivery_time_too_long",
    note="Need it before Diwali, production is taking too long.",
))
print(f"Order 2 (studio, in_production + pending cancellation request): {order2.number}")

# 3) Corporate page item (engraved gift), status "cod_confirmed" -> clean order, no pending request.
order3 = make_order(
    status="cod_confirmed",
    items=[{
        "title": "Engraved Corporate Plaque",
        "image": "https://res.cloudinary.com/ismg8jfl/image/upload/sai_kumar_studio/corporate-assets/plaque-01.jpg",
        "unit_price": 1299, "qty": 1,
        "customization": {
            "logoData": TINY_PNG, "logoName": "company-logo.png",
            "engravingText": "Wellytics Health Pvt Ltd", "technique": "laser engraving", "color": "gold",
        },
    }],
    total=1299, payment_status="created",
)
print(f"Order 3 (corporate, cod_confirmed, no pending request): {order3.number}")

db.commit()
print("\nDone. 3 dummy orders created.")
db.close()
