// Short URL / Link-related types

import type { User } from "./auth";

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
    qrEnabled?: boolean;
    qrCodeUrl?: string;
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
