"""
apps.admin_panel.graphql — Admin Panel GraphQL layer

Types:
    from apps.admin_panel.graphql.types import (
        PaginatedUsersType,
        PaginatedAdminURLsType,
        PlatformStatsType,
        UserDetailType,
    )

Queries:
    from apps.admin_panel.graphql.queries import AdminQuery

Mutations:
    from apps.admin_panel.graphql.mutations import (
        AdminMutation,
        # User management
        ActivateUser, DeactivateUser, MakeAdmin, RemoveAdmin, AdminDeleteUser,
        # URL management
        FlagUrl, UnflagUrl, AdminActivateUrl, AdminDeactivateUrl, AdminDeleteUrl,
    )
"""
