"""
User GraphQL Queries
  - me : Returns the currently authenticated user's profile
"""

import graphene

from apps.users.graphql.types import UserType
from shared.decorators import login_required


class UserQuery(graphene.ObjectType):

    me = graphene.Field(
        UserType,
        description="Returns the currently authenticated user's profile. Requires a valid access token."
    )

    @login_required
    def resolve_me(root, info, **kwargs):
        """
        Returns the currently logged-in user.
        The user is injected into info.context by JWTAuthMiddleware.
        """
        return info.context.user
