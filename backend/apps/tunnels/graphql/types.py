"""
Tunnel GraphQL Types
"""

import graphene
from graphene_django import DjangoObjectType
from django.conf import settings

from apps.tunnels.models import Tunnel
from apps.tunnels import registry


class TunnelType(DjangoObjectType):
    """
    GraphQL representation of a Tunnel.
    token_hash is excluded — never exposed via API.
    """

    public_url = graphene.String(description="Full public URL for this tunnel.")
    is_connected = graphene.Boolean(description="True if an agent is currently connected.")

    class Meta:
        model = Tunnel
        fields = [
            "id",
            "alias",
            "status",
            "local_port",
            "is_active",
            "last_connected_at",
            "bandwidth_bytes",
            "created_at",
            "updated_at",
        ]
        description = "A tunnel that proxies public internet traffic to a local server."

    def resolve_public_url(root, info):
        base = getattr(settings, "BASE_URL", "http://localhost:8000")
        return f"{base}/t/{root.alias}/"

    def resolve_is_connected(root, info):
        return registry.is_connected(root.alias)


class CreateTunnelPayload(graphene.ObjectType):
    """
    Returned after creating a tunnel.
    raw_token is shown only once — it is never stored or retrievable again.
    """
    tunnel = graphene.Field(TunnelType)
    raw_token = graphene.String(
        description="The secret tunnel token. Shown ONCE — store it safely."
    )
    token_hint = graphene.String(
        description="First 10 chars of the token for identification (e.g. 'tk_a8f3...')"
    )
    agent_command = graphene.String(
        description="Ready-to-run agent CLI command."
    )
    error = graphene.String()


class RegenerateTokenPayload(graphene.ObjectType):
    """Returned after regenerating a tunnel token."""
    raw_token = graphene.String()
    token_hint = graphene.String()
    agent_command = graphene.String()
    error = graphene.String()
