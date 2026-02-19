"""
AI Integration GraphQL Queries
Exposes Gemini-powered features as GraphQL queries.
All queries require authentication — AI features are for registered users only.

  - suggestSlugs(url, count)     → creative slug alias suggestions
  - generateUrlMetadata(url)     → auto title + description
  - suggestRedirectRules(url)    → smart dynamic redirect rules
"""

import graphene

from apps.ai_integration import services
from apps.ai_integration.graphql.types import (
    SlugSuggestionType,
    URLMetadataType,
    RedirectRuleSuggestionType,
)
from shared.decorators import login_required
from shared.exceptions import ValidationError


class AIQuery(graphene.ObjectType):

    # ── suggestSlugs ──────────────────────────────────────────
    suggest_slugs = graphene.List(
        graphene.NonNull(SlugSuggestionType),
        url=graphene.String(
            required=True,
            description="The long URL you want to shorten.",
        ),
        count=graphene.Int(
            default_value=5,
            description="How many slug suggestions to return (1–10). Default: 5.",
        ),
        description=(
            "Ask Gemini to suggest creative, memorable slug aliases for a URL. "
            "Requires authentication. Returns an empty list if AI is unavailable."
        ),
    )

    # ── generateUrlMetadata ────────────────────────────────────
    generate_url_metadata = graphene.Field(
        URLMetadataType,
        url=graphene.String(
            required=True,
            description="The long URL to generate metadata for.",
        ),
        description=(
            "Ask Gemini to infer a good title and description for a URL "
            "based on its domain and path structure. "
            "Use this to pre-fill the title/description when creating a short URL."
        ),
    )

    # ── suggestRedirectRules ───────────────────────────────────
    suggest_redirect_rules = graphene.List(
        graphene.NonNull(RedirectRuleSuggestionType),
        url=graphene.String(
            required=True,
            description="The long URL to analyze for redirect rule suggestions.",
        ),
        description=(
            "Ask Gemini to suggest smart dynamic redirect rules for a URL. "
            "For example: redirect mobile users to the mobile version of a site."
        ),
    )

    # ── Resolvers ──────────────────────────────────────────────

    @login_required
    def resolve_suggest_slugs(root, info, url: str, count: int = 5):
        if not url or not url.strip():
            raise ValidationError("URL is required for slug suggestions.")

        url = url.strip()
        count = max(1, min(count, 10))

        suggestions = services.suggest_slugs(url=url, count=count)
        return [
            SlugSuggestionType(slug=s["slug"], reason=s["reason"])
            for s in suggestions
        ]

    @login_required
    def resolve_generate_url_metadata(root, info, url: str):
        if not url or not url.strip():
            raise ValidationError("URL is required for metadata generation.")

        metadata = services.generate_url_metadata(url=url.strip())
        return URLMetadataType(
            title=metadata.get("title", ""),
            description=metadata.get("description", ""),
        )

    @login_required
    def resolve_suggest_redirect_rules(root, info, url: str):
        if not url or not url.strip():
            raise ValidationError("URL is required for redirect rule suggestions.")

        rules = services.suggest_redirect_rules(url=url.strip())
        return [
            RedirectRuleSuggestionType(
                condition=r["condition"],
                target_url=r["target_url"],
                description=r["description"],
            )
            for r in rules
        ]
