"""
URLs Utilities
  - generate_unique_slug   : Random unique 7-char slug
  - generate_qr_code       : QR code image generation + storage
"""

import os
import logging
import random
import string

import qrcode
from qrcode.image.pil import PilImage
from django.conf import settings

from shared.constants import (
    SLUG_AUTO_LENGTH,
    SLUG_ALLOWED_CHARS,
    QR_CODE_BOX_SIZE,
    QR_CODE_BORDER,
    QR_CODE_ERROR_CORRECTION,
)

logger = logging.getLogger(__name__)

# QR error correction mapping
_QR_ERROR_CORRECTION_MAP = {
    "L": qrcode.constants.ERROR_CORRECT_L,
    "M": qrcode.constants.ERROR_CORRECT_M,
    "Q": qrcode.constants.ERROR_CORRECT_Q,
    "H": qrcode.constants.ERROR_CORRECT_H,
}


# ─────────────────────────────────────────────
# Slug Generation
# ─────────────────────────────────────────────

def generate_unique_slug(length: int = SLUG_AUTO_LENGTH) -> str:
    """
    Generate a random, URL-safe slug of the given length.
    Verifies uniqueness against the database before returning.

    Characters used: a-z, 0-9 (no hyphens/underscores for auto-slugs — cleaner look).
    Retries up to 10 times if collision occurs (extremely rare after 7+ chars).

    Args:
        length: Number of characters. Default is SLUG_AUTO_LENGTH (7).

    Returns:
        A unique slug string.

    Raises:
        RuntimeError: If unable to generate a unique slug after 10 attempts.
    """
    from apps.urls.repository import slug_exists

    charset = string.ascii_lowercase + string.digits  # a-z + 0-9

    for attempt in range(10):
        slug = "".join(random.choices(charset, k=length))
        if not slug_exists(slug):
            logger.debug(f"Generated unique slug: '{slug}' (attempt {attempt + 1})")
            return slug

    # Extremely rare — increase length as fallback
    logger.warning("Slug collision threshold hit — increasing length by 1.")
    return generate_unique_slug(length + 1)


# ─────────────────────────────────────────────
# QR Code Generation
# ─────────────────────────────────────────────

def generate_qr_code(url_id: str, short_url_string: str) -> str:
    """
    Generate a QR code image for the given short URL and save it to disk.

    Args:
        url_id:            UUID of the ShortURL (used as filename).
        short_url_string:  Full short URL (e.g. https://yourdomain.com/abc123).

    Returns:
        Relative file path to the saved QR code image (relative to MEDIA_ROOT).
        Example: "qr_codes/abc123.png"

    The QR code is saved in MEDIA_ROOT/qr_codes/<url_id>.png
    """
    error_correction = _QR_ERROR_CORRECTION_MAP.get(
        QR_CODE_ERROR_CORRECTION,
        qrcode.constants.ERROR_CORRECT_L,
    )

    qr = qrcode.QRCode(
        version=1,
        error_correction=error_correction,
        box_size=QR_CODE_BOX_SIZE,
        border=QR_CODE_BORDER,
    )
    qr.add_data(short_url_string)
    qr.make(fit=True)

    img: PilImage = qr.make_image(fill_color="black", back_color="white")

    # Build save path
    qr_dir = os.path.join(settings.MEDIA_ROOT, "qr_codes")
    os.makedirs(qr_dir, exist_ok=True)

    filename = f"{url_id}.png"
    absolute_path = os.path.join(qr_dir, filename)
    relative_path = os.path.join("qr_codes", filename)

    img.save(absolute_path)

    logger.info(f"QR code generated: {relative_path}")
    return relative_path


def get_qr_code_url(relative_path: str) -> str:
    """
    Convert a relative QR code path to a full accessible URL.
    Example: "qr_codes/abc123.png" → "http://localhost:8000/media/qr_codes/abc123.png"
    """
    if not relative_path:
        return ""
    return f"{settings.BASE_URL}{settings.MEDIA_URL}{relative_path}"
