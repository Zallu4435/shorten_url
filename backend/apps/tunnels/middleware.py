import re
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class TunnelAssetMiddleware:
    """
    Magic routing for tunnel assets and subdomain-based isolation.
    
    1. Subdomain Routing: If host is <alias>.localhost, all requests are 
       internally rewritten to /t/<alias>/<path>.
    2. Referer Fallback: Useful for assets fetched from the root domain
       when the page was loaded via /t/<alias>/ prefix.
    """
    
    # Root backend paths that should NEVER be rewritten into a tunnel
    EXCLUDED_PREFIXES = (
        '/admin/',
        '/graphql/',
        '/qr/',
        '/verify/',
        '/static/',
        '/media/',
        '/t/',  # Already handled but good for safety
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0]  # strip port
        path = request.path
        
        # 1. Skip if it's a root backend path
        if any(path.startswith(ex) for ex in self.EXCLUDED_PREFIXES):
            return self.get_response(request)

        alias = None

        # 2. Try Extracting Alias from Subdomain (e.g., my-app.localhost)
        if host.endswith('.localhost') or host.endswith('.127.0.0.1'):
            parts = host.split('.')
            if len(parts) >= 2:
                alias = parts[0]
                
        # 3. Try Extracting Alias from Cookie (Session persistence)
        if not alias:
            alias = request.COOKIES.get("tunnel_alias")

        # 4. Fallback: Extract alias from Referer
        # We only do this if it looks like an asset request OR if we have no other choice
        if not alias:
            referer = request.META.get('HTTP_REFERER', '')
            match = re.search(r'/t/([a-z0-9-]{3,30})/', referer)
            if match:
                # Safety: Only use referer fallback for assets or if explicitly navigated
                # This prevents weird loops for random background requests
                alias = match.group(1)

        # 5. Apply Internal Rewrite
        if alias:
            prefix = f"/t/{alias}"
            # Only rewrite if not already prefixed
            if not path.startswith(prefix + "/"):
                request.path_info = f"{prefix}{path}"
                # logger.debug("TunnelAssetMiddleware: routed %s (%s) -> %s", host, path, request.path_info)

        return self.get_response(request)
