"""
URLs Utilities
  - generate_unique_slug   : Random unique 7-char slug
  - generate_qr_code       : In-memory QR code PNG bytes (no disk I/O)
"""

import io
import logging
import random
import string

import qrcode
from django.conf import settings

from shared.constants import (
    SLUG_AUTO_LENGTH,
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
# QR Code Generation (On-the-Fly, In-Memory)
# ─────────────────────────────────────────────

def generate_qr_code(short_url_string: str) -> bytes:
    """
    Generate a production-grade QR code image entirely in memory.

    This function produces no files on disk and writes nothing to the database.
    The same URL will always produce the same QR code (deterministic).

    Quality settings (from constants.py):
      - BOX_SIZE = 20     → ~600px output — safe for printing and digital sharing
      - BORDER   = 4      → compliant with ISO/IEC 18004 quiet zone requirement
      - ERROR_CORRECTION H → 30% of the code can be obscured and still scan correctly.
                             This is the industry standard for branded/printed QR codes.

    Args:
        short_url_string: The full short URL to encode (e.g. "https://site.com/abc123").

    Returns:
        PNG image bytes ready to stream in an HTTP response or embed in a page.
    """
    error_correction = _QR_ERROR_CORRECTION_MAP.get(
        QR_CODE_ERROR_CORRECTION,
        qrcode.constants.ERROR_CORRECT_H,
    )

    qr = qrcode.QRCode(
        version=None,           # Auto-select the smallest version that fits the data
        error_correction=error_correction,
        box_size=QR_CODE_BOX_SIZE,
        border=QR_CODE_BORDER,
    )
    qr.add_data(short_url_string)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    logger.debug(f"QR code generated in memory for: {short_url_string}")
    return buffer.read()


def get_qr_endpoint_url(slug: str) -> str:
    """
    Return the public URL for a slug's on-the-fly QR code endpoint.
    Example: "http://localhost:8000/qr/abc123"
    """
    return f"{settings.BASE_URL}/qr/{slug}"
