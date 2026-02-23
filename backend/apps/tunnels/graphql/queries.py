"""
Tunnel GraphQL Queries
"""

import graphene
from shared.decorators import login_required

from apps.tunnels.graphql.types import TunnelType
from apps.tunnels import repository


class TunnelQuery(graphene.ObjectType):

    my_tunnels = graphene.List(
        graphene.NonNull(TunnelType),
        search=graphene.String(),
        status=graphene.String(),
        description="List all tunnels owned by the authenticated user with optional filtering.",
    )

    get_tunnel = graphene.Field(
        TunnelType,
        id=graphene.UUID(required=True),
        description="Get a single tunnel by ID (must be owner).",
    )

    @login_required
    def resolve_my_tunnels(root, info, search=None, status=None):
        return repository.get_user_tunnels(info.context.user, search=search, status=status)

    @login_required
    def resolve_get_tunnel(root, info, id):
        return repository.get_tunnel_by_id(str(id), user=info.context.user)
