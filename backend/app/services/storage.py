"""Uploads customer-provided checkout files (customization photos/logos) and admin Media
Library images to Cloudflare R2 instead of embedding them as base64 inside product_snapshot
or writing them to this server's local disk.

Storefront pages (gifts.js/studio.js/corporate.js) still capture the upload as a data: URI
client-side for the live preview - that part is unchanged. This module intercepts it once, at
checkout, and swaps the base64 for a small R2 URL before it's ever written to Postgres. If the
upload fails for any reason (R2 misconfigured, network error) the caller keeps the original
base64 inline - checkout must never fail because of this.

R2 is a flat key -> object store (no folders, no auto-generated unique filenames like
Cloudinary gave us) - object keys below mirror the same "sai_kumar_studio/..." layout the
Cloudinary account used, with a uuid4 appended so concurrent uploads never collide.
"""
import io
import logging
import uuid

import boto3
from botocore.config import Config as BotoConfig

from ..config import get_settings

logger = logging.getLogger("storage")
settings = get_settings()

MAX_UPLOAD_BYTES = 20 * 1024 * 1024

# The customization keys storefront pages use for an uploaded photo/logo -
# mirrored in admin/js/orders.js's CUSTOM_IMAGE_FIELDS and admin.py's import
# of this constant, so there's one source of truth.
CUSTOM_UPLOAD_FIELDS = ("photoData", "logoData", "imageData", "artworkData")

_client = None


def storage_configured() -> bool:
    return settings.r2_configured


def ensure_storage_ready() -> None:
    """R2 has no bucket to pre-create here (the bucket itself is created once in the
    Cloudflare dashboard) - kept as a no-op call site so main.py's startup hook doesn't
    need to change if this changes again."""
    return


def _client_once():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.r2_access_key,
            aws_secret_access_key=settings.r2_secret_key,
            region_name="auto",
            config=BotoConfig(signature_version="s3v4"),
        )
    return _client


def _put_object(data: bytes, key: str, content_type: str) -> str | None:
    try:
        _client_once().put_object(
            Bucket=settings.r2_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
        return f"{settings.r2_public_base_url}/{key}"
    except Exception as e:
        logger.warning("R2 upload failed: %s", e)
        return None


def upload_data_uri(data_uri: str, subfolder: str) -> str | None:
    """Uploads a data: URI to R2, returning the public URL - or None if it isn't a
    data: URI, R2 isn't configured, or the upload fails, in which case the caller falls
    back to keeping the original base64 inline."""
    if not storage_configured() or not isinstance(data_uri, str) or not data_uri.startswith("data:"):
        return None
    try:
        header, b64data = data_uri.split(",", 1)
    except ValueError:
        return None
    approx_bytes = len(b64data) * 3 // 4
    if approx_bytes == 0 or approx_bytes > MAX_UPLOAD_BYTES:
        return None

    import base64
    try:
        data = base64.b64decode(b64data)
    except Exception:
        return None

    ext = ".bin"
    if "png" in header:
        ext, content_type = ".png", "image/png"
    elif "webp" in header:
        ext, content_type = ".webp", "image/webp"
    elif "gif" in header:
        ext, content_type = ".gif", "image/gif"
    else:
        ext, content_type = ".jpg", "image/jpeg"

    key = f"{settings.cloudinary_folder}/order_uploads/{subfolder}/{uuid.uuid4().hex}{ext}"
    return _put_object(data, key, content_type)


def upload_media_library_asset(data: bytes) -> str | None:
    """Uploads an admin Media Library image (already validated/re-encoded by
    services/media.py's process_image) to R2, returning its public URL - or None if R2
    isn't configured or the upload fails.

    Unlike upload_data_uri(), there's no local-disk fallback here: this app's
    database is a shared, hosted Postgres instance, so a file saved to one
    environment's disk (a laptop, a deploy) is invisible to every other
    environment reading the same Media row - which is exactly how uploads used
    to go missing. The caller must treat None as a failed upload, not silently
    keep serving a URL nothing backs."""
    if not storage_configured():
        return None
    key = f"{settings.cloudinary_folder}/media_library/{uuid.uuid4().hex}.webp"
    return _put_object(data, key, "image/webp")
