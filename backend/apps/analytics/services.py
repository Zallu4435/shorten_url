"""
Analytics Service Layer
Business logic for:
  - Parsing incoming click requests (IP, User-Agent, referrer → structured data)
  - IP geolocation (country, city via GeoIP2 / fallback)
  - Logging click events to the DB
  - Building full analytics summary for a URL
  - User-level analytics aggregation
"""

import logging
from datetime import date

from django.conf import settings

from apps.analytics import repository
from apps.analytics.models import Click
from shared.constants import UNKNOWN_VALUE, DEVICE_TYPES
from shared.exceptions import URLNotFoundError, PermissionDeniedError

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# CLICK EVENT LOGGING
# ═══════════════════════════════════════════════════════════

def log_click_event(short_url, request) -> Click:
    """
    Parse the incoming HTTP request and log a complete click event.
    This is called from the redirect view (views.py) after a successful redirect.
    Designed to be non-blocking — called in a background thread.

    Args:
        short_url : ShortURL instance that was clicked
        request   : Django HTTP request object

    Returns:
        Created Click instance
    """
    # Extract request data
    ip_address = _get_client_ip(request)
    user_agent_str = request.META.get("HTTP_USER_AGENT", "")
    referrer = request.META.get("HTTP_REFERER", "")

    # Parse User-Agent
    device_info = _parse_user_agent(user_agent_str)

    # Geo lookup from IP
    geo_info = _get_geo_info(ip_address)

    # Check uniqueness
    is_unique = repository.is_unique_visitor(short_url.id, ip_address)

    # Persist the click
    click = repository.log_click(
        short_url=short_url,
        ip_address=ip_address,
        user_agent=user_agent_str,
        referrer=referrer[:500] if referrer else "",  # Truncate long referrers
        country=geo_info.get("country", ""),
        country_code=geo_info.get("country_code", ""),
        city=geo_info.get("city", ""),
        region=geo_info.get("region", ""),
        device_type=device_info.get("device_type", UNKNOWN_VALUE),
        browser=device_info.get("browser", ""),
        browser_version=device_info.get("browser_version", ""),
        os=device_info.get("os", ""),
        os_version=device_info.get("os_version", ""),
        is_unique=is_unique,
    )

    logger.debug(
        f"Click logged: /{short_url.slug} "
        f"from {ip_address} | {device_info.get('device_type')} | "
        f"{geo_info.get('country', 'unknown')} | unique={is_unique}"
    )
    return click


# ═══════════════════════════════════════════════════════════
# ANALYTICS SUMMARY
# ═══════════════════════════════════════════════════════════

def get_analytics_summary(url_id: str, user, start_date: date = None, end_date: date = None) -> dict:
    """
    Build a complete analytics summary for a specific short URL.
    Enforces ownership — only the URL owner or admin can see analytics.

    Returns:
        {
            "url_id"             : str,
            "total_clicks"       : int,
            "unique_clicks"      : int,
            "clicks_by_device"   : [{"device_type": ..., "count": ...}],
            "clicks_by_country"  : [{"country": ..., "country_code": ..., "count": ...}],
            "clicks_by_browser"  : [{"browser": ..., "count": ...}],
            "clicks_by_os"       : [{"os": ..., "count": ...}],
            "clicks_by_date"     : [{"date": ..., "count": ...}],
            "clicks_by_referrer" : [{"referrer": ..., "count": ...}],
        }
    """
    # Verify URL access
    from apps.urls.repository import get_by_id as get_url_by_id
    try:
        short_url = get_url_by_id(url_id)
    except URLNotFoundError:
        raise

    # Ownership check
    if short_url.user_id and str(short_url.user_id) != str(user.id) and not user.is_admin:
        raise PermissionDeniedError("You can only view analytics for your own links.")

    return {
        "url_id": url_id,
        "short_url": short_url,
        "total_clicks": repository.count_total_clicks(url_id, start_date, end_date),
        "unique_clicks": repository.count_unique_clicks(url_id, start_date, end_date),
        "clicks_by_device": repository.get_clicks_by_device(url_id, start_date, end_date),
        "clicks_by_country": repository.get_clicks_by_country(url_id, start_date, end_date),
        "clicks_by_browser": repository.get_clicks_by_browser(url_id, start_date, end_date),
        "clicks_by_os": repository.get_clicks_by_os(url_id, start_date, end_date),
        "clicks_by_date": repository.get_clicks_by_date(url_id, start_date, end_date),
        "clicks_by_referrer": repository.get_clicks_by_referrer(url_id, start_date, end_date),
    }


def get_user_analytics_overview(user, start_date: date = None, end_date: date = None) -> dict:
    """
    Aggregate analytics across ALL of a user's short URLs.
    Returns platform-level stats for the user's dashboard.
    """
    from apps.urls.models import ShortURL
    from django.db.models import Sum

    user_url_ids = ShortURL.objects.filter(user=user).values_list("id", flat=True)

    from apps.analytics.models import Click as ClickModel
    from django.db.models import Count

    base_qs = ClickModel.objects.filter(short_url_id__in=user_url_ids)
    if start_date:
        base_qs = base_qs.filter(created_at__date__gte=start_date)
    if end_date:
        base_qs = base_qs.filter(created_at__date__lte=end_date)

    total_clicks = base_qs.count()
    unique_clicks = base_qs.filter(is_unique=True).count()
    total_urls = user_url_ids.count()

    # Temporal clicks (past 0, 7, 30 days)
    # Using ClickModel (base_qs represents the user's clicks)
    from django.utils import timezone
    from datetime import timedelta
    now = timezone.now()
    today = now.date()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    clicks_today = base_qs.filter(created_at__date=today).count()
    clicks_this_week = base_qs.filter(created_at__gte=week_ago).count()
    clicks_this_month = base_qs.filter(created_at__gte=month_ago).count()

    # Most clicked URLs for the user
    from apps.urls.models import ShortURL as ShortURLModel
    top_urls = (
        ShortURLModel.objects
        .filter(user=user)
        .order_by("-click_count")[:5]
    )

    return {
        "total_urls": total_urls,
        "total_clicks": total_clicks,
        "unique_clicks": unique_clicks,
        "clicks_today": clicks_today,
        "clicks_this_week": clicks_this_week,
        "clicks_this_month": clicks_this_month,
        "top_urls": top_urls,
    }


# ═══════════════════════════════════════════════════════════
# REQUEST PARSING HELPERS
# ═══════════════════════════════════════════════════════════

def _get_client_ip(request) -> str | None:
    """
    Extract the real client IP from the request.
    Handles proxies by checking X-Forwarded-For and X-Real-IP headers.
    """
    # X-Forwarded-For: client, proxy1, proxy2
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        # Take the first IP (actual client, not proxy)
        ip = x_forwarded_for.split(",")[0].strip()
        return ip if ip else None

    # X-Real-IP (Nginx)
    x_real_ip = request.META.get("HTTP_X_REAL_IP")
    if x_real_ip:
        return x_real_ip.strip()

    # Fallback to REMOTE_ADDR
    return request.META.get("REMOTE_ADDR") or None


def _parse_user_agent(user_agent_str: str) -> dict:
    """
    Parse a User-Agent string into structured device/browser/OS info.
    Uses the user-agents library for accurate parsing.
    Falls back to UNKNOWN_VALUE if parsing fails.

    Returns:
        {
            "device_type"    : str,  # mobile/tablet/desktop/bot/unknown
            "browser"        : str,
            "browser_version": str,
            "os"             : str,
            "os_version"     : str,
        }
    """
    if not user_agent_str:
        return _unknown_device_info()

    try:
        from user_agents import parse
        ua = parse(user_agent_str)

        # Device type
        if ua.is_bot:
            device_type = "bot"
        elif ua.is_mobile:
            device_type = "mobile"
        elif ua.is_tablet:
            device_type = "tablet"
        elif ua.is_pc:
            device_type = "desktop"
        else:
            device_type = UNKNOWN_VALUE

        return {
            "device_type": device_type,
            "browser": ua.browser.family or "",
            "browser_version": ua.browser.version_string or "",
            "os": ua.os.family or "",
            "os_version": ua.os.version_string or "",
        }
    except Exception as e:
        logger.debug(f"User-Agent parsing failed: {e}")
        return _unknown_device_info()


def _get_geo_info(ip_address: str) -> dict:
    """
    Attempt to get geolocation data from the IP address using MaxMind GeoIP2.

    Requires a GeoLite2-City.mmdb database file.
    Download from: https://dev.maxmind.com/geoip/geolite2-free-geolocation-data

    Set GEOIP2_DATABASE_PATH in settings.py to point to the .mmdb file.
    Falls back gracefully to empty strings if config is missing.

    Returns:
        {
            "country"     : str,
            "country_code": str,
            "city"        : str,
            "region"      : str,
        }
    """
    if not ip_address:
        return _unknown_geo()

    # Skip known non-routable IPs
    non_routable_prefixes = ("127.", "10.", "192.168.", "172.")
    if any(ip_address.startswith(p) for p in non_routable_prefixes):
        return _unknown_geo()

    db_path = getattr(settings, "GEOIP2_DATABASE_PATH", "")
    if not db_path:
        logger.debug("GEOIP2_DATABASE_PATH not configured — skipping geo lookup.")
        return _unknown_geo()

    try:
        import geoip2.database

        with geoip2.database.Reader(db_path) as reader:
            response = reader.city(ip_address)
            return {
                "country": response.country.name or "",
                "country_code": response.country.iso_code or "",
                "city": response.city.name or "",
                "region": (
                    response.subdivisions.most_specific.name
                    if response.subdivisions
                    else ""
                ),
            }
    except Exception as e:
        logger.debug(f"GeoIP2 lookup failed for {ip_address}: {e}")
        return _unknown_geo()


def _unknown_device_info() -> dict:
    return {
        "device_type": UNKNOWN_VALUE,
        "browser": "",
        "browser_version": "",
        "os": "",
        "os_version": "",
    }


def _unknown_geo() -> dict:
    return {
        "country": "",
        "country_code": "",
        "city": "",
        "region": "",
    }
