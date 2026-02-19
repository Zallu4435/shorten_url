"""
apps.admin_panel — Admin Operations

No models — purely an orchestration layer over apps.users and apps.urls.

Services:
    from apps.admin_panel.services import (
        get_platform_stats,     # System-wide dashboard metrics
        list_all_users,         # Paginated + filterable user list
        get_user_detail,        # Single user with URL/click stats
        activate_user,
        deactivate_user,        # Revokes all refresh tokens immediately
        make_admin,
        remove_admin,
        admin_delete_user,      # Hard delete — irreversible
        list_all_urls,          # Paginated + filterable URL list
        flag_url,               # Mark as unsafe + deactivate
        unflag_url,             # Clear flag + reactivate
        admin_activate_url,
        admin_deactivate_url,
        admin_delete_url,       # Hard delete — irreversible
    )
"""
