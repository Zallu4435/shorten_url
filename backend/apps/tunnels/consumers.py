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

# Protocol version for agent compatibility
AGENT_PROTOCOL_VERSION = "1.1.0"

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
        self.user_id: str | None = None
        self.pending_request_ids: set[str] = set()

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

        # Handle session eviction: if already connected, evict old session
        existing_channel = registry.get_channel(self.alias)
        if existing_channel:
            logger.info("Evicting existing session for alias=%s", self.alias)
            await self.channel_layer.send(existing_channel, {
                "type": "tunnel.evict",
                "reason": "New session established for this alias."
            })

        self.tunnel_id = str(tunnel.id)
        self.user_id = str(tunnel.user_id)

        # Register and accept
        registry.register(self.alias, self.channel_name)
        await self._mark_connected()
        
        # Broadcast connection status (USER-SPECIFIC GROUP)
        await self.channel_layer.group_send(
            f"tunnel_status_{self.user_id}",
            {
                "type": "status.update",
                "alias": self.alias,
                "tunnel_id": self.tunnel_id,
                "status": "connected",
            }
        )
        
        await self.accept()

        # Check version (optional but recommended)
        headers_dict = dict(self.scope.get("headers", []))
        version_bytes = headers_dict.get(b"x-agent-version", b"1.0.0")
        agent_version = version_bytes.decode("utf-8")
        
        if agent_version < AGENT_PROTOCOL_VERSION:
            logger.info("Agent connected with older version: alias=%s version=%s", self.alias, agent_version)

        logger.info("Agent connected: alias=%s channel=%s", self.alias, self.channel_name)

    async def disconnect(self, close_code):
        """Called when the agent disconnects (intentional or dropped)."""
        if self.alias:
            registry.unregister(self.alias)
            await self._mark_disconnected()
            
            # Broadcast disconnection (USER-SPECIFIC GROUP)
            if self.user_id:
                await self.channel_layer.group_send(
                    f"tunnel_status_{self.user_id}",
                    {
                        "type": "status.update",
                        "alias": self.alias,
                        "tunnel_id": self.tunnel_id,
                        "status": "disconnected",
                    }
                )
            
            # Cancel all pending requests for this agent immediately
            for rid in list(self.pending_request_ids):
                future = _pending_requests.pop(rid, None)
                if future and not future.done():
                    future.set_result({
                        "status": 503,
                        "headers": {"Content-Type": "text/plain"},
                        "body": base64.b64encode(b"Agent disconnected during request.").decode(),
                        "latency_ms": 0,
                    })
            self.pending_request_ids.clear()

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
            self.pending_request_ids.discard(request_id)
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
        request_id = event["request_id"]
        self.pending_request_ids.add(request_id)

        await self.send(text_data=json.dumps({
            "type": "request",
            "request_id": request_id,
            "method": event["method"],
            "path": event["path"],
            "headers": event["headers"],
            "body": event["body"],
        }))

    async def tunnel_evict(self, event):
        """
        Channel layer handler — disconnects the agent because a newer session arrived.
        """
        await self.send(text_data=json.dumps({
            "type": "disconnect",
            "reason": event["reason"],
        }))
        await self.close()

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


class TunnelStatusConsumer(AsyncWebsocketConsumer):
    """
    Consumer for the frontend to listen for real-time tunnel status updates.
    """

    async def connect(self):
        """
        Connect handler for the frontend.
        Manually extracts JWT from cookies since standard AuthMiddleware 
        often fails to pick up sessions in bare ASGI deployments.
        """
        user = await self._authenticate_user()
        if not user:
            logger.warning("TunnelStatusConsumer: Anonymous connection rejected.")
            await self.close()
            return

        self.user_id = str(user.id)
        await self.channel_layer.group_add(f"tunnel_status_{self.user_id}", self.channel_name)
        await self.accept()

    async def _authenticate_user(self):
        """Extract and validate JWT from cookies."""
        from http.cookies import SimpleCookie
        import jwt
        from django.conf import settings
        from asgiref.sync import sync_to_async
        from apps.users.models import CustomUser

        # 1. Extract cookie header
        headers = dict(self.scope.get("headers", []))
        cookie_raw = headers.get(b"cookie", b"").decode("utf-8")
        
        cookie = SimpleCookie()
        cookie.load(cookie_raw)
        
        token = None
        if "access_token" in cookie:
            token = cookie["access_token"].value
            
        # 1b. Fallback to query string (ticket-based auth for cross-origin WS)
        if not token:
            from urllib.parse import parse_qs
            query_string = self.scope.get("query_string", b"").decode("utf-8")
            params = parse_qs(query_string)
            token = params.get("token", [None])[0]

        if not token:
            logger.warning("TunnelStatusConsumer: Missing authentication tokens (no cookie, no query param).")
            return None

        # 2. Validate JWT
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                leeway=10,
            )
        except jwt.ExpiredSignatureError:
            logger.warning("TunnelStatusConsumer: Token expired.")
            return None
        except jwt.InvalidTokenError:
            logger.warning("TunnelStatusConsumer: Invalid token signature/format.")
            return None

        if payload.get("type") not in ("access", "ws_auth"):
            logger.warning("TunnelStatusConsumer: Invalid token type: %s", payload.get("type"))
            return None

        user_id = payload.get("user_id")
        if not user_id:
            logger.warning("TunnelStatusConsumer: Token payload missing user_id.")
            return None

        # 3. Fetch user
        try:
            user = await sync_to_async(CustomUser.objects.get)(id=user_id, is_active=True)
            return user
        except (CustomUser.DoesNotExist, Exception) as e:
            logger.warning("TunnelStatusConsumer: User lookup failed for ID %s: %s", user_id, str(e))
            return None

    async def disconnect(self, close_code):
        if hasattr(self, 'user_id'):
            await self.channel_layer.group_discard(f"tunnel_status_{self.user_id}", self.channel_name)
    async def status_update(self, event):
        """
        Handler for messages from the 'tunnel_status_updates' group.
        Relays the update to the frontend.
        """
        await self.send(text_data=json.dumps({
            "type": "status_update",
            "alias": event["alias"],
            "tunnel_id": event["tunnel_id"],
            "status": event["status"],
        }))


class SilentHMRConsumer(AsyncWebsocketConsumer):
    """
    Dummy consumer to silently accept and ignore Next.js HMR (Hot Module Replacement)
    requests that hit the backend during development. This prevents noisy tracebacks
    for path '_next/webpack-hmr'.
    """

    async def connect(self):
        # We accept and immediately close or just sit there.
        # Closing it gracefully stops the client from seeing a "Hard Crash" 500 error.
        await self.accept()
        # We don't log anything here to keep the logs clean.

    async def receive(self, text_data=None, bytes_data=None):
        pass

    async def disconnect(self, close_code):
        pass
