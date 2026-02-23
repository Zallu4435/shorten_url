"""
Tunnel GraphQL Mutations:
  - CreateTunnel          → creates a tunnel, returns raw token once
  - DeleteTunnel          → deletes a tunnel the user owns
  - RegenerateTunnelToken → revokes old token, issues a new one
                            (disconnects any active agent using old token)
"""

import graphene
from shared.decorators import login_required
from django.conf import settings

from apps.tunnels.graphql.types import (
    TunnelType,
    CreateTunnelPayload,
    RegenerateTokenPayload,
)
from apps.tunnels import services, repository, registry


def _build_agent_command(alias: str, raw_token: str, port: int | None) -> str:
    port_arg = f"--port {port}" if port else "--port 3000"
    return f"python agent.py --alias {alias} --token {raw_token} {port_arg}"


def _build_token_hint(raw_token: str) -> str:
    return raw_token[:10] + "..."


class CreateTunnel(graphene.Mutation):
    """
    Create a new tunnel for the authenticated user.
    Returns the raw token exactly once — it cannot be retrieved again.
    """

    class Arguments:
        alias = graphene.String(required=True, description="Public alias (e.g. 'my-app').")
        local_port = graphene.Int(description="Optional local port (stored for display only).")

    Output = CreateTunnelPayload

    @classmethod
    @login_required
    def mutate(cls, root, info, alias: str, local_port: int = None):
        tunnel, raw_token, error = services.create_tunnel(
            user=info.context.user,
            alias=alias.lower().strip(),
            local_port=local_port,
        )
        if error:
            return CreateTunnelPayload(error=error)

        return CreateTunnelPayload(
            tunnel=tunnel,
            raw_token=raw_token,
            token_hint=_build_token_hint(raw_token),
            agent_command=_build_agent_command(alias, raw_token, local_port),
        )


class DeleteTunnel(graphene.Mutation):
    """
    Delete a tunnel owned by the authenticated user.
    Any active agent session is kicked via registry cleanup (handled by consumer disconnect).
    """

    class Arguments:
        id = graphene.UUID(required=True)

    success = graphene.Boolean(required=True)
    error = graphene.String()

    @classmethod
    @login_required
    def mutate(cls, root, info, id):
        tunnel_id = str(id)
        # If agent is connected, it will detect the WS close on its own
        error = services.delete_tunnel(tunnel_id, user=info.context.user)
        if error:
            return DeleteTunnel(success=False, error=error)
        return DeleteTunnel(success=True)


class RegenerateTunnelToken(graphene.Mutation):
    """
    Revoke the current token and issue a new one.
    Any agent using the old token will be disconnected immediately
    (the next WS message will fail auth).
    """

    class Arguments:
        id = graphene.UUID(required=True)

    Output = RegenerateTokenPayload

    @classmethod
    @login_required
    def mutate(cls, root, info, id):
        tunnel_id = str(id)

        # Look up tunnel to get alias and port for the agent command
        tunnel = repository.get_tunnel_by_id(tunnel_id, user=info.context.user)
        if not tunnel:
            return RegenerateTokenPayload(error="Tunnel not found.")

        # Kick the currently connected agent from the registry
        # (the agent's next send will get a close, triggering reconnect)
        registry.unregister(tunnel.alias)

        raw_token, error = services.regenerate_token(tunnel_id, user=info.context.user)
        if error:
            return RegenerateTokenPayload(error=error)

        return RegenerateTokenPayload(
            raw_token=raw_token,
            token_hint=_build_token_hint(raw_token),
            agent_command=_build_agent_command(tunnel.alias, raw_token, tunnel.local_port),
        )


class UpdateTunnel(graphene.Mutation):
    """
    Update tunnel properties (e.g. is_active).
    """

    class Arguments:
        id = graphene.UUID(required=True)
        is_active = graphene.Boolean()

    success = graphene.Boolean(required=True)
    error = graphene.String()
    tunnel = graphene.Field(TunnelType)

    @classmethod
    @login_required
    def mutate(cls, root, info, id, is_active=None):
        tunnel_id = str(id)
        updates = {}
        if is_active is not None:
            updates["is_active"] = is_active

        if not updates:
            return UpdateTunnel(success=False, error="No updates provided.")

        success = repository.update_tunnel(tunnel_id, **updates)
        if not success:
            return UpdateTunnel(success=False, error="Tunnel not found.")

        tunnel = repository.get_tunnel_by_id(tunnel_id)
        return UpdateTunnel(success=True, tunnel=tunnel)


class TunnelMutation(graphene.ObjectType):
    create_tunnel = CreateTunnel.Field()
    delete_tunnel = DeleteTunnel.Field()
    regenerate_tunnel_token = RegenerateTunnelToken.Field()
    update_tunnel = UpdateTunnel.Field()
