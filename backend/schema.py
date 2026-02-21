"""
Root GraphQL Schema
Merges all app-level queries and mutations into one unified schema.
This file grows as new apps are added.

Current:
  ✅ Users     — register, login, refresh, logout, me
  ✅ URLs      — createShortUrl, updateShortUrl, deleteShortUrl, myUrls, getUrl, resolveSlug
  ✅ Analytics — getAnalytics, clickHistory, myAnalytics
  ✅ Admin     — platformStats, allUsers, userDetail, allUrls + 10 admin mutations
  ✅ AI        — suggestSlugs, generateUrlMetadata, suggestRedirectRules (Gemini)
"""

import graphene

from apps.users.graphql.queries import UserQuery
from apps.users.graphql.mutations import UserMutation
from apps.links.graphql.queries import URLQuery
from apps.links.graphql.mutations import URLMutation
from apps.analytics.graphql.queries import AnalyticsQuery
from apps.admin_panel.graphql.queries import AdminQuery
from apps.admin_panel.graphql.mutations import AdminMutation
from apps.ai_integration.graphql.queries import AIQuery


class Query(
    UserQuery,
    URLQuery,
    AnalyticsQuery,
    AdminQuery,
    AIQuery,
    graphene.ObjectType,
):
    pass


class Mutation(
    UserMutation,
    URLMutation,
    AdminMutation,
    graphene.ObjectType,
):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
