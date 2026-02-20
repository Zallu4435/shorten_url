"""
Analytics GraphQL Queries
  - get_analytics     : Full analytics summary for a URL (owner or admin)
  - click_history     : Paginated raw click events for a URL
  - my_analytics      : Aggregated overview across all user's URLs
"""

import graphene

from apps.analytics import services, repository
from apps.analytics.graphql.types import (
    AnalyticsSummaryType,
    PaginatedClicksType,
    UserAnalyticsOverviewType,
    DeviceBreakdownType,
    CountryBreakdownType,
    BrowserBreakdownType,
    OSBreakdownType,
    DateBreakdownType,
    ReferrerBreakdownType,
)
from shared.decorators import login_required


class AnalyticsQuery(graphene.ObjectType):

    # ── get_analytics ───────────────────────────────────────
    get_analytics = graphene.Field(
        AnalyticsSummaryType,
        url_id=graphene.UUID(
            required=True,
            description="UUID of the short URL to get analytics for.",
        ),
        start_date=graphene.Date(
            description="Optional start date filter (inclusive). Format: YYYY-MM-DD",
        ),
        end_date=graphene.Date(
            description="Optional end date filter (inclusive). Format: YYYY-MM-DD",
        ),
        description=(
            "Returns a full analytics summary for a short URL: "
            "total/unique clicks, breakdown by device, country, browser, OS, date, and referrer."
        ),
    )

    # ── click_history ────────────────────────────────────────
    click_history = graphene.Field(
        PaginatedClicksType,
        url_id=graphene.UUID(required=True, description="UUID of the short URL."),
        page=graphene.Int(default_value=1),
        limit=graphene.Int(default_value=20),
        start_date=graphene.Date(),
        end_date=graphene.Date(),
        description="Paginated list of raw click events for a specific short URL.",
    )

    # ── my_analytics ─────────────────────────────────────────
    my_analytics = graphene.Field(
        UserAnalyticsOverviewType,
        start_date=graphene.Date(description="Optional filter start date."),
        end_date=graphene.Date(description="Optional filter end date."),
        description="Returns aggregated analytics overview across all of your short URLs.",
    )

    # ── Resolvers ─────────────────────────────────────────────

    @login_required
    def resolve_get_analytics(root, info, url_id, start_date=None, end_date=None):
        user = info.context.user
        summary = services.get_analytics_summary(
            url_id=str(url_id),
            user=user,
            start_date=start_date,
            end_date=end_date,
        )

        # Build breakdown objects
        return AnalyticsSummaryType(
            url_id=url_id,
            total_clicks=summary["total_clicks"],
            unique_clicks=summary["unique_clicks"],
            clicks_by_device=[
                DeviceBreakdownType(device_type=d["device_type"], count=d["count"])
                for d in summary["clicks_by_device"]
            ],
            clicks_by_country=[
                CountryBreakdownType(
                    country=d["country"],
                    country_code=d.get("country_code", ""),
                    count=d["count"],
                )
                for d in summary["clicks_by_country"]
            ],
            clicks_by_browser=[
                BrowserBreakdownType(browser=d["browser"], count=d["count"])
                for d in summary["clicks_by_browser"]
            ],
            clicks_by_os=[
                OSBreakdownType(os=d["os"], count=d["count"])
                for d in summary["clicks_by_os"]
            ],
            clicks_by_date=[
                DateBreakdownType(date=d["date"], count=d["count"])
                for d in summary["clicks_by_date"]
            ],
            clicks_by_referrer=[
                ReferrerBreakdownType(referrer=d["referrer"], count=d["count"])
                for d in summary["clicks_by_referrer"]
            ],
        )

    @login_required
    def resolve_click_history(
        root, info, url_id, page=1, limit=20, start_date=None, end_date=None
    ):
        user = info.context.user

        # Verify ownership (service layer handles it)
        from apps.urls.repository import get_by_id as get_url
        from shared.exceptions import PermissionDeniedError
        short_url = get_url(str(url_id))
        if short_url.user_id and str(short_url.user_id) != str(user.id) and not user.is_admin:
            raise PermissionDeniedError("You can only view click history for your own links.")

        result = repository.get_click_history(
            url_id=str(url_id),
            page=page,
            limit=limit,
            start_date=start_date,
            end_date=end_date,
        )
        return PaginatedClicksType(
            clicks=result["clicks"],
            total=result["total"],
            page=result["page"],
            limit=result["limit"],
        )

    @login_required
    def resolve_my_analytics(root, info, start_date=None, end_date=None):
        user = info.context.user
        overview = services.get_user_analytics_overview(
            user=user,
            start_date=start_date,
            end_date=end_date,
        )
        return UserAnalyticsOverviewType(
            total_urls=overview["total_urls"],
            total_clicks=overview["total_clicks"],
            unique_clicks=overview["unique_clicks"],
            clicks_today=overview["clicks_today"],
            clicks_this_week=overview["clicks_this_week"],
            clicks_this_month=overview["clicks_this_month"],
            top_urls=overview["top_urls"],
        )
