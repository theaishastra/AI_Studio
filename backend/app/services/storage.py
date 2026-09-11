"""Uploads customer-provided checkout files (customization photos/logos) to
Cloudinary instead of embedding them as base64 inside product_snapshot.

Storefront pages (gifts.js/studio.js/corporate.js) still capture the upload as
a data: URI client-side for the live preview - that part is unchanged. This
module intercepts it once, at checkout, and swaps the base64 for a small
Cloudinary URL before it's ever written to Postgres. If the upload fails for
any reason (Cloudinary misconfigured, network error, quota) the caller keeps
the original base64 inline - checkout must never fail because of this.

Reuses the same Cloudinary account already used for catalog product images
(see config.py's cloudinary_* settings / scripts/cloudinary_upload.py), just
under its own subfolder so customer uploads don't mix with catalog assets.
"""
import logging

import cloudinary
import cloudinary.uploader

from ..config import get_settings

logger = logging.getLogger("storage")
settings = get_settings()

MAX_UPLOAD_BYTES = 20 * 1024 * 1024

# The customization keys storefront pages use for an uploaded photo/logo -
# mirrored in admin/js/orders.js's CUSTOM_IMAGE_FIELDS and admin.py's import
# of this constant, so there's one source of truth.
CUSTOM_UPLOAD_FIELDS = ("photoData", "logoData", "imageData", "artworkData")

_configured = False


def storage_configured() -> bool:
    return settings.cloudinary_configured


def ensure_storage_ready() -> None:
    """Cloudinary has no bucket to pre-create (unlike object storage) -
    uploads land in their folder on first use. Kept as a no-op call site so
    main.py's startup hook doesn't need to change if this changes again."""
    return


def _configure_once() -> None:
    global _configured
    if _configured:
        return
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )
    _configured = True


def upload_data_uri(data_uri: str, subfolder: str) -> str | None:
    """Uploads a data: URI to Cloudinary, returning the secure URL - or None
    if it isn't a data: URI, Cloudinary isn't configured, or the upload fails,
    in which case the caller falls back to keeping the original base64 inline."""
    if not storage_configured() or not isinstance(data_uri, str) or not data_uri.startswith("data:"):
        return None
    try:
        b64data = data_uri.split(",", 1)[1]
    except IndexError:
        return None
    approx_bytes = len(b64data) * 3 // 4
    if approx_bytes == 0 or approx_bytes > MAX_UPLOAD_BYTES:
        return None

    _configure_once()
    try:
        result = cloudinary.uploader.upload(
            data_uri,
            folder=f"{settings.cloudinary_folder}/order_uploads/{subfolder}",
            resource_type="image",
            unique_filename=True,
            overwrite=False,
        )
        return result.get("secure_url")
    except Exception as e:
        logger.warning("Cloudinary upload failed: %s", e)
        return None
