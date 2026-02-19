"""
AI Integration GraphQL Types
"""

import graphene


class SlugSuggestionType(graphene.ObjectType):
    """A single AI-generated slug suggestion with reasoning."""
    slug = graphene.String(
        required=True,
        description="The suggested URL-safe slug alias.",
    )
    reason = graphene.String(
        required=True,
        description="Why Gemini thinks this slug fits the URL.",
    )


class URLMetadataType(graphene.ObjectType):
    """AI-generated title and description for a URL."""
    title = graphene.String(
        required=True,
        description="Suggested title for the short link (max 60 chars).",
    )
    description = graphene.String(
        required=True,
        description="Suggested description for the short link (max 160 chars).",
    )


class RedirectRuleSuggestionType(graphene.ObjectType):
    """AI-suggested dynamic redirect rule."""
    condition = graphene.String(
        required=True,
        description=(
            "The rule condition. Supported: "
            "'device=mobile', 'device=tablet', 'device=desktop', "
            "'hour>=N', 'hour<=N'"
        ),
    )
    target_url = graphene.String(
        required=True,
        description="The URL to redirect to when this condition matches.",
    )
    description = graphene.String(
        required=True,
        description="Plain English explanation of this rule.",
    )
