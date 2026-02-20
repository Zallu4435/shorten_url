// AI-related types

export interface SlugSuggestion {
    slug: string;
    reason: string;
}

export interface URLMetadata {
    title: string;
    description: string;
}

export interface RedirectRuleSuggestion {
    condition: string;
    targetUrl: string;
    description: string;
}
