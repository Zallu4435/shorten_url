"""
WebSocket URL routing for the tunnels app.
Registered in config/asgi.py.
"""

from django.urls import re_path
from .consumers import AgentConsumer, TunnelStatusConsumer, SilentHMRConsumer

websocket_urlpatterns = [
    # Silence Next.js HMR noise (Dev mode)
    re_path(r"^_next/webpack-hmr/?$", SilentHMRConsumer.as_asgi()),
    
    # e.g. wss://yourdomain.com/ws/tunnel/my-app/
    re_path(r"^ws/tunnel/(?P<alias>[a-z0-9-]{3,30})/$", AgentConsumer.as_asgi()),
    # Real-time status updates for the UI
    re_path(r"^ws/tunnel-status/$", TunnelStatusConsumer.as_asgi()),
]
