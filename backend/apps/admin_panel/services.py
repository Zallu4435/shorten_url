"""
Admin Panel Service Layer
All privileged operations that only admins can perform.

Covers:
  - Platform-wide statistics
  - User management (activate, deactivate, promote, demote, delete)
  - URL management (flag, unflag, activate, deactivate, delete)
  - Search and filtered listing
"""

import logging
from datetime import timedelta

from django.db.models import Sum, Q
from django.utils import timezone

from apps.users.models import CustomUser, RefreshToken
from apps.urls.models import ShortURL
from apps.analytics.models import Click
from shared.exceptions import (
    UserNotFoundError,
    URLNotFoundError,
    PermissionDeniedError,
    ValidationError,
    ConflictError,
)
from shared.constants import MAX_PAGE_SIZE

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# PLATFORM STATISTICS
# ═══════════════════════════════════════════════════════════

def get_platform_stats() -> dict:
    """
    Collect a comprehensive snapshot of platform-wide metrics.
    Used by the admin dashboard.

    Returns:
        {
          total_users, active_users, new_users_today,
          total_urls, active_urls, flagged_urls, new_urls_today,
          total_clicks, clicks_today,
          total_clicks_this_week, total_clicks_this_month
        }
    """
    now = timezone.now()
    today = now.date()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # ── User counts ──────────────────────────────────────────
    total_users = CustomUser.objects.count()
    active_users = CustomUser.objects.filter(is_active=True).count()
    new_users_today = CustomUser.objects.filter(created_at__date=today).count()

    # ── URL counts ───────────────────────────────────────────
    total_urls = ShortURL.objects.count()
    active_urls = ShortURL.objects.filter(is_active=True, is_flagged=False).count()
    flagged_urls = ShortURL.objects.filter(is_flagged=True).count()
    new_urls_today = ShortURL.objects.filter(created_at__date=today).count()

    # ── Click counts ─────────────────────────────────────────
    # Use denormalized click_count sum (fast — no join needed)
    total_clicks = (
        ShortURL.objects.aggregate(total=Sum("click_count"))["total"] or 0
    )
    # Today's clicks from Click table for accuracy
    clicks_today = Click.objects.filter(created_at__date=today).count()
    clicks_this_week = Click.objects.filter(created_at__gte=week_ago).count()
    clicks_this_month = Click.objects.filter(created_at__gte=month_ago).count()

    return {
        # Users
        "total_users": total_users,
        "active_users": active_users,
        "new_users_today": new_users_today,
        # URLs
        "total_urls": total_urls,
        "active_urls": active_urls,
        "flagged_urls": flagged_urls,
        "new_urls_today": new_urls_today,
        # Clicks
        "total_clicks": total_clicks,
        "clicks_today": clicks_today,
        "clicks_this_week": clicks_this_week,
        "clicks_this_month": clicks_this_month,
    }


# ═══════════════════════════════════════════════════════════
# USER MANAGEMENT
# ═══════════════════════════════════════════════════════════

def list_all_users(
    page: int = 1,
    limit: int = 20,
    search: str = "",
    is_active: bool = None,
    is_admin: bool = None,
) -> dict:
    """
    Paginated list of all users. Supports search and filters.

    Args:
        search  : Filter by email or username (case-insensitive substring)
        is_active: Filter by active status (None = show all)
        is_admin : Filter by admin status (None = show all)
    """
    limit = min(limit, MAX_PAGE_SIZE)
    offset = (page - 1) * limit

    qs = CustomUser.objects.all().order_by("-created_at")

    if search:
        qs = qs.filter(
            Q(email__icontains=search) | Q(username__icontains=search)
        )
    if is_active is not None:
        qs = qs.filter(is_active=is_active)
    if is_admin is not None:
        qs = qs.filter(is_admin=is_admin)

    total = qs.count()
    users = qs[offset:offset + limit]

    return {"users": users, "total": total, "page": page, "limit": limit}


def get_user_detail(user_id: str) -> dict:
    """
    Get a single user with their URL count and click stats.
    Used for the admin user detail page.
    """
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        raise UserNotFoundError(user_id)

    url_count = ShortURL.objects.filter(user=user).count()
    total_clicks = (
        ShortURL.objects.filter(user=user).aggregate(total=Sum("click_count"))["total"] or 0
    )

    return {
        "user": user,
        "url_count": url_count,
        "total_clicks": total_clicks,
    }


def activate_user(admin_user, target_user_id: str) -> CustomUser:
    """Re-enable a deactivated user account."""
    user = _get_user_or_raise(target_user_id)
    if user.is_active:
        raise ConflictError("User is already active.")
    if str(user.id) == str(admin_user.id):
        raise ValidationError("You cannot modify your own account status.")
    user.is_active = True
    user.save(update_fields=["is_active"])
    logger.info(f"Admin {admin_user.email} activated user: {user.email}")
    return user


def deactivate_user(admin_user, target_user_id: str) -> CustomUser:
    """Deactivate a user account (soft disable — data preserved)."""
    user = _get_user_or_raise(target_user_id)
    if not user.is_active:
        raise ConflictError("User is already inactive.")
    if str(user.id) == str(admin_user.id):
        raise ValidationError("You cannot deactivate your own account.")
    user.is_active = False
    user.save(update_fields=["is_active"])
    # Revoke all refresh tokens so active sessions are cleared immediately
    RefreshToken.objects.filter(user=user, is_revoked=False).update(is_revoked=True)
    logger.info(f"Admin {admin_user.email} deactivated user: {user.email}")
    return user


def make_admin(admin_user, target_user_id: str) -> CustomUser:
    """Promote a user to admin."""
    user = _get_user_or_raise(target_user_id)
    if user.is_admin:
        raise ConflictError("User is already an admin.")
    user.is_admin = True
    user.is_staff = True
    user.save(update_fields=["is_admin", "is_staff"])
    logger.info(f"Admin {admin_user.email} promoted user to admin: {user.email}")
    return user


def remove_admin(admin_user, target_user_id: str) -> CustomUser:
    """Revoke admin privileges from a user."""
    user = _get_user_or_raise(target_user_id)
    if not user.is_admin:
        raise ConflictError("User is not an admin.")
    if str(user.id) == str(admin_user.id):
        raise ValidationError("You cannot remove your own admin privileges.")
    user.is_admin = False
    user.is_staff = False
    user.save(update_fields=["is_admin", "is_staff"])
    logger.info(f"Admin {admin_user.email} revoked admin from: {user.email}")
    return user


def admin_delete_user(admin_user, target_user_id: str) -> bool:
    """
    Hard delete a user and all their associated data (cascade).
    ⚠️ Irreversible.
    """
    user = _get_user_or_raise(target_user_id)
    if str(user.id) == str(admin_user.id):
        raise ValidationError("You cannot delete your own account.")
    email = user.email
    user.delete()  # CASCADE: deletes ShortURLs, RefreshTokens
    logger.warning(f"Admin {admin_user.email} hard-deleted user: {email}")
    return True


# ═══════════════════════════════════════════════════════════
# URL MANAGEMENT
# ═══════════════════════════════════════════════════════════

def list_all_urls(
    page: int = 1,
    limit: int = 20,
    search: str = "",
    flagged_only: bool = False,
    active_only: bool = False,
    user_id: str = None,
) -> dict:
    """
    Paginated list of all short URLs. Supports search, flag filter, owner filter.

    Args:
        search      : Filter by slug or original_url (case-insensitive)
        flagged_only: Show only flagged URLs
        active_only : Show only active URLs
        user_id     : Filter by owner user ID
    """
    limit = min(limit, MAX_PAGE_SIZE)
    offset = (page - 1) * limit

    qs = ShortURL.objects.select_related("user").order_by("-created_at")

    if search:
        qs = qs.filter(
            Q(slug__icontains=search) | Q(original_url__icontains=search)
            | Q(title__icontains=search)
        )
    if flagged_only:
        qs = qs.filter(is_flagged=True)
    if active_only:
        qs = qs.filter(is_active=True)
    if user_id:
        qs = qs.filter(user_id=user_id)

    total = qs.count()
    urls = qs[offset:offset + limit]

    return {"urls": urls, "total": total, "page": page, "limit": limit}


def flag_url(admin_user, url_id: str, reason: str) -> ShortURL:
    """Flag a URL as unsafe and deactivate it."""
    from apps.urls import repository as url_repo
    if not reason or not reason.strip():
        raise ValidationError("A reason is required when flagging a URL.")
    short_url = url_repo.flag_url(url_id, reason.strip())
    logger.warning(f"Admin {admin_user.email} flagged URL id={url_id}: {reason}")
    return short_url


def unflag_url(admin_user, url_id: str) -> ShortURL:
    """Remove a flag from a URL and reactivate it."""
    from apps.urls import repository as url_repo
    short_url = url_repo.unflag_url(url_id)
    logger.info(f"Admin {admin_user.email} unflagged URL id={url_id}")
    return short_url


def admin_activate_url(admin_user, url_id: str) -> ShortURL:
    """Force-activate a short URL."""
    from apps.urls import repository as url_repo
    short_url = _get_url_or_raise(url_id)
    if short_url.is_active:
        raise ConflictError("URL is already active.")
    result = url_repo.update_short_url(url_id, is_active=True)
    logger.info(f"Admin {admin_user.email} activated URL id={url_id}")
    return result


def admin_deactivate_url(admin_user, url_id: str) -> ShortURL:
    """Force-deactivate a short URL."""
    from apps.urls import repository as url_repo
    short_url = _get_url_or_raise(url_id)
    if not short_url.is_active:
        raise ConflictError("URL is already inactive.")
    result = url_repo.update_short_url(url_id, is_active=False)
    logger.info(f"Admin {admin_user.email} deactivated URL id={url_id}")
    return result


def admin_delete_url(admin_user, url_id: str) -> bool:
    """Hard delete a short URL (admin override — no ownership check)."""
    from apps.urls import repository as url_repo
    _get_url_or_raise(url_id)  # Verify exists first
    deleted = url_repo.delete_short_url(url_id)
    logger.warning(f"Admin {admin_user.email} hard-deleted URL id={url_id}")
    return deleted


# ═══════════════════════════════════════════════════════════
# INTERNAL HELPERS
# ═══════════════════════════════════════════════════════════

def _get_user_or_raise(user_id: str) -> CustomUser:
    try:
        return CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        raise UserNotFoundError(user_id)


def _get_url_or_raise(url_id: str) -> ShortURL:
    try:
        return ShortURL.objects.get(id=url_id)
    except ShortURL.DoesNotExist:
        raise URLNotFoundError(f"Short URL with id={url_id} not found.")
