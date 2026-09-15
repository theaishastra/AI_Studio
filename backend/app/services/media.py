import io

from PIL import Image

MAX_SIZE = 10 * 1024 * 1024
MIN_SIZE = 100
MAX_DIMENSION = 4096
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def process_image(data: bytes, to_webp: bool = True) -> tuple[bytes, str, str]:
    """Validates and re-encodes an uploaded image. Returns (bytes, ext, mime) -
    callers decide where the result is persisted (Cloudinary, previously local
    disk) rather than this function writing anywhere itself, so the same
    validation/conversion logic works regardless of storage backend."""
    if len(data) > MAX_SIZE:
        raise ValueError("Image too large (max 10MB)")
    if len(data) < MIN_SIZE:
        raise ValueError("Image too small or empty")

    img = Image.open(io.BytesIO(data))
    img.load()
    if img.format not in ALLOWED_FORMATS:
        raise ValueError("Unsupported image format — use JPEG, PNG, or WEBP")

    if max(img.size) > MAX_DIMENSION:
        img.thumbnail((MAX_DIMENSION, MAX_DIMENSION))

    buffer = io.BytesIO()

    if to_webp:
        img = img.convert("RGBA") if img.mode in ("RGBA", "LA", "P") else img.convert("RGB")
        img.save(buffer, format="WEBP", quality=88)
        ext, mime = ".webp", "image/webp"
    elif img.mode in ("RGBA", "LA", "P"):
        img.save(buffer, format="PNG")
        ext, mime = ".png", "image/png"
    else:
        img.convert("RGB").save(buffer, format="JPEG", quality=88)
        ext, mime = ".jpg", "image/jpeg"

    return buffer.getvalue(), ext, mime
