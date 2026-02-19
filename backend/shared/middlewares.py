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

    Registered in settings.py under:
        GRAPHENE = {
            "MIDDLEWARE": ["shared.middlewares.JWTAuthMiddleware"]
        }
    """

    def resolve(self, next_middleware, root, info, **kwargs):
        """
        Called for every GraphQL field resolution.
        We only process authentication at the root level (root is None)
        to avoid redundant DB lookups on every field.
        """
        if root is None:
            self._authenticate_request(info)
        return next_middleware(root, info, **kwargs)

    def _authenticate_request(self, info):
        """
        Extract and validate the JWT token from the request headers.
        Attaches `user` to info.context — either a User instance or None.
        """
        request = info.context

        # Ensure user attribute exists (default: None = anonymous)
        if not hasattr(request, "user") or request.user is None:
            request.user = None

        # Extract token from Authorization header
        token = self._extract_token(request)
        if not token:
            return  # Anonymous request — no token present

        # Decode & validate the token
        user = self._get_user_from_token(token)
        request.user = user

    def _extract_token(self, request) -> str | None:
        """
        Reads the Authorization header and extracts the Bearer token.
        Returns the raw token string or None.
        """
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header:
            return None

        parts = auth_header.split()

        if len(parts) != 2:
            logger.debug("Malformed Authorization header: expected 'Bearer <token>'")
            return None

        prefix, token = parts
        if prefix.lower() != "bearer":
            logger.debug(f"Unsupported auth scheme: {prefix}")
            return None

        return token

    def _get_user_from_token(self, token: str):
        """
        Decodes the JWT token and returns the corresponding User.
        Returns None on any failure — errors are logged, not raised.
        Exceptions are only raised in resolvers via decorators.
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except jwt.ExpiredSignatureError:
            logger.debug("JWT access token has expired.")
            return None
        except jwt.InvalidTokenError as e:
            logger.debug(f"Invalid JWT token: {e}")
            return None

        # Validate token type — must be access token
        if payload.get("type") != "access":
            logger.debug("Token type is not 'access'.")
            return None

        user_id = payload.get("user_id")
        if not user_id:
            logger.debug("JWT payload missing 'user_id'.")
            return None

        # Fetch user from DB
        return self._fetch_user(user_id)

    def _fetch_user(self, user_id: str):
        """
        Fetches the user from the database by ID.
        Returns the user if active, None otherwise.
        """
        try:
            # Import here to avoid circular imports at module load time
            from apps.users.models import CustomUser

            user = CustomUser.objects.get(id=user_id, is_active=True)
            return user
        except CustomUser.DoesNotExist:
            logger.debug(f"User with id={user_id} not found or inactive.")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching user from JWT: {e}")
            return None
