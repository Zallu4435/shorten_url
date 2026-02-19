"""
apps.users — Authentication & User Management

Models:
    from apps.users.models import CustomUser, RefreshToken

Repository (data access — raw DB ops, no business logic):
    from apps.users.repository import (
        create_user,
        get_by_email,
        get_by_id,
        get_by_username,
        update_user,
        deactivate_user,
        list_all_users,
        create_refresh_token,
        get_refresh_token_by_hash,
        revoke_refresh_token,
        revoke_all_user_tokens,
    )

Services (business logic):
    from apps.users.services import (
        register_user,
        login_user,
        generate_tokens,
        refresh_access_token,
        logout_user,
        validate_registration_input,
        validate_login_input,
    )
"""
