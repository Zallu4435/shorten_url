"""
URLs GraphQL Queries
  - my_urls      : List the authenticated user's short URLs (paginated)
  - get_url      : Get a single short URL by ID (owner or admin)
  - resolve_slug : Check a slug for redirect (used by frontend before redirecting)
"""

import graphene

from apps.links import repository
from apps.links import services
from apps.links.graphql.types import ShortURLType, ResolveSlugPayloadType, PaginatedURLsType
from shared.decorators import login_required
from shared.exceptions import PermissionDeniedError


class URLQuery(graphene.ObjectType):

    # ── my_urls ──────────────────────────────────────────
    my_urls = graphene.Field(
        PaginatedURLsType,
        page=graphene.Int(default_value=1, description="Page number (starts at 1)."),
        limit=graphene.Int(default_value=20, description="Results per page (max 100)."),
        search=graphene.String(default_value="", description="Search by slug, URL, or title."),
        is_active=graphene.Boolean(description="Filter by active status."),
        is_private=graphene.Boolean(description="Filter by privacy status."),
        is_flagged=graphene.Boolean(description="Filter by flagged status."),
        order_by=graphene.String(default_value="newest", description="Criteria: newest, oldest, clicks_desc, slug_asc"),
        description="Returns all short URLs created by the authenticated user, paginated.",
    )

    # ── get_url ──────────────────────────────────────────
    get_url = graphene.Field(
        ShortURLType,
        id=graphene.UUID(required=True, description="UUID of the short URL."),
        description="Get a single short URL by ID. Only accessible by the owner or an admin.",
    )

    # ── resolve_slug ──────────────────────────────────────
    resolve_slug = graphene.Field(
        ResolveSlugPayloadType,
        slug=graphene.String(required=True, description="The short URL slug/alias."),
        password=graphene.String(description="Password for private links."),
        description=(
            "Resolve a slug to its redirect destination. "
            "Returns requiresPassword=True for private links without a password. "
            "Used by the frontend before performing the redirect."
        ),
    )

    # ── Resolvers ─────────────────────────────────────────

    @login_required
    def resolve_my_urls(
        root, info, 
        page: int = 1, limit: int = 20, search: str = "",
        is_active: bool = None, is_private: bool = None, is_flagged: bool = None,
        order_by: str = "newest"
    ):
        user = info.context.user
        result = repository.list_by_user(
            user=user, 
            page=page, 
            limit=limit,
            search=search,
            is_active=is_active,
            is_private=is_private,
            is_flagged=is_flagged,
            order_by=order_by
        )
        return PaginatedURLsType(
            urls=result["urls"],
            total=result["total"],
            page=result["page"],
            limit=result["limit"],
        )

    @login_required
    def resolve_get_url(root, info, id):
        user = info.context.user
        short_url = repository.get_by_id(str(id))

        # Ownership check — admins can see any URL
        if short_url.user_id and str(short_url.user_id) != str(user.id) and not user.is_admin:
            raise PermissionDeniedError("You do not have access to this short URL.")

        return short_url

    def resolve_resolve_slug(root, info, slug: str, password: str = None):
        """
        Public endpoint — no auth required.
        Frontend calls this before redirecting to handle:
         - Password prompts for private links
         - Expired/inactive link error pages
        """
        result = services.resolve_slug(slug=slug, password=password, request=info.context)
        return ResolveSlugPayloadType(
            redirect_url=result.get("redirect_url"),
            requires_password=result.get("requires_password", False),
            short_url=result.get("short_url"),
        )
