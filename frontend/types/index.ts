// Barrel re-export — import from @/types as usual, or from specific domain files:
//   @/types/auth       → User, AuthPayload, TokenRefreshPayload
//   @/types/links      → ShortURL, PaginatedURLs, CreateShortURLInput, ...
//   @/types/analytics  → Click, AnalyticsSummary, DeviceBreakdown, ...
//   @/types/admin      → PlatformStats, AdminUser, PaginatedUsers, ...
//   @/types/ai         → SlugSuggestion, URLMetadata, RedirectRuleSuggestion
//   @/types/shared     → MutationResult

export * from "./auth";
export * from "./links";
export * from "./analytics";
export * from "./admin";
export * from "./ai";
export * from "./shared";

