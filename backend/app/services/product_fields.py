"""Server-side validation for a product's admin-configured "Customer Input
Fields" (upload/dropdown/text) against the values a customer submitted at
checkout - see ProductInputFieldIn in schemas.py and the admin field builder
in admin/js/catalog.js. Mirrors the client-side checks in
js/shared/product-fields.js so a request that slips past (or skips) the
storefront JS still can't create an order that's missing a required answer.
"""
from ..models import Product


def _field_value_errors(field: dict, value) -> list[str]:
    label = field.get("label") or field.get("id")
    required = bool(field.get("required"))
    ftype = field.get("type")

    if value is None or value == "" or value == []:
        return [f'"{label}" is required'] if required else []

    if ftype == "text":
        if not isinstance(value, str):
            return [f'"{label}" must be text']
        return []

    if ftype == "dropdown":
        options = set(field.get("options") or [])
        chosen = value if isinstance(value, list) else [value]
        if not field.get("multi_select") and len(chosen) > 1:
            return [f'"{label}" only accepts a single selection']
        invalid = [c for c in chosen if c not in options]
        if invalid:
            return [f'"{label}" has an invalid selection']
        return []

    if ftype == "upload":
        files = value if isinstance(value, list) else [value]
        files = [f for f in files if f]
        max_files = int(field.get("max_files") or 1) if field.get("multiple") else 1
        if len(files) > max_files:
            return [f'"{label}" allows at most {max_files} file(s)']
        return []

    return []


def validate_product_field_values(product: Product, fields_values: dict | None) -> list[str]:
    """Returns a list of human-readable error strings (empty = valid)."""
    input_fields = product.input_fields or []
    if not input_fields:
        return []
    values = fields_values or {}
    errors: list[str] = []
    for field in input_fields:
        errors.extend(_field_value_errors(field, values.get(field.get("id"))))
    return errors
