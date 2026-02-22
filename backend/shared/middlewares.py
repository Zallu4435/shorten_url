"""
JWT Authentication Middleware
Plugs into Graphene-Django's middleware chain.

On every GraphQL request:
  1. Reads the Authorization header → "Bearer <token>"
  2. Decodes the JWT access token
  3. Fetches the User from the database
  4. Attaches user to info.context.user

If the token is missing or invalid, info.context.user is set to None.
Individual resolvers use @login_required / @admin_required decorators
to enforce authentication where needed.
"""

import logging
import jwt
from django.conf import settings

logger = logging.getLogger(__name__)


class JWTAuthMiddleware:
    """
    Graphene-Django middleware for JWT authentication.
    Handles extraction and user injection into GraphQL context.
    """

    def resolve(self, next_middleware, root, info, **kwargs):
        """
        Called for every GraphQL field resolution.
        """
        if root is None:
            self._authenticate_request(info)
        
        return next_middleware(root, info, **kwargs)

    def _authenticate_request(self, info):
        """
        Extract and validate the JWT token from cookies or Authorization header.
        Attaches `user` to info.context — either a User instance or None.
        """
        request = info.context

        if not hasattr(request, "user") or request.user is None:
            request.user = None

        token = self._extract_token(request)
        if not token:
            return

        user = self._get_user_from_token(token)
        request.user = user

    def _extract_token(self, request) -> str | None:
        """
        Extracts the token from cookies (access_token) or Authorization header.
        """
        # 1. Try Cookies (recommended for frontend)
        token = request.COOKIES.get("access_token")
        if token:
            return token

        # 2. Fallback to Authorization header
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                return parts[1]

        return None

    def _get_user_from_token(self, token: str):
        """
        Decodes the JWT token and returns the corresponding User.
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                leeway=10,
            )
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None

        if payload.get("type") != "access":
            return None

        user_id = payload.get("user_id")
        if not user_id:
            return None

        return self._fetch_user(user_id)

    def _fetch_user(self, user_id: str):
        """Fetches active user from DB."""
        try:
            from apps.users.models import CustomUser
            return CustomUser.objects.get(id=user_id, is_active=True)
        except (CustomUser.DoesNotExist, Exception):
            return None


class JWTCookieMiddleware:
    """
    Standard Django middleware to handle setting/clearing JWT cookies.
    Reads flags set on the request object during mutation execution.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return self.process_response(request, response)

    def process_response(self, request, response):
        """
        Apply cookie changes if flags are present on the request.
        """
        # Set Access Token Cookie
        if hasattr(request, "_set_access_token"):
            response.set_cookie(
                key="access_token",
                value=request._set_access_token,
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                max_age=settings.JWT_ACCESS_TOKEN_EXPIRY_MINUTES * 60,
            )
            # Set a light indicator for the frontend (JS-accessible)
            response.set_cookie(
                key="is_logged_in",
                value="true",
                httponly=False,
                secure=not settings.DEBUG,
                samesite="Lax",
                max_age=settings.JWT_REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
            )

        # Set Refresh Token Cookie
        if hasattr(request, "_set_refresh_token"):
            response.set_cookie(
                key="refresh_token",
                value=request._set_refresh_token,
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                max_age=settings.JWT_REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
            )

        # Clear Auth Cookies (Logout)
        if getattr(request, "_clear_auth_cookies", False):
            response.delete_cookie("access_token")
            response.delete_cookie("refresh_token")
            response.delete_cookie("is_logged_in")

        return response
