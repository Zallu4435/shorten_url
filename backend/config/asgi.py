"""
ASGI Configuration — URL Shortener
Supports both:
  - HTTP: standard Django views (including GraphQL)
  - WebSocket: Django Channels consumers (tunnel feature)

Routing:
  ws/tunnel/<alias>/  → AgentConsumer (WebSocket)
  *                   → Django ASGI app (HTTP)
"""

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# Import WS routing AFTER django.setup() to avoid AppRegistryNotReady
from apps.tunnels.routing import websocket_urlpatterns  # noqa: E402

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    # HTTP requests → standard Django views
    "http": django_asgi_app,

    # WebSocket connections → Channels consumers
    "websocket": URLRouter(websocket_urlpatterns),
})
