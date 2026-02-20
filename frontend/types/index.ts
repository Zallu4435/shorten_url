// All TypeScript interfaces for the URL shortener app

// ─── Auth ─────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenRefreshPayload {
  accessToken: string;
  refreshToken: string;
}

// ─── Short URLs ────────────────────────────────────────────
export interface ShortURL {
  id: string;
  originalUrl: string;
  slug: string;
  shortUrl: string;
  title?: string;
  description?: string;
  isActive: boolean;
  isPrivate: boolean;
  isSingleUse: boolean;
  isFlagged: boolean;
  flagReason?: string;
  maxClicks?: number;
  clickCount: number;
  expiresAt?: string;
  activatesAt?: string;
  redirectRules?: string;
  webhookUrl?: string;
  qrCode?: string;
  isUrlReachable?: boolean;
  urlStatusCode?: number;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface PaginatedURLs {
  urls: ShortURL[];
  total: number;
}

export interface ResolveSlugPayload {
  redirectUrl?: string;
  requiresPassword: boolean;
  isSingleUse: boolean;
}

export interface CreateShortURLInput {
  originalUrl: string;
  slug?: string;
  title?: string;
  description?: string;
  isPrivate?: boolean;
  password?: string;
  isSingleUse?: boolean;
  maxClicks?: number;
  expiresAt?: string;
  activatesAt?: string;
  webhookUrl?: string;
  redirectRules?: string;
}

export interface UpdateShortURLInput {
  id: string;
  title?: string;
  description?: string;
  isActive?: boolean;
  isPrivate?: boolean;
  password?: string;
  isSingleUse?: boolean;
  maxClicks?: number;
  expiresAt?: string;
  activatesAt?: string;
  webhookUrl?: string;
  redirectRules?: string;
}

// ─── Analytics ────────────────────────────────────────────
export interface Click {
  id: string;
  ipAddress?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  isUnique: boolean;
  createdAt: string;
}

export interface DeviceBreakdown {
  deviceType: string;
  count: number;
}

export interface CountryBreakdown {
  country: string;
  countryCode: string;
  count: number;
}

export interface BrowserBreakdown {
  browser: string;
  count: number;
}

export interface OSBreakdown {
  os: string;
  count: number;
}

export interface DateBreakdown {
  date: string;
  count: number;
}

export interface ReferrerBreakdown {
  referrer: string;
  count: number;
}

export interface AnalyticsSummary {
  totalClicks: number;
  uniqueClicks: number;
  clicksByDevice: DeviceBreakdown[];
  clicksByCountry: CountryBreakdown[];
  clicksByBrowser: BrowserBreakdown[];
  clicksByOs: OSBreakdown[];
  clicksByDate: DateBreakdown[];
  clicksByReferrer: ReferrerBreakdown[];
}

export interface PaginatedClicks {
  clicks: Click[];
  total: number;
}

export interface TopURL {
  id: string;
  slug: string;
  shortUrl: string;
  title?: string;
  clickCount: number;
}

export interface UserAnalyticsOverview {
  totalUrls: number;
  totalClicks: number;
  uniqueClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  topUrls: TopURL[];
}

// ─── Admin ────────────────────────────────────────────────
export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalUrls: number;
  activeUrls: number;
  flaggedUrls: number;
  newUrlsToday: number;
  newUrlsThisWeek: number;
  newUrlsThisMonth: number;
  totalClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
}

export interface UserDetail {
  user: AdminUser;
  urlCount: number;
  totalClicks: number;
  recentUrls: ShortURL[];
}

export interface PaginatedAdminURLs {
  urls: ShortURL[];
  total: number;
}

// ─── AI ──────────────────────────────────────────────────
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

// ─── Shared ──────────────────────────────────────────────
export interface MutationResult {
  success: boolean;
  message: string;
}
