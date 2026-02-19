"""
URLs Repository
Pure database operations for ShortURL model.
No business logic — just DB read/write.
"""

import logging
from django.db import models as db_models
from django.db.models import F
from django.utils import timezone

from apps.urls.models import ShortURL
from shared.exceptions import URLNotFoundError, PermissionDeniedError
from shared.constants import MAX_PAGE_SIZE

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Create
# ─────────────────────────────────────────────

def create_short_url(
    slug: str,
    original_url: str,
    user=None,
    title: str = "",
    description: str = "",
    is_private: bool = False,
    password_hash: str = "",
    is_single_use: bool = False,
    token: str = "",
    max_clicks: int = None,
    expires_at=None,
    activates_at=None,
    redirect_rules: list = None,
    webhook_url: str = "",
    is_url_reachable: bool = None,
    url_status_code: int = None,
) -> ShortURL:
    """Persist a new ShortURL to the database."""
    short_url = ShortURL.objects.create(
        slug=slug,
        original_url=original_url,
        user=user,
        title=title,
        description=description,
        is_private=is_private,
        password_hash=password_hash,
        is_single_use=is_single_use,
        token=token,
        max_clicks=max_clicks,
        expires_at=expires_at,
        activates_at=activates_at,
        redirect_rules=redirect_rules or [],
        webhook_url=webhook_url or "",
        is_url_reachable=is_url_reachable,
        url_status_code=url_status_code,
        last_checked_at=timezone.now() if is_url_reachable is not None else None,
    )
    logger.info(f"Short URL created: /{slug} → {original_url[:60]}")
    return short_url


# ─────────────────────────────────────────────
# Read
# ─────────────────────────────────────────────

def get_by_slug(slug: str) -> ShortURL:
    """
    Fetch a ShortURL by slug.
    Raises URLNotFoundError if not found.
    """
    try:
        return ShortURL.objects.select_related("user").get(slug=slug)
    except ShortURL.DoesNotExist:
        raise URLNotFoundError(f"No short URL found for slug '/{slug}'.")


def get_by_id(url_id: str, user=None) -> ShortURL:
    """
    Fetch a ShortURL by its UUID.
    If user is provided, enforces ownership (admins bypassed in service layer).
    Raises URLNotFoundError if not found.
    """
    try:
        qs = ShortURL.objects.select_related("user")
        if user:
            qs = qs.filter(user=user)
        return qs.get(id=url_id)
    except ShortURL.DoesNotExist:
        raise URLNotFoundError("Short URL not found.")


def list_by_user(user, page: int = 1, limit: int = 20) -> dict:
    """
    Paginated list of short URLs for a specific user.
    Returns dict with urls queryset, total count, page, limit.
    """
    limit = min(limit, MAX_PAGE_SIZE)
    offset = (page - 1) * limit

    qs = ShortURL.objects.filter(user=user).order_by("-created_at")
    total = qs.count()
    urls = qs[offset:offset + limit]

    return {"urls": urls, "total": total, "page": page, "limit": limit}


def get_all_urls(page: int = 1, limit: int = 20, flagged_only: bool = False) -> dict:
    """
    Paginated list of all short URLs (admin use).
    Optionally filter to only flagged URLs.
    """
    limit = min(limit, MAX_PAGE_SIZE)
    offset = (page - 1) * limit

    qs = ShortURL.objects.select_related("user").order_by("-created_at")
    if flagged_only:
        qs = qs.filter(is_flagged=True)

    total = qs.count()
    urls = qs[offset:offset + limit]

    return {"urls": urls, "total": total, "page": page, "limit": limit}


def find_duplicate_url(user, original_url: str) -> ShortURL | None:
    """
    Check if this user already has a short URL for this original URL.
    Returns the existing ShortURL or None.
    """
    if not user:
        return None
    return ShortURL.objects.filter(
        user=user,
        original_url=original_url,
    ).first()


def slug_exists(slug: str) -> bool:
    """Check if a slug is already taken."""
    return ShortURL.objects.filter(slug=slug).exists()


# ─────────────────────────────────────────────
# Update
# ─────────────────────────────────────────────

def update_short_url(url_id: str, **fields) -> ShortURL:
    """
    Update fields on a ShortURL.
    Returns updated instance.
    Raises URLNotFoundError if not found.
    """
    # Exclude protected fields that shouldn't be updated directly
    protected = {"id", "slug", "user", "created_at", "click_count"}
    safe_fields = {k: v for k, v in fields.items() if k not in protected}

    updated = ShortURL.objects.filter(id=url_id).update(**safe_fields)
    if updated == 0:
        raise URLNotFoundError("Short URL not found.")

    return ShortURL.objects.get(id=url_id)


def mark_used(slug: str) -> None:
    """Mark a single-use link as used."""
    ShortURL.objects.filter(slug=slug).update(used_at=timezone.now())


def update_url_health(slug: str, is_reachable: bool, status_code: int) -> None:
    """Update the health check results for a URL."""
    ShortURL.objects.filter(slug=slug).update(
        is_url_reachable=is_reachable,
        url_status_code=status_code,
        last_checked_at=timezone.now(),
    )


def set_qr_code_path(url_id: str, path: str) -> None:
    """Store the generated QR code file path."""
    ShortURL.objects.filter(id=url_id).update(qr_code=path)


def flag_url(url_id: str, reason: str) -> ShortURL:
    """Flag a URL as unsafe (admin action)."""
    ShortURL.objects.filter(id=url_id).update(
        is_flagged=True,
        flag_reason=reason,
        is_active=False,
    )
    return ShortURL.objects.get(id=url_id)


def unflag_url(url_id: str) -> ShortURL:
    """Remove flag from a URL (admin action)."""
    ShortURL.objects.filter(id=url_id).update(
        is_flagged=False,
        flag_reason="",
        is_active=True,
    )
    return ShortURL.objects.get(id=url_id)


# ─────────────────────────────────────────────
# Delete
# ─────────────────────────────────────────────

def delete_short_url(url_id: str) -> bool:
    """
    Hard delete a ShortURL by ID.
    Returns True if deleted, False if not found.
    """
    count, _ = ShortURL.objects.filter(id=url_id).delete()
    if count:
        logger.info(f"ShortURL id={url_id} deleted.")
    return count > 0


# ─────────────────────────────────────────────
# Click Counter (Atomic)
# ─────────────────────────────────────────────

def increment_click_count(slug: str) -> None:
    """
    Atomically increment the click counter.
    Uses F() expression to avoid race conditions.
    """
    ShortURL.objects.filter(slug=slug).update(
        click_count=F("click_count") + 1
    )
