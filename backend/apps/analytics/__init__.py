"""
apps.analytics — Click Tracking & Analytics

Models:
    from apps.analytics.models import Click

Repository (data access):
    from apps.analytics.repository import (
        log_click,
        is_unique_visitor,
        get_total_clicks,
        get_unique_clicks,
        get_clicks_by_device,
        get_clicks_by_country,
        get_clicks_by_browser,
        get_clicks_by_os,
        get_clicks_by_date,
        get_clicks_by_referrer,
        get_click_history,
        get_platform_click_stats,
    )

Services (business logic):
    from apps.analytics.services import (
        log_click_event,            # Parse request → structured click data → DB
        get_analytics_summary,      # Full breakdown for a single URL
        get_user_analytics_overview # Aggregated stats across all user's URLs
    )
"""
