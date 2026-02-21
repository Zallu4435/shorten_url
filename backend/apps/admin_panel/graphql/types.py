"""
Admin Panel GraphQL Types
Reuses UserType and ShortURLType from their respective apps.
Adds admin-specific aggregate types.
"""

import graphene
from apps.users.graphql.types import UserType
from apps.links.graphql.types import ShortURLType


class PaginatedUsersType(graphene.ObjectType):
    """Paginated admin user list."""
    users = graphene.List(graphene.NonNull(UserType), required=True)
    total = graphene.Int(required=True)
    page = graphene.Int(required=True)
    limit = graphene.Int(required=True)
    has_next = graphene.Boolean(required=True)

    def resolve_has_next(root, info):
        return (root.page * root.limit) < root.total


class PaginatedAdminURLsType(graphene.ObjectType):
    """Paginated admin URL list."""
    urls = graphene.List(graphene.NonNull(ShortURLType), required=True)
    total = graphene.Int(required=True)
    page = graphene.Int(required=True)
    limit = graphene.Int(required=True)
    has_next = graphene.Boolean(required=True)

    def resolve_has_next(root, info):
        return (root.page * root.limit) < root.total


class PlatformStatsType(graphene.ObjectType):
    """
    System-wide platform statistics — shown on the admin dashboard.
    """
    # Users
    total_users = graphene.Int(required=True, description="Total registered users.")
    active_users = graphene.Int(required=True, description="Currently active user accounts.")
    new_users_today = graphene.Int(required=True, description="New registrations today.")

    # URLs
    total_urls = graphene.Int(required=True, description="Total short URLs across all users.")
    active_urls = graphene.Int(required=True, description="Active, non-flagged links.")
    flagged_urls = graphene.Int(required=True, description="URLs flagged as unsafe or inappropriate.")
    new_urls_today = graphene.Int(required=True, description="New short URLs created today.")

    # Clicks
    total_clicks = graphene.Int(required=True, description="All-time total click count.")
    clicks_today = graphene.Int(required=True, description="Clicks recorded today.")
    clicks_this_week = graphene.Int(required=True, description="Clicks in the last 7 days.")
    clicks_this_month = graphene.Int(required=True, description="Clicks in the last 30 days.")


class UserDetailType(graphene.ObjectType):
    """Admin view of a user with extra stats."""
    user = graphene.Field(UserType, required=True)
    url_count = graphene.Int(required=True, description="Total short URLs created by this user.")
    total_clicks = graphene.Int(required=True, description="Total clicks across all user's links.")
