"""
URLs GraphQL Mutations
  - CreateShortUrl : Shorten a URL with all options
  - UpdateShortUrl : Update a short URL's settings
  - DeleteShortUrl : Delete a short URL (owner or admin)
"""

import graphene

from apps.urls import services
from apps.urls.graphql.types import ShortURLType
from apps.users.graphql.types import MessageType
from shared.decorators import login_required


# ─────────────────────────────────────────────
# Create
# ─────────────────────────────────────────────

class CreateShortUrl(graphene.Mutation):
    """
    Shorten a long URL. Runs all 6 validation layers before creating.

    Example:
        mutation {
            createShortUrl(
                originalUrl: "https://very-long-url.com/path/to/something"
                slug: "my-link"
                title: "My Campaign Link"
                isPrivate: true
                password: "secret123"
                expiresAt: "2026-12-31T23:59:59Z"
                maxClicks: 100
            ) {
                id
                slug
                shortUrl
                qrCodeUrl
                clickCount
            }
        }
    """

    class Arguments:
        original_url = graphene.String(
            required=True,
            description="The long URL to shorten. Must be http:// or https://.",
        )
        slug = graphene.String(
            description="Custom alias (optional). Auto-generated if not provided. "
                        "Allowed: a-z, 0-9, hyphens, underscores (3–50 chars).",
        )
        title = graphene.String(description="Optional label for this link.")
        description = graphene.String(description="Optional notes.")
        is_private = graphene.Boolean(
            default_value=False,
            description="Set True to require a password for access.",
        )
        password = graphene.String(
            description="Password for private links. Required if isPrivate=true.",
        )
        is_single_use = graphene.Boolean(
            default_value=False,
            description="Set True to allow only one click.",
        )
        max_clicks = graphene.Int(
            description="Maximum number of allowed clicks. Null = unlimited.",
        )
        expires_at = graphene.DateTime(
            description="Expiration datetime (UTC). Link disabled after this.",
        )
        activates_at = graphene.DateTime(
            description="Scheduled activation datetime (UTC). Link unavailable before this.",
        )
        redirect_rules = graphene.JSONString(
            description=(
                "JSON array of dynamic redirect rules. "
                "Example: [{\"condition\": \"device=mobile\", \"target_url\": \"https://m.example.com\"}]"
            ),
        )
        webhook_url = graphene.String(
            description="URL to POST to on every click (webhook).",
        )
        generate_qr = graphene.Boolean(
            default_value=True,
            description="Whether to generate a QR code for this link.",
        )

    Output = ShortURLType

    @classmethod
    @login_required
    def mutate(
        cls,
        root,
        info,
        original_url: str,
        slug: str = None,
        title: str = "",
        description: str = "",
        is_private: bool = False,
        password: str = None,
        is_single_use: bool = False,
        max_clicks: int = None,
        expires_at=None,
        activates_at=None,
        redirect_rules=None,
        webhook_url: str = "",
        generate_qr: bool = True,
    ):
        user = info.context.user

        # Parse redirect_rules if passed as JSON string
        import json
        if isinstance(redirect_rules, str):
            try:
                redirect_rules = json.loads(redirect_rules)
            except json.JSONDecodeError:
                from shared.exceptions import ValidationError
                raise ValidationError("redirect_rules must be a valid JSON array.")

        short_url = services.create_short_url(
            original_url=original_url,
            user=user,
            slug=slug,
            title=title or "",
            description=description or "",
            is_private=is_private,
            password=password,
            is_single_use=is_single_use,
            max_clicks=max_clicks,
            expires_at=expires_at,
            activates_at=activates_at,
            redirect_rules=redirect_rules or [],
            webhook_url=webhook_url or "",
            generate_qr=generate_qr,
        )
        return short_url


# ─────────────────────────────────────────────
# Update
# ─────────────────────────────────────────────

class UpdateShortUrl(graphene.Mutation):
    """
    Update settings for an existing short URL.
    Only the owner or an admin can update.

    Example:
        mutation {
            updateShortUrl(
                id: "uuid-here"
                title: "New Title"
                isActive: false
                expiresAt: "2026-06-01T00:00:00Z"
            ) {
                id
                title
                isActive
            }
        }
    """

    class Arguments:
        id = graphene.UUID(required=True, description="UUID of the short URL to update.")
        title = graphene.String()
        description = graphene.String()
        is_active = graphene.Boolean()
        is_private = graphene.Boolean()
        password = graphene.String(description="New password (set empty string to remove).")
        max_clicks = graphene.Int()
        expires_at = graphene.DateTime()
        activates_at = graphene.DateTime()
        redirect_rules = graphene.JSONString()
        webhook_url = graphene.String()

    Output = ShortURLType

    @classmethod
    @login_required
    def mutate(cls, root, info, id, **kwargs):
        user = info.context.user

        # Remove None values — don't update fields not provided
        fields = {k: v for k, v in kwargs.items() if v is not None}

        # Parse redirect_rules JSON string
        if "redirect_rules" in fields and isinstance(fields["redirect_rules"], str):
            import json
            try:
                fields["redirect_rules"] = json.loads(fields["redirect_rules"])
            except json.JSONDecodeError:
                from shared.exceptions import ValidationError
                raise ValidationError("redirect_rules must be a valid JSON array.")

        return services.update_short_url(url_id=str(id), user=user, **fields)


# ─────────────────────────────────────────────
# Delete
# ─────────────────────────────────────────────

class DeleteShortUrl(graphene.Mutation):
    """
    Permanently delete a short URL. Only the owner or an admin can delete.

    Example:
        mutation {
            deleteShortUrl(id: "uuid-here") {
                success
                message
            }
        }
    """

    class Arguments:
        id = graphene.UUID(required=True, description="UUID of the short URL to delete.")

    Output = MessageType

    @classmethod
    @login_required
    def mutate(cls, root, info, id):
        user = info.context.user
        deleted = services.delete_short_url(url_id=str(id), user=user)

        if deleted:
            return MessageType(success=True, message="Short URL deleted successfully.")
        return MessageType(success=False, message="Short URL not found.")


# ─────────────────────────────────────────────
# Mutation Root
# ─────────────────────────────────────────────

class URLMutation(graphene.ObjectType):
    create_short_url = CreateShortUrl.Field(description="Shorten a URL.")
    update_short_url = UpdateShortUrl.Field(description="Update an existing short URL.")
    delete_short_url = DeleteShortUrl.Field(description="Delete a short URL.")
