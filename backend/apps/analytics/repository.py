"""
Analytics Repository
All database reads for click data and analytics aggregations.
Keeps raw SQL/ORM logic out of the service layer.
"""

import logging
from django.db.models import Count
from django.db.models.functions import TruncDate, TruncHour

from apps.analytics.models import Click
from shared.constants import MAX_PAGE_SIZE, UNKNOWN_VALUE

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Write
# ─────────────────────────────────────────────

def log_click(
    short_url,
    ip_address: str = None,
    user_agent: str = "",
    referrer: str = "",
    country: str = "",
    country_code: str = "",
    city: str = "",
    region: str = "",
    device_type: str = UNKNOWN_VALUE,
    browser: str = "",
    browser_version: str = "",
    os: str = "",
    os_version: str = "",
    is_unique: bool = False,
) -> Click:
    """Persist a click event to the database."""
    click = Click.objects.create(
        short_url=short_url,
        ip_address=ip_address,
        user_agent=user_agent,
        referrer=referrer,
        country=country,
        country_code=country_code,
        city=city,
        region=region,
        device_type=device_type,
        browser=browser,
        browser_version=browser_version,
        os=os,
        os_version=os_version,
        is_unique=is_unique,
    )
    return click


# ─────────────────────────────────────────────
# Uniqueness Check
# ─────────────────────────────────────────────

def is_unique_visitor(short_url_id, ip_address: str) -> bool:
    """
    Returns True if this IP has never clicked this short URL before.
    Used to determine the is_unique flag on each click.
    """
    if not ip_address:
        return False
    return not Click.objects.filter(
        short_url_id=short_url_id,
        ip_address=ip_address,
    ).exists()


# ─────────────────────────────────────────────
# Basic Counts
# ─────────────────────────────────────────────

def count_total_clicks(url_id: str, start_date=None, end_date=None) -> int:
    """Total click count for a URL, optionally filtered by date range."""
    qs = Click.objects.filter(short_url_id=url_id)
    qs = _apply_date_filter(qs, start_date, end_date)
    return qs.count()


def count_unique_clicks(url_id: str, start_date=None, end_date=None) -> int:
    """Unique visitor count (based on IP) for a URL."""
    qs = Click.objects.filter(short_url_id=url_id, is_unique=True)
    qs = _apply_date_filter(qs, start_date, end_date)
    return qs.count()


# ─────────────────────────────────────────────
# Breakdown Aggregations
# ─────────────────────────────────────────────

def get_clicks_by_device(url_id: str, start_date=None, end_date=None) -> list:
    """
    Returns click counts grouped by device type.
    Example: [{"device_type": "mobile", "count": 120}, ...]
    """
    qs = Click.objects.filter(short_url_id=url_id)
    qs = _apply_date_filter(qs, start_date, end_date)
    return list(
        qs.values("device_type")
        .annotate(count=Count("id"))
        .order_by("-count")
    )


def get_clicks_by_country(url_id: str, start_date=None, end_date=None) -> list:
    """
    Returns click counts grouped by country.
    Example: [{"country": "India", "country_code": "IN", "count": 80}, ...]
    """
    qs = Click.objects.filter(short_url_id=url_id)
    qs = _apply_date_filter(qs, start_date, end_date)
    return list(
        qs.exclude(country="")
        .values("country", "country_code")
        .annotate(count=Count("id"))
        .order_by("-count")[:50]  # Top 50 countries
    )


def get_clicks_by_browser(url_id: str, start_date=None, end_date=None) -> list:
    """
    Returns click counts grouped by browser.
    Example: [{"browser": "Chrome", "count": 200}, ...]
    """
    qs = Click.objects.filter(short_url_id=url_id)
    qs = _apply_date_filter(qs, start_date, end_date)
    return list(
        qs.exclude(browser="")
        .values("browser")
        .annotate(count=Count("id"))
        .order_by("-count")
    )


def get_clicks_by_os(url_id: str, start_date=None, end_date=None) -> list:
    """
    Returns click counts grouped by operating system.
    Example: [{"os": "Android", "count": 150}, ...]
    """
    qs = Click.objects.filter(short_url_id=url_id)
    qs = _apply_date_filter(qs, start_date, end_date)
    return list(
        qs.exclude(os="")
        .values("os")
        .annotate(count=Count("id"))
        .order_by("-count")
    )


def get_clicks_by_date(url_id: str, start_date=None, end_date=None) -> list:
    """
    Returns click counts grouped by calendar date.
    Example: [{"date": "2026-02-19", "count": 45}, ...]
    """
    qs = Click.objects.filter(short_url_id=url_id)
    qs = _apply_date_filter(qs, start_date, end_date)
    return list(
        qs.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )


def get_user_clicks_by_date(user_url_ids, start_date=None, end_date=None) -> list:
    """
    Returns click counts grouped by date across all provided URL IDs.
    Used for the main dashboard aggregate chart.
    """
    qs = Click.objects.filter(short_url_id__in=user_url_ids)
    qs = _apply_date_filter(qs, start_date, end_date)
    return list(
        qs.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )


def get_clicks_by_hour(url_id: str, start_date=None, end_date=None) -> list:
    """
    Returns click counts grouped by hour of day (0–23).
    Useful for identifying peak usage times.
    """
    qs = Click.objects.filter(short_url_id=url_id)
    qs = _apply_date_filter(qs, start_date, end_date)
    return list(
        qs.annotate(hour=TruncHour("created_at"))
        .values("hour")
        .annotate(count=Count("id"))
        .order_by("hour")
    )


def get_clicks_by_referrer(url_id: str, start_date=None, end_date=None) -> list:
    """
    Returns click counts grouped by referrer URL.
    Example: [{"referrer": "https://twitter.com", "count": 30}, ...]
    """
    qs = Click.objects.filter(short_url_id=url_id)
    qs = _apply_date_filter(qs, start_date, end_date)
    return list(
        qs.exclude(referrer="")
        .values("referrer")
        .annotate(count=Count("id"))
        .order_by("-count")[:20]  # Top 20 referrers
    )


# ─────────────────────────────────────────────
# Paginated Click History
# ─────────────────────────────────────────────

def get_click_history(
    url_id: str,
    page: int = 1,
    limit: int = 20,
    start_date=None,
    end_date=None,
) -> dict:
    """
    Paginated raw click event list for a URL.
    Returns dict with clicks queryset, total count, page, limit.
    """
    limit = min(limit, MAX_PAGE_SIZE)
    offset = (page - 1) * limit

    qs = Click.objects.filter(short_url_id=url_id).order_by("-created_at")
    qs = _apply_date_filter(qs, start_date, end_date)

    total = qs.count()
    clicks = qs[offset:offset + limit]

    return {"clicks": clicks, "total": total, "page": page, "limit": limit}


# ─────────────────────────────────────────────
# Internal Helpers
# ─────────────────────────────────────────────

def _apply_date_filter(qs, start_date=None, end_date=None):
    """Apply optional start/end date filters to a queryset."""
    if start_date:
        qs = qs.filter(created_at__date__gte=start_date)
    if end_date:
        qs = qs.filter(created_at__date__lte=end_date)
    return qs
