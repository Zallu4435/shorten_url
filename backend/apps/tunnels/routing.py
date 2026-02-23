"""
WebSocket URL routing for the tunnels app.
Registered in config/asgi.py.
"""

from django.urls import re_path
from .consumers import AgentConsumer

websocket_urlpatterns = [
    # e.g. wss://yourdomain.com/ws/tunnel/my-app/
    re_path(r"^ws/tunnel/(?P<alias>[a-z0-9-]{3,30})/$", AgentConsumer.as_asgi()),
]
