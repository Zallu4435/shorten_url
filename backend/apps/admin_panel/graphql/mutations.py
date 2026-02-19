"""
Admin Panel GraphQL Mutations
All mutations protected by @admin_required.

User Management:
  - activateUser     : Re-enable a deactivated account
  - deactivateUser   : Disable a user account (sessions revoked immediately)
  - makeAdmin        : Grant admin privileges
  - removeAdmin      : Revoke admin privileges
  - deleteUser       : Hard delete a user + all their data (⚠️ irreversible)

URL Management:
  - flagUrl          : Mark a URL as unsafe + deactivate it
  - unflagUrl        : Clear a flag + reactivate the URL
  - activateUrl      : Force-enable a short URL
  - deactivateUrl    : Force-disable a short URL
  - adminDeleteUrl   : Hard delete any URL (admin override)
"""

import graphene

from apps.admin_panel import services
from apps.users.graphql.types import UserType, MessageType
from apps.urls.graphql.types import ShortURLType
from shared.decorators import admin_required


# ═══════════════════════════════════════════════════════════
# USER MANAGEMENT MUTATIONS
# ═══════════════════════════════════════════════════════════

class ActivateUser(graphene.Mutation):
    """Re-enable a previously deactivated user account."""

    class Arguments:
        user_id = graphene.UUID(required=True, description="UUID of the user to activate.")

    Output = UserType

    @classmethod
    @admin_required
    def mutate(cls, root, info, user_id):
        return services.activate_user(
            admin_user=info.context.user,
            target_user_id=str(user_id),
        )


class DeactivateUser(graphene.Mutation):
    """
    Disable a user account. All active sessions are revoked immediately.
    The user's data is preserved (soft disable).
    """

    class Arguments:
        user_id = graphene.UUID(required=True, description="UUID of the user to deactivate.")

    Output = UserType

    @classmethod
    @admin_required
    def mutate(cls, root, info, user_id):
        return services.deactivate_user(
            admin_user=info.context.user,
            target_user_id=str(user_id),
        )


class MakeAdmin(graphene.Mutation):
    """Grant admin privileges to a user."""

    class Arguments:
        user_id = graphene.UUID(required=True, description="UUID of the user to promote.")

    Output = UserType

    @classmethod
    @admin_required
    def mutate(cls, root, info, user_id):
        return services.make_admin(
            admin_user=info.context.user,
            target_user_id=str(user_id),
        )


class RemoveAdmin(graphene.Mutation):
    """Revoke admin privileges from a user."""

    class Arguments:
        user_id = graphene.UUID(required=True, description="UUID of the user to demote.")

    Output = UserType

    @classmethod
    @admin_required
    def mutate(cls, root, info, user_id):
        return services.remove_admin(
            admin_user=info.context.user,
            target_user_id=str(user_id),
        )


class AdminDeleteUser(graphene.Mutation):
    """
    ⚠️ IRREVERSIBLE: Hard delete a user account and all their data.
    Cascades: ShortURLs, RefreshTokens, Clicks are all deleted.
    """

    class Arguments:
        user_id = graphene.UUID(required=True, description="UUID of the user to delete.")

    Output = MessageType

    @classmethod
    @admin_required
    def mutate(cls, root, info, user_id):
        services.admin_delete_user(
            admin_user=info.context.user,
            target_user_id=str(user_id),
        )
        return MessageType(
            success=True,
            message=f"User {user_id} and all associated data have been permanently deleted.",
        )


# ═══════════════════════════════════════════════════════════
# URL MANAGEMENT MUTATIONS
# ═══════════════════════════════════════════════════════════

class FlagUrl(graphene.Mutation):
    """
    Flag a short URL as unsafe or inappropriate.
    The URL is deactivated immediately — redirects will be blocked.
    """

    class Arguments:
        url_id = graphene.UUID(required=True, description="UUID of the URL to flag.")
        reason = graphene.String(
            required=True,
            description="Reason for flagging (e.g. 'MALWARE', 'PHISHING', 'SPAM', or a note).",
        )

    Output = ShortURLType

    @classmethod
    @admin_required
    def mutate(cls, root, info, url_id, reason):
        return services.flag_url(
            admin_user=info.context.user,
            url_id=str(url_id),
            reason=reason,
        )


class UnflagUrl(graphene.Mutation):
    """
    Clear a flag from a short URL and reactivate it.
    Use when a reported URL has been reviewed and found safe.
    """

    class Arguments:
        url_id = graphene.UUID(required=True, description="UUID of the URL to unflag.")

    Output = ShortURLType

    @classmethod
    @admin_required
    def mutate(cls, root, info, url_id):
        return services.unflag_url(
            admin_user=info.context.user,
            url_id=str(url_id),
        )


class AdminActivateUrl(graphene.Mutation):
    """Force-enable a short URL (admin override)."""

    class Arguments:
        url_id = graphene.UUID(required=True, description="UUID of the URL to activate.")

    Output = ShortURLType

    @classmethod
    @admin_required
    def mutate(cls, root, info, url_id):
        return services.admin_activate_url(
            admin_user=info.context.user,
            url_id=str(url_id),
        )


class AdminDeactivateUrl(graphene.Mutation):
    """Force-disable a short URL (admin override)."""

    class Arguments:
        url_id = graphene.UUID(required=True, description="UUID of the URL to deactivate.")

    Output = ShortURLType

    @classmethod
    @admin_required
    def mutate(cls, root, info, url_id):
        return services.admin_deactivate_url(
            admin_user=info.context.user,
            url_id=str(url_id),
        )


class AdminDeleteUrl(graphene.Mutation):
    """
    ⚠️ IRREVERSIBLE: Hard delete any short URL (admin override — no ownership check).
    All associated click events are also deleted.
    """

    class Arguments:
        url_id = graphene.UUID(required=True, description="UUID of the URL to delete.")

    Output = MessageType

    @classmethod
    @admin_required
    def mutate(cls, root, info, url_id):
        services.admin_delete_url(
            admin_user=info.context.user,
            url_id=str(url_id),
        )
        return MessageType(
            success=True,
            message=f"Short URL {url_id} has been permanently deleted.",
        )


# ═══════════════════════════════════════════════════════════
# Mutation Root
# ═══════════════════════════════════════════════════════════

class AdminMutation(graphene.ObjectType):
    # User management
    activate_user = ActivateUser.Field(description="Re-enable a deactivated user account.")
    deactivate_user = DeactivateUser.Field(description="Disable a user account (sessions revoked).")
    make_admin = MakeAdmin.Field(description="Grant admin privileges to a user.")
    remove_admin = RemoveAdmin.Field(description="Revoke admin privileges from a user.")
    admin_delete_user = AdminDeleteUser.Field(description="⚠️ Hard delete a user + all their data.")

    # URL management
    flag_url = FlagUrl.Field(description="Flag a URL as unsafe and deactivate it.")
    unflag_url = UnflagUrl.Field(description="Clear a flag and reactivate a URL.")
    admin_activate_url = AdminActivateUrl.Field(description="Force-activate a short URL.")
    admin_deactivate_url = AdminDeactivateUrl.Field(description="Force-deactivate a short URL.")
    admin_delete_url = AdminDeleteUrl.Field(description="⚠️ Hard delete any short URL.")
