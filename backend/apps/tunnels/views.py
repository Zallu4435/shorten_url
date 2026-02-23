"""
Tunnel HTTP Proxy View

When a remote visitor hits /t/<alias>/<path>, this view:
  1. Checks if an agent is connected for that alias
  2. Forwards the HTTP request as a JSON payload over the WebSocket
  3. Waits for the agent's response (30s timeout)
  4. Returns the response to the visitor

Offline / not-found aliases return styled error pages.
"""

import json
import base64
import asyncio
import logging
from asgiref.sync import async_to_sync
from django.http import HttpResponse
from django.views import View

from apps.tunnels import registry, repository
from apps.tunnels.consumers import AgentConsumer

logger = logging.getLogger(__name__)

MAX_RESPONSE_BODY_BYTES = 50 * 1024 * 1024  # 50MB


class TunnelProxyView(View):
    """
    HTTP proxy: forwards incoming requests to the connected agent for the given alias.
    """

    def dispatch(self, request, alias: str, subpath: str = ""):
        # Build the path to forward (include query string)
        path = "/" + subpath
        if request.META.get("QUERY_STRING"):
            path += "?" + request.META["QUERY_STRING"]

        # Check alias in registry (is agent connected?)
        channel_name = registry.get_channel(alias)
        if not channel_name:
            # Check if alias even exists (for a better error message)
            tunnel = repository.get_tunnel_by_alias(alias)
            if not tunnel:
                return self._not_found_response(alias)
            return self._offline_response(alias)

        # Serialize request
        headers = {
            key: val
            for key, val in request.META.items()
            if key.startswith("HTTP_") or key in ("CONTENT_TYPE", "CONTENT_LENGTH")
        }
        
        # Add standard proxy headers
        headers["HTTP_X_FORWARDED_HOST"] = request.get_host()
        headers["HTTP_X_FORWARDED_PROTO"] = "https" if request.is_secure() else "http"
        headers["HTTP_X_FORWARDED_PREFIX"] = f"/t/{alias}/"

        try:
            # Send body as base64 to handle binary data
            body_b64 = base64.b64encode(request.body).decode("utf-8")
        except Exception:
            body_b64 = ""

        # Forward to agent over WS and wait for response
        try:
            response_data = async_to_sync(AgentConsumer.forward_request)(
                channel_name=channel_name,
                method=request.method,
                path=path,
                headers=headers,
                body=body_b64,
                timeout=30,
            )
        except Exception as e:
            logger.error("TunnelProxyView error alias=%s: %s", alias, e)
            return self._error_response(alias)

        if response_data is None:
            # Timeout
            return self._timeout_response(alias)

        # Build and return the proxied HTTP response
        response = self._build_response(response_data, alias)
        
        # Set a cookie to persist the tunnel alias for this session
        # Fix: path="/" ensures it's sent for root-level requests like /dashboard
        response.set_cookie(
            "tunnel_alias",
            alias,
            max_age=3600,  # 1 hour
            httponly=True,
            samesite="Lax",
            path="/",
        )
        return response

    def _build_response(self, data: dict, alias: str) -> HttpResponse:
        status = data.get("status", 200)
        body_b64 = data.get("body", "")
        headers = data.get("headers", {})

        try:
            body_bytes = base64.b64decode(body_b64)
        except Exception:
            body_bytes = b""

        # Safety: enforce response size limit
        if len(body_bytes) > MAX_RESPONSE_BODY_BYTES:
            return HttpResponse("Response too large (> 50MB).", status=413)

        response = HttpResponse(body_bytes, status=status)
        # Forward headers from agent (skip hop-by-hop headers)
        skip = {"transfer-encoding", "connection", "keep-alive"}
        
        # Define prefix for rewriting redirects
        prefix = f"/t/{alias}/"

        for key, val in headers.items():
            lkey = key.lower()
            if lkey not in skip:
                # Rewrite redirects to stay within the tunnel 
                if lkey == "location":
                    # Case 1: Absolute path (e.g. /dashboard)
                    if val.startswith("/") and not val.startswith(prefix):
                        val = prefix + val.lstrip("/")
                    
                    # Case 2: Fully qualified URL (e.g. http://localhost:3000/...)
                    # We rewrite these only if they point to the known local target
                    elif "localhost:3000" in val or "127.0.0.1:3000" in val:
                        # Extract the path after the origin
                        import re
                        path_match = re.search(r'https?://[^/]+(/?.*)', val)
                        if path_match:
                            val = f"{prefix.rstrip('/')}{path_match.group(1)}"

                # Rewrite Set-Cookie paths so they apply to the tunnel subpath
                elif lkey == "set-cookie":
                    if "Path=/" in val:
                        # Replace Path=/ with Path=/t/<alias>/
                        val = val.replace("Path=/", f"Path={prefix}")

                response[key] = val
        return response

    @staticmethod
    def _get_styled_html(title: str, label: str, heading: str, description: str, color: str = "primary") -> str:
        """
        Returns a modern, styled HTML page matching the frontend's design pattern.
        """
        # Define colors based on design tokens
        colors = {
            "primary": "oklch(0.62 0.22 277)",
            "red": "oklch(0.63 0.22 22)",
            "amber": "oklch(0.7 0.15 80)",
        }
        accent_color = colors.get(color, colors["primary"])
        
        # Simple SVG icons based on type
        icon_svg = ""
        if color == "red": # Link2Off style
            icon_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M10 5a5 5 0 0 1 9.5 3"/><path d="M15 7h5"/><path d="M9 17H4a5 5 0 0 1 0-10"/><path d="M14 19a5 5 0 0 0 9.5-3"/></svg>'
        elif color == "amber": # Power/Offline style
            icon_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg>'
        else: # Default Activity style
            icon_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — Shorten URL</title>
    <style>
        :root {{
            --background: oklch(0.095 0 0);
            --foreground: oklch(0.97 0 0);
            --primary: {accent_color};
            --card: oklch(0.13 0 0);
            --border: oklch(1 0 0 / 9%);
            --muted-foreground: oklch(0.60 0 0);
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            background-color: var(--background);
            color: var(--foreground);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
        }}
        .ambient-glow {{
            position: absolute;
            height: 500px;
            width: 500px;
            background: var(--primary);
            opacity: 0.05;
            border-radius: 50%;
            filter: blur(140px);
            z-index: -1;
            animation: pulse 8s ease-in-out infinite;
        }}
        @keyframes pulse {{
            0%, 100% {{ transform: scale(1); opacity: 0.05; }}
            50% {{ transform: scale(1.1); opacity: 0.08; }}
        }}
        .container {{
            width: 100%;
            max-width: 440px;
            padding: 24px;
            text-align: center;
            animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }}
        @keyframes slideUp {{
            from {{ transform: translateY(20px); opacity: 0; }}
            to {{ transform: translateY(0); opacity: 1; }}
        }}
        .card {{
            background: rgba(33, 33, 33, 0.4);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border);
            border-radius: 44px;
            padding: 40px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }}
        .technical-indicator {{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 6px 14px;
            background: oklch(from var(--primary) l c h / 0.1);
            color: var(--primary);
            border-radius: 8px;
            margin-bottom: 32px;
        }}
        .technical-indicator span {{
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.2em;
        }}
        .heading {{
            font-size: 30px;
            font-weight: 900;
            letter-spacing: -0.04em;
            margin-bottom: 12px;
            line-height: 1.1;
        }}
        .description {{
            font-size: 14px;
            color: var(--muted-foreground);
            font-weight: 600;
            line-height: 1.6;
            margin-bottom: 32px;
            max-width: 280px;
            margin-left: auto;
            margin-right: auto;
        }}
        .button {{
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            height: 64px;
            background: var(--primary);
            color: #000;
            text-decoration: none;
            border-radius: 24px;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.3em;
            transition: all 0.2s ease;
            box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.3);
        }}
        .button:hover {{
            filter: brightness(1.1);
            transform: translateY(-2px);
        }}
        .button:active {{
            transform: scale(0.98);
        }}
        .footer {{
            margin-top: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            opacity: 0.4;
        }}
        .footer-line {{
            height: 1px;
            width: 24px;
            background: var(--border);
        }}
        .footer-text {{
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.4em;
            color: var(--muted-foreground);
        }}
        .footer-text span {{ color: var(--foreground); }}
    </style>
</head>
<body>
    <div class="ambient-glow"></div>
    <div class="container">
        <div class="card">
            <div class="technical-indicator">
                {icon_svg}
                <span>{label}</span>
            </div>
            <h1 class="heading">{heading}</h1>
            <p class="description">{description}</p>
            <a href="/" class="button">Return to Control Center</a>
        </div>
        <div class="footer">
            <div class="footer-line"></div>
            <div class="footer-text">Powered by <span>Shorten URL</span></div>
            <div class="footer-line"></div>
        </div>
    </div>
</body>
</html>"""

    @staticmethod
    def _offline_response(alias: str) -> HttpResponse:
        html = TunnelProxyView._get_styled_html(
            title="Tunnel Offline",
            label="Connection Protocol",
            heading="Tunnel Offline",
            description=f"The tunnel <strong>{alias}</strong> exists but the agent is not connected to the matrix.",
            color="amber"
        )
        return HttpResponse(html, status=503, content_type="text/html")

    @staticmethod
    def _not_found_response(alias: str) -> HttpResponse:
        html = TunnelProxyView._get_styled_html(
            title="Tunnel Not Found",
            label="404 Protocol",
            heading="Node Not Found",
            description=f"The requested alias <strong>{alias}</strong> has been de-indexed from the core network.",
            color="red"
        )
        return HttpResponse(html, status=404, content_type="text/html")

    @staticmethod
    def _timeout_response(alias: str) -> HttpResponse:
        html = TunnelProxyView._get_styled_html(
            title="Request Timeout",
            label="Temporal Breach",
            heading="Gate Timeout",
            description=f"The tunnel <strong>{alias}</strong> failed to respond within the 30s temporal window.",
            color="amber"
        )
        return HttpResponse(html, status=504, content_type="text/html")

    @staticmethod
    def _error_response(alias: str) -> HttpResponse:
        html = TunnelProxyView._get_styled_html(
            title="Tunnel Error",
            label="System Conflict",
            heading="Proxy Collapse",
            description=f"A critical error occurred while attempting to bridge the request for <strong>{alias}</strong>.",
            color="red"
        )
        return HttpResponse(html, status=502, content_type="text/html")
