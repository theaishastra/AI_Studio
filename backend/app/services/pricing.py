from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy.orm import Session

from ..models import Coupon


def money(v) -> Decimal:
    return Decimal(str(v)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def validate_coupon(db: Session, code: str | None, subtotal: Decimal) -> tuple[Coupon | None, Decimal, str]:
    if not code:
        return None, Decimal("0"), ""
    coupon = db.query(Coupon).filter(Coupon.code == code.upper(), Coupon.is_active == True).first()
    if not coupon:
        return None, Decimal("0"), "Coupon not found or inactive"

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    if coupon.starts_at and now < coupon.starts_at:
        return None, Decimal("0"), "Coupon not active yet"
    if coupon.ends_at and now > coupon.ends_at:
        return None, Decimal("0"), "Coupon has expired"
    if subtotal < money(coupon.min_order):
        return None, Decimal("0"), f"Minimum order value is ₹{coupon.min_order}"

    if coupon.type == "percent":
        discount = (subtotal * money(coupon.value) / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if coupon.max_discount is not None:
            discount = min(discount, money(coupon.max_discount))
    else:
        discount = money(coupon.value)

    discount = min(discount, subtotal)
    return coupon, discount, ""


def price_cart(db: Session, items: list[dict], coupon_code: str | None = None) -> dict:
    """items: [{title, price, qty, image?, product_id?}]. Prices are taken as given —
    most storefront pages still render hardcoded package data with no backend Product
    row to check a price against (see orders.py for the product_id-linked exception)."""
    lines = []
    subtotal = Decimal("0")
    for entry in items:
        qty = max(1, int(entry.get("qty", 1)))
        unit_price = money(entry["price"])
        line_total = unit_price * qty
        lines.append({**entry, "qty": qty, "unit_price": unit_price, "line_total": line_total})
        subtotal += line_total

    coupon, discount, coupon_message = validate_coupon(db, coupon_code, subtotal)
    total = subtotal - discount

    return {
        "lines": lines,
        "subtotal": subtotal,
        "discount": discount,
        "total": total,
        "coupon": coupon,
        "coupon_message": coupon_message,
    }
