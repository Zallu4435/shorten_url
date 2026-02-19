"""
Admin Panel GraphQL Queries
All queries protected by @admin_required — non-admins get PermissionDeniedError.

  - platform_stats  : System-wide dashboard numbers
  - all_users        : Paginated + searchable full user list
  - user_detail      : Single user with stats
  - all_urls         : Paginated + searchable full URL list  (supports flaggedOnly filter)
"""

import graphene

from apps.admin_panel import services
from apps.admin_panel.graphql.types import (
    PlatformStatsType,
    PaginatedUsersType,
    PaginatedAdminURLsType,
    UserDetailType,
)
from apps.urls.graphql.types import ShortURLType
from shared.decorators import admin_required


class AdminQuery(graphene.ObjectType):

    # ── platform_stats ────────────────────────────────────────
    platform_stats = graphene.Field(
        PlatformStatsType,
        description=(
            "System-wide platform statistics: user counts, URL counts, click metrics. "
            "Admin only."
        ),
    )

    # ── all_users ─────────────────────────────────────────────
    all_users = graphene.Field(
        PaginatedUsersType,
        page=graphene.Int(default_value=1),
        limit=graphene.Int(default_value=20),
        search=graphene.String(
            description="Search by email or username (case-insensitive).",
            default_value="",
        ),
        is_active=graphene.Boolean(description="Filter by active status. Omit to show all."),
        is_admin=graphene.Boolean(description="Filter by admin status. Omit to show all."),
        description="Paginated list of all registered users. Admin only.",
    )

    # ── user_detail ────────────────────────────────────────────
    user_detail = graphene.Field(
        UserDetailType,
        user_id=graphene.UUID(required=True, description="UUID of the user."),
        description="Detailed view of a single user with URL/click stats. Admin only.",
    )

    # ── all_urls ──────────────────────────────────────────────
    all_urls = graphene.Field(
        PaginatedAdminURLsType,
        page=graphene.Int(default_value=1),
        limit=graphene.Int(default_value=20),
        search=graphene.String(
            description="Search by slug, original URL, or title.",
            default_value="",
        ),
        flagged_only=graphene.Boolean(
            default_value=False,
            description="Set True to show only flagged URLs.",
        ),
        active_only=graphene.Boolean(
            default_value=False,
            description="Set True to show only active URLs.",
        ),
        user_id=graphene.UUID(
            description="Filter by owner user ID.",
        ),
        description="Paginated list of all short URLs across the platform. Admin only.",
    )

    # ── Resolvers ──────────────────────────────────────────────

    @admin_required
    def resolve_platform_stats(root, info):
        stats = services.get_platform_stats()
        return PlatformStatsType(**stats)

    @admin_required
    def resolve_all_users(
        root, info,
        page=1, limit=20, search="",
        is_active=None, is_admin=None,
    ):
        result = services.list_all_users(
            page=page,
            limit=limit,
            search=search,
            is_active=is_active,
            is_admin=is_admin,
        )
        return PaginatedUsersType(
            users=result["users"],
            total=result["total"],
            page=result["page"],
            limit=result["limit"],
        )

    @admin_required
    def resolve_user_detail(root, info, user_id):
        result = services.get_user_detail(str(user_id))
        return UserDetailType(
            user=result["user"],
            url_count=result["url_count"],
            total_clicks=result["total_clicks"],
        )

    @admin_required
    def resolve_all_urls(
        root, info,
        page=1, limit=20, search="",
        flagged_only=False, active_only=False,
        user_id=None,
    ):
        result = services.list_all_urls(
            page=page,
            limit=limit,
            search=search,
            flagged_only=flagged_only,
            active_only=active_only,
            user_id=str(user_id) if user_id else None,
        )
        return PaginatedAdminURLsType(
            urls=result["urls"],
            total=result["total"],
            page=result["page"],
            limit=result["limit"],
        )
