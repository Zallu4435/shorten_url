"""
Tunnel Registry
In-memory store mapping alias → WebSocket channel name.

This allows the HTTP proxy view to find which channel
to forward incoming requests to.

Note: This is process-local.
  In production with multiple workers, use the Channel Layer
  (Redis) for cross-process lookup (Phase 2 enhancement).
"""

import threading

_lock = threading.Lock()
_registry: dict[str, str] = {}


def register(alias: str, channel_name: str) -> None:
    """Register an alias as active with its WS channel name."""
    with _lock:
        _registry[alias] = channel_name


def unregister(alias: str) -> None:
    """Remove an alias from the registry (agent disconnected)."""
    with _lock:
        _registry.pop(alias, None)


def get_channel(alias: str) -> str | None:
    """Return the channel name for an alias, or None if offline."""
    with _lock:
        return _registry.get(alias)


def is_connected(alias: str) -> bool:
    """Return True if an agent is currently connected for this alias."""
    with _lock:
        return alias in _registry
