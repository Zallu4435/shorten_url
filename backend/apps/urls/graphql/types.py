"""
URLs GraphQL Types
"""

import graphene
from graphene_django import DjangoObjectType

from apps.urls.models import ShortURL
from apps.urls.utils import get_qr_endpoint_url


class ShortURLType(DjangoObjectType):
    """
    GraphQL representation of a ShortURL.
    Sensitive fields (password_hash, token) are excluded.
    Computed fields are added as extra properties.
    """

    # Computed fields (from model properties)
    is_expired = graphene.Boolean(description="True if the link has passed its expiration date.")
    is_scheduled = graphene.Boolean(description="True if the link is not yet active (before activates_at).")
    is_click_limit_reached = graphene.Boolean(description="True if the link has hit its click limit.")
    short_url = graphene.String(description="Full short URL (e.g. https://yourdomain.com/abc123).")
    qr_code_url = graphene.String(description="URL of the on-the-fly QR code endpoint. Empty string if qr_enabled is False.")

    class Meta:
        model = ShortURL
        fields = [
            "id",
            "user",
            "original_url",
            "slug",
            "title",
            "description",
            "is_active",
            "is_private",
            "is_single_use",
            "is_flagged",
            "flag_reason",
            "max_clicks",
            "click_count",
            "expires_at",
            "activates_at",
            "redirect_rules",
            "webhook_url",
            "qr_enabled",
            "is_url_reachable",
            "url_status_code",
            "last_checked_at",
            "created_at",
            "updated_at",
        ]
        description = "Represents a shortened URL with all its configuration."

    def resolve_is_expired(root, info):
        return root.is_expired

    def resolve_is_scheduled(root, info):
        return root.is_scheduled

    def resolve_is_click_limit_reached(root, info):
        return root.is_click_limit_reached

    def resolve_short_url(root, info):
        return root.short_url

    def resolve_qr_code_url(root, info):
        if not root.qr_enabled:
            return ""
        return get_qr_endpoint_url(root.slug)


class ResolveSlugPayloadType(graphene.ObjectType):
    """
    Returned when resolving a slug for redirection.
    Used by the frontend to handle password-protected links.
    """
    redirect_url = graphene.String(
        description="The URL to redirect to. Null if password is required."
    )
    requires_password = graphene.Boolean(
        required=True,
        description="True if this is a private link that needs a password."
    )
    short_url = graphene.Field(
        ShortURLType,
        description="The ShortURL metadata (available even for private links)."
    )


class PaginatedURLsType(graphene.ObjectType):
    """Paginated list of ShortURLs."""
    urls = graphene.List(graphene.NonNull(ShortURLType), required=True)
    total = graphene.Int(required=True, description="Total number of URLs.")
    page = graphene.Int(required=True)
    limit = graphene.Int(required=True)
    has_next = graphene.Boolean(required=True)

    def resolve_has_next(root, info):
        return (root.page * root.limit) < root.total
