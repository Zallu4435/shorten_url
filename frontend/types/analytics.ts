// Analytics-related types

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
    clicksByDate: DateBreakdown[];
}
