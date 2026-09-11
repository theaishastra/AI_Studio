"""Business rules for post-purchase order self-service: when a customer can
still request a delivery-address change or a cancellation, and the computed
flags the frontend uses to show/hide those actions."""
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from ..models import Order, Product, Setting
from ..schemas import OrderOut

DEFAULT_ADDRESS_CHANGE_WINDOW_HOURS = 24

# Address changes only make sense before an order's items go into production -
# once shipped/delivered/cancelled/refunded there's nowhere left to redirect it.
ADDRESS_CHANGE_ELIGIBLE_STATUSES = ("created", "payment_pending", "cod_confirmed", "paid", "in_production")

# Nothing has been charged or committed yet at these statuses, so a customer can
# cancel immediately without staff review.
IMMEDIATE_CANCEL_STATUSES = ("created", "payment_pending")

# Once money has moved or production has started, cancelling needs a staff
# decision (refund/restock implications) - raised as a request instead.
REQUESTABLE_CANCEL_STATUSES = ("cod_confirmed", "paid", "in_production", "shipped")


def _default_window_hours(db: Session) -> int:
    setting = db.get(Setting, "order_policy")
    if setting and isinstance(setting.value, dict):
        value = setting.value.get("default_address_change_window_hours")
        if isinstance(value, (int, float)) and value > 0:
            return int(value)
    return DEFAULT_ADDRESS_CHANGE_WINDOW_HOURS


def _product_window_map(db: Session, product_ids: set[str]) -> dict[str, int]:
    """Batch lookup of address_change_window_hours for a set of product ids,
    so callers annotating many orders can avoid one Product query per order."""
    if not product_ids:
        return {}
    rows = (
        db.query(Product.id, Product.address_change_window_hours)
        .filter(Product.id.in_(product_ids))
        .all()
    )
    return {pid: hours for pid, hours in rows if hours is not None}


def address_change_deadline(
    db: Session, order: Order,
    window_map: dict[str, int] | None = None, default_hours: int | None = None,
) -> datetime | None:
    """The instant after which this order can no longer have its address
    changed, or None if it's already past the point of change entirely.
    Each item's product may set its own window (set by staff when creating the
    product - e.g. a "prints same day" product needs a shorter buffer than a
    made-to-order gift); the order uses the strictest (smallest) one so no
    item risks being produced against a stale address.

    window_map/default_hours let callers annotating many orders at once
    (e.g. the admin order list) pass in pre-fetched lookups instead of
    triggering a Product/Setting query per order."""
    if order.status not in ADDRESS_CHANGE_ELIGIBLE_STATUSES:
        return None
    product_ids = [item.product_id for item in order.items if item.product_id]
    if window_map is not None:
        windows = [window_map[pid] for pid in product_ids if pid in window_map]
    else:
        windows = []
        if product_ids:
            windows = [
                p.address_change_window_hours
                for p in db.query(Product).filter(Product.id.in_(product_ids)).all()
                if p.address_change_window_hours is not None
            ]
    if windows:
        hours = min(windows)
    else:
        hours = default_hours if default_hours is not None else _default_window_hours(db)
    return order.created_at + timedelta(hours=hours)


def _annotate(
    order: Order, deadline: datetime | None,
) -> OrderOut:
    out = OrderOut.model_validate(order)
    now = datetime.now(timezone.utc)
    out.address_change_deadline = deadline
    out.can_request_address_change = bool(
        deadline and now <= deadline
        and not any(r.status == "pending" for r in order.address_change_requests)
    )
    out.can_cancel = (
        order.status in (IMMEDIATE_CANCEL_STATUSES + REQUESTABLE_CANCEL_STATUSES)
        and not any(r.status == "pending" for r in order.cancellation_requests)
    )
    return out


def annotate_order(db: Session, order: Order) -> OrderOut:
    """Builds the customer-facing OrderOut, filling in the can_cancel /
    can_request_address_change / address_change_deadline flags the frontend
    uses to decide which self-service buttons to show."""
    deadline = address_change_deadline(db, order)
    return _annotate(order, deadline)


def annotate_orders(db: Session, orders: list[Order]) -> list[OrderOut]:
    """Same as annotate_order, but for a list: batches the Product window
    lookups and the order_policy Setting lookup into a couple of queries
    total instead of a couple per order."""
    product_ids = {
        item.product_id
        for o in orders if o.status in ADDRESS_CHANGE_ELIGIBLE_STATUSES
        for item in o.items if item.product_id
    }
    window_map = _product_window_map(db, product_ids)
    default_hours = _default_window_hours(db)
    return [
        _annotate(o, address_change_deadline(db, o, window_map, default_hours))
        for o in orders
    ]
