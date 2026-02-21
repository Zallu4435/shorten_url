"""
apps.links — URL Shortening Core

Models:
    from apps.links.models import ShortURL

Repository (data access):
    from apps.links.repository import (
        create_short_url,
        get_by_slug,
        get_by_id,
        get_by_user,
        update_short_url,
        delete_short_url,
        increment_click_count,
        mark_used,
        flag_url,
        unflag_url,
    )

Services (business logic — validation pipeline + redirect):
    from apps.links.services import (
        create_short_url,       # Full 6-layer validation + DB write
        resolve_slug,           # 12-step redirect resolution
        update_short_url,       # Ownership-checked update
        delete_short_url,       # Ownership-checked delete
        fire_webhook,           # Async webhook POST
    )

Utilities:
    from apps.links.utils import (
        generate_unique_slug,   # Collision-safe random slug
        generate_qr_code,       # Background QR image generation
    )

Views (plain Django — NOT GraphQL):
    from apps.links.views import ShortURLRedirectView, VerifyURLPasswordView
"""
