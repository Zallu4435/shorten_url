"""
User GraphQL Types
Defines how User objects are exposed in the GraphQL schema.
"""

import graphene
from graphene_django import DjangoObjectType

from apps.users.models import CustomUser


class UserType(DjangoObjectType):
    """
    GraphQL representation of a user.
    Sensitive fields (password_hash, etc.) are excluded.
    """

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "username",
            "is_admin",
            "is_active",
            "is_verified",
            "created_at",
            "updated_at",
        ]
        description = "Represents a registered user account."


class AuthPayloadType(graphene.ObjectType):
    """
    Returned after a successful login or register.
    Contains both tokens and the user object.
    """
    access_token = graphene.String(
        required=True,
        description="Short-lived JWT access token (15 minutes). "
                    "Send as: Authorization: Bearer <token>"
    )
    refresh_token = graphene.String(
        required=True,
        description="Long-lived refresh token (7 days). "
                    "Use with the refreshToken mutation to get a new access token."
    )
    user = graphene.Field(
        UserType,
        required=True,
        description="The authenticated user's profile."
    )


class TokenRefreshPayloadType(graphene.ObjectType):
    """
    Returned after a successful token refresh.
    Contains new access + refresh tokens (old refresh token is revoked).
    """
    access_token = graphene.String(
        required=True,
        description="New JWT access token."
    )
    refresh_token = graphene.String(
        required=True,
        description="New refresh token. The old refresh token is now invalid."
    )


class MessageType(graphene.ObjectType):
    """Generic success/message response."""
    success = graphene.Boolean(required=True)
    message = graphene.String(required=True)
