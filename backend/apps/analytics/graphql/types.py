"""
Analytics GraphQL Types
"""

import graphene
from graphene_django import DjangoObjectType

from apps.analytics.models import Click


# ─────────────────────────────────────────────
# Raw Click Type
# ─────────────────────────────────────────────

class ClickType(DjangoObjectType):
    """Individual click event record."""

    class Meta:
        model = Click
        fields = [
            "id",
            "short_url",
            "ip_address",
            "referrer",
            "country",
            "country_code",
            "city",
            "region",
            "device_type",
            "browser",
            "browser_version",
            "os",
            "os_version",
            "is_unique",
            "created_at",
        ]
        description = "A single click event on a short URL."


# ─────────────────────────────────────────────
# Breakdown Types (for charts)
# ─────────────────────────────────────────────

class DeviceBreakdownType(graphene.ObjectType):
    """Clicks by device type."""
    device_type = graphene.String(required=True)
    count = graphene.Int(required=True)


class CountryBreakdownType(graphene.ObjectType):
    """Clicks by country."""
    country = graphene.String(required=True)
    country_code = graphene.String(required=True)
    count = graphene.Int(required=True)


class BrowserBreakdownType(graphene.ObjectType):
    """Clicks by browser."""
    browser = graphene.String(required=True)
    count = graphene.Int(required=True)


class OSBreakdownType(graphene.ObjectType):
    """Clicks by operating system."""
    os = graphene.String(required=True)
    count = graphene.Int(required=True)


class DateBreakdownType(graphene.ObjectType):
    """Clicks per calendar date."""
    date = graphene.Date(required=True)
    count = graphene.Int(required=True)


class ReferrerBreakdownType(graphene.ObjectType):
    """Clicks by referrer URL."""
    referrer = graphene.String(required=True)
    count = graphene.Int(required=True)


# ─────────────────────────────────────────────
# Full Analytics Summary
# ─────────────────────────────────────────────

class AnalyticsSummaryType(graphene.ObjectType):
    """
    Complete analytics summary for a single short URL.
    Returned by the getAnalytics query.
    """
    url_id = graphene.UUID(required=True)
    total_clicks = graphene.Int(required=True, description="Total number of clicks.")
    unique_clicks = graphene.Int(required=True, description="Number of unique visitors (by IP).")
    clicks_by_device = graphene.List(
        graphene.NonNull(DeviceBreakdownType),
        required=True,
        description="Click breakdown by device type (mobile/desktop/tablet/bot).",
    )
    clicks_by_country = graphene.List(
        graphene.NonNull(CountryBreakdownType),
        required=True,
        description="Click breakdown by country. Top 50 countries.",
    )
    clicks_by_browser = graphene.List(
        graphene.NonNull(BrowserBreakdownType),
        required=True,
        description="Click breakdown by browser (Chrome, Firefox, etc.).",
    )
    clicks_by_os = graphene.List(
        graphene.NonNull(OSBreakdownType),
        required=True,
        description="Click breakdown by operating system.",
    )
    clicks_by_date = graphene.List(
        graphene.NonNull(DateBreakdownType),
        required=True,
        description="Click counts per calendar date. Use for time-series charts.",
    )
    clicks_by_referrer = graphene.List(
        graphene.NonNull(ReferrerBreakdownType),
        required=True,
        description="Click breakdown by referrer URL. Top 20 referrers.",
    )


# ─────────────────────────────────────────────
# Paginated Click History
# ─────────────────────────────────────────────

class PaginatedClicksType(graphene.ObjectType):
    """Paginated list of raw click events."""
    clicks = graphene.List(graphene.NonNull(ClickType), required=True)
    total = graphene.Int(required=True)
    page = graphene.Int(required=True)
    limit = graphene.Int(required=True)
    has_next = graphene.Boolean(required=True)

    def resolve_has_next(root, info):
        return (root.page * root.limit) < root.total


# ─────────────────────────────────────────────
# User-Level Analytics Overview
# ─────────────────────────────────────────────

class UserAnalyticsOverviewType(graphene.ObjectType):
    """High-level analytics summary across all of a user's URLs."""
    total_urls = graphene.Int(required=True)
    total_clicks = graphene.Int(required=True)
    unique_clicks = graphene.Int(required=True)
    clicks_today = graphene.Int(required=True)
    clicks_this_week = graphene.Int(required=True)
    clicks_this_month = graphene.Int(required=True)
    top_urls = graphene.List(
        "apps.urls.graphql.types.ShortURLType",
        description="Top 5 most-clicked short URLs."
    )
