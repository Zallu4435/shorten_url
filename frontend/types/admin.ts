// Admin-related types

import type { ShortURL } from "./links";

export interface PlatformStats {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    totalUrls: number;
    activeUrls: number;
    flaggedUrls: number;
    newUrlsToday: number;
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
