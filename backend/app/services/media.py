import io
import secrets
from pathlib import Path

from PIL import Image

MAX_SIZE = 10 * 1024 * 1024
MIN_SIZE = 100
MAX_DIMENSION = 4096
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}


def process_image(data: bytes, out_dir: Path, to_webp: bool = True) -> tuple[str, str, int]:
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

    out_dir.mkdir(parents=True, exist_ok=True)
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

    filename = secrets.token_hex(16) + ext
    (out_dir / filename).write_bytes(buffer.getvalue())
    return filename, mime, buffer.tell()
