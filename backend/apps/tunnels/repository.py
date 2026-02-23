"""
Tunnel Repository
All database operations for the Tunnel model.
"""

import logging
from django.db.models import F
from django.utils import timezone
from .models import Tunnel

logger = logging.getLogger(__name__)


def create_tunnel(user, alias: str, token_hash: str, local_port: int | None = None) -> Tunnel:
    """Create and return a new Tunnel."""
    return Tunnel.objects.create(
        user=user,
        alias=alias,
        token_hash=token_hash,
        local_port=local_port,
    )


def get_tunnel_by_id(tunnel_id: str, user=None) -> Tunnel | None:
    """Fetch a tunnel by UUID. Optionally filter by owner."""
    try:
        qs = Tunnel.objects.filter(id=tunnel_id)
        if user:
            qs = qs.filter(user=user)
        return qs.get()
    except Tunnel.DoesNotExist:
        return None


def get_tunnel_by_alias(alias: str) -> Tunnel | None:
    """Fetch an active tunnel by alias."""
    try:
        return Tunnel.objects.get(alias=alias, is_active=True)
    except Tunnel.DoesNotExist:
        return None


def get_tunnel_by_token_hash(token_hash: str) -> Tunnel | None:
    """Find a tunnel by its hashed token (used for agent auth)."""
    try:
        return Tunnel.objects.select_related("user").get(
            token_hash=token_hash,
            is_active=True,
        )
    except Tunnel.DoesNotExist:
        return None




def get_user_tunnels(user, search: str | None = None, status: str | None = None) -> list[Tunnel]:
    """Return filtered tunnels owned by a user, newest first."""
    qs = Tunnel.objects.filter(user=user)
    
    if search:
        qs = qs.filter(alias__icontains=search)
    
    if status == "live":
        qs = qs.filter(status=Tunnel.STATUS_CONNECTED)
    elif status == "offline":
        qs = qs.filter(status=Tunnel.STATUS_DISCONNECTED)
        
    return list(qs.order_by("-created_at"))


def count_user_tunnels(user) -> int:
    """Return how many tunnels a user owns."""
    return Tunnel.objects.filter(user=user).count()


def update_tunnel_status(tunnel_id: str, status: str, set_connected_at: bool = False) -> None:
    """Update the status of a tunnel. Optionally set last_connected_at to now."""
    updates = {"status": status}
    if set_connected_at:
        updates["last_connected_at"] = timezone.now()
    Tunnel.objects.filter(id=tunnel_id).update(**updates)


def update_tunnel_token(tunnel_id: str, new_token_hash: str) -> None:
    """Replace the token hash (used for token regeneration)."""
    Tunnel.objects.filter(id=tunnel_id).update(token_hash=new_token_hash)


def update_tunnel(tunnel_id: str, **kwargs) -> bool:
    """Generic update for tunnel fields. Returns True if updated."""
    updated = Tunnel.objects.filter(id=tunnel_id).update(**kwargs)
    return updated > 0


def delete_tunnel(tunnel_id: str, user) -> bool:
    """Delete a tunnel owned by user. Returns True if deleted."""
    deleted, _ = Tunnel.objects.filter(id=tunnel_id, user=user).delete()
    return deleted > 0


def alias_exists(alias: str) -> bool:
    """Return True if the alias is already taken."""
    return Tunnel.objects.filter(alias=alias).exists()


def increment_bandwidth(tunnel_id: str, bytes_count: int) -> None:
    """Atomic increment of the bandwidth counter (in bytes)."""
    if bytes_count <= 0:
        return
    Tunnel.objects.filter(id=tunnel_id).update(bandwidth_bytes=F("bandwidth_bytes") + bytes_count)
