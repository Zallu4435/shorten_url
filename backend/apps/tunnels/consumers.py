"""
AgentConsumer — WebSocket Consumer for Tunnel Agents

Lifecycle:
  connect()    → validate token → register alias → mark connected
  disconnect() → unregister alias → mark disconnected
  receive()    → receive HTTP request payload → forward to local app → send response back

Message protocol (JSON over WebSocket):
  Agent → Server:   { "type": "response", "request_id": str, "status": int, "headers": dict, "body": str }
  Server → Agent:   { "type": "request", "request_id": str, "method": str, "path": str, "headers": dict, "body": str }
  Server → Agent:   { "type": "disconnect", "reason": str }
"""

import json
import uuid
import asyncio
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

from apps.tunnels import registry
from apps.tunnels.models import Tunnel

logger = logging.getLogger(__name__)

# Pending request futures: { request_id: asyncio.Future }
_pending_requests: dict[str, asyncio.Future] = {}


class AgentConsumer(AsyncWebsocketConsumer):
    """
    Handles the persistent WebSocket connection from the local agent.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.alias: str | None = None
        self.tunnel_id: str | None = None

    # ─── Connection ────────────────────────────────────────────

    async def connect(self):
        """
        Called when the agent opens a WebSocket connection.
        Validates token and registers the alias.
        """
        self.alias = self.scope["url_route"]["kwargs"]["alias"]
        raw_token = self._extract_token()

        if not raw_token:
            await self._reject("Missing token. Provide 'Authorization: Bearer <token>' header.")
            return

        # Validate token (sync DB call in thread)
        tunnel = await self._get_tunnel_for_token(raw_token)
        if not tunnel:
            await self._reject("Invalid token. Check your credentials.")
            return

        if tunnel.alias != self.alias:
            await self._reject("Token does not match this alias.")
            return

        # Enforce one-agent-per-alias
        if registry.is_connected(self.alias):
            await self._reject(f"Alias '{self.alias}' already has an active session.")
            return

        self.tunnel_id = str(tunnel.id)

        # Register and accept
        registry.register(self.alias, self.channel_name)
        await self._mark_connected()
        await self.accept()

        logger.info("Agent connected: alias=%s channel=%s", self.alias, self.channel_name)

    async def disconnect(self, close_code):
        """Called when the agent disconnects (intentional or dropped)."""
        if self.alias:
            registry.unregister(self.alias)
            await self._mark_disconnected()
            logger.info("Agent disconnected: alias=%s code=%s", self.alias, close_code)

    # ─── Message Handling ──────────────────────────────────────

    async def receive(self, text_data=None, bytes_data=None):
        """
        Called when the agent sends a message.
        Expected: JSON response to a previously forwarded HTTP request.
        """
        try:
            data = json.loads(text_data or "{}")
        except json.JSONDecodeError:
            logger.warning("AgentConsumer received invalid JSON from alias=%s", self.alias)
            return

        msg_type = data.get("type")
        request_id = data.get("request_id")

        if msg_type == "response" and request_id:
            future = _pending_requests.pop(request_id, None)
            if future and not future.done():
                future.set_result(data)

    # ─── Public API (used by TunnelProxyView) ──────────────────

    @staticmethod
    async def forward_request(
        channel_name: str,
        method: str,
        path: str,
        headers: dict,
        body: str,
        timeout: int = 30,
    ) -> dict | None:
        """
        Send an HTTP request payload to the agent over WS and wait for a response.
        Returns the response dict or None on timeout.

        Called by TunnelProxyView (from a sync thread via async_to_sync).
        """
        from channels.layers import get_channel_layer

        request_id = str(uuid.uuid4())
        future: asyncio.Future = asyncio.get_event_loop().create_future()
        _pending_requests[request_id] = future

        channel_layer = get_channel_layer()
        await channel_layer.send(channel_name, {
            "type": "tunnel.request",
            "request_id": request_id,
            "method": method,
            "path": path,
            "headers": headers,
            "body": body,
        })

        try:
            return await asyncio.wait_for(future, timeout=timeout)
        except asyncio.TimeoutError:
            return None
        finally:
            # Always clean up the future to prevent memory leaks
            _pending_requests.pop(request_id, None)

    async def tunnel_request(self, event):
        """
        Channel layer handler — forwards request event to the agent via WS.
        """
        await self.send(text_data=json.dumps({
            "type": "request",
            "request_id": event["request_id"],
            "method": event["method"],
            "path": event["path"],
            "headers": event["headers"],
            "body": event["body"],
        }))

    # ─── Helpers ───────────────────────────────────────────────

    def _extract_token(self) -> str | None:
        """Extract raw token from Authorization header in WS scope."""
        headers = dict(self.scope.get("headers", []))
        auth = headers.get(b"authorization", b"").decode("utf-8", errors="ignore")
        if auth.lower().startswith("bearer "):
            return auth[7:].strip()
        return None

    async def _reject(self, reason: str):
        """Close the connection before accepting with a reason message."""
        await self.accept()
        await self.send(text_data=json.dumps({"type": "disconnect", "reason": reason}))
        await self.close()
        logger.warning("Agent rejected: alias=%s reason=%s", self.alias, reason)

    @staticmethod
    async def _get_tunnel_for_token(raw_token: str) -> Tunnel | None:
        """SHA-256 hash the token and look up the tunnel (async-safe)."""
        from asgiref.sync import sync_to_async
        from apps.tunnels.repository import get_tunnel_by_token_hash

        token_hash = Tunnel.hash_token(raw_token)
        return await sync_to_async(get_tunnel_by_token_hash)(token_hash)

    async def _mark_connected(self):
        from asgiref.sync import sync_to_async
        from apps.tunnels import repository
        await sync_to_async(repository.update_tunnel_status)(
            self.tunnel_id,
            Tunnel.STATUS_CONNECTED,
            set_connected_at=True,
        )

    async def _mark_disconnected(self):
        from asgiref.sync import sync_to_async
        from apps.tunnels import repository
        await sync_to_async(repository.update_tunnel_status)(
            self.tunnel_id,
            Tunnel.STATUS_DISCONNECTED,
        )
