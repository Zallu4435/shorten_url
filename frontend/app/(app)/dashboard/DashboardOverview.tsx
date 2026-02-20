"use client";

import { useQuery } from "@apollo/client";
import {
    BarChart3,
    Link2,
    MousePointerClick,
    TrendingUp,
    ArrowRight,
    Plus,
} from "lucide-react";
import Link from "next/link";

import { MY_ANALYTICS_QUERY, MY_URLS_QUERY } from "@/lib/graphql/queries";
import { StatCard } from "@/components/analytics/StatCard";
import { ClicksChart } from "@/components/analytics/ClicksChart";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, timeAgo, truncateUrl } from "@/lib/utils";
import type { UserAnalyticsOverview, ShortURL } from "@/types";

export function DashboardOverview() {
    const { data: analyticsData, loading: analyticsLoading } = useQuery<{
        myAnalytics: UserAnalyticsOverview;
    }>(MY_ANALYTICS_QUERY);

    const { data: urlsData, loading: urlsLoading } = useQuery<{
        myUrls: { urls: ShortURL[]; total: number };
    }>(MY_URLS_QUERY, { variables: { page: 1, limit: 5 } });

    const analytics = analyticsData?.myAnalytics;
    const recentUrls = urlsData?.myUrls?.urls ?? [];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Your link performance at a glance
                    </p>
                </div>
                <Button asChild size="sm">
                    <Link href="/links/new">
                        <Plus className="mr-1.5 h-4 w-4" />
                        New link
                    </Link>
                </Button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="Total links"
                    value={analytics?.totalUrls ?? 0}
                    icon={Link2}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Total clicks"
                    value={analytics?.totalClicks ?? 0}
                    icon={MousePointerClick}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Unique clicks"
                    value={analytics?.uniqueClicks ?? 0}
                    icon={BarChart3}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Clicks this month"
                    value={analytics?.clicksThisMonth ?? 0}
                    icon={TrendingUp}
                    loading={analyticsLoading}
                />
            </div>

            {/* Charts + Recent links */}
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Clicks chart — take up 2/3 */}
                <div className="lg:col-span-2">
                    {analyticsLoading ? (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Clicks over time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[220px] w-full rounded-lg" />
                            </CardContent>
                        </Card>
                    ) : (
                        <ClicksChart
                            data={
                                analytics?.topUrls?.length
                                    ? // Derive last-30-days dummy from available data if no date breakdown here
                                    []
                                    : []
                            }
                            title="Recent clicks (30 days)"
                        />
                    )}
                </div>

                {/* Top links */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                            Top links
                        </CardTitle>
                        <Link
                            href="/links"
                            className="text-xs text-primary hover:underline flex items-center gap-0.5"
                        >
                            All links <ArrowRight className="h-3 w-3" />
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {analyticsLoading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-4 flex-1" />
                                    <Skeleton className="h-4 w-12" />
                                </div>
                            ))
                            : (analytics?.topUrls ?? []).slice(0, 5).map((url) => (
                                <div
                                    key={url.id}
                                    className="flex items-center justify-between gap-3 group"
                                >
                                    <div className="min-w-0">
                                        <Link
                                            href={`/links/${url.id}`}
                                            className="text-sm font-medium truncate block hover:text-primary transition-colors"
                                        >
                                            /{url.slug}
                                        </Link>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {url.title ?? "No title"}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="shrink-0 tabular-nums">
                                        {formatNumber(url.clickCount)}
                                    </Badge>
                                </div>
                            ))}
                        {!analyticsLoading && !analytics?.topUrls?.length && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No links yet.{" "}
                                <Link href="/links/new" className="text-primary hover:underline">
                                    Create one
                                </Link>
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent links table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Recent links
                    </CardTitle>
                    <Link
                        href="/links"
                        className="text-xs text-primary hover:underline flex items-center gap-0.5"
                    >
                        View all <ArrowRight className="h-3 w-3" />
                    </Link>
                </CardHeader>
                <CardContent>
                    {urlsLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : recentUrls.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm text-muted-foreground">
                                No links yet.{" "}
                                <Link href="/links/new" className="text-primary hover:underline">
                                    Shorten your first URL
                                </Link>
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {recentUrls.map((url) => (
                                <div
                                    key={url.id}
                                    className="flex items-center gap-4 py-3 group"
                                >
                                    {/* Status dot */}
                                    <div
                                        className={`h-2 w-2 rounded-full shrink-0 ${url.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                                            }`}
                                    />

                                    {/* Slug + URL */}
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={`/links/${url.id}`}
                                            className="text-sm font-medium hover:text-primary transition-colors"
                                        >
                                            /{url.slug}
                                        </Link>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {truncateUrl(url.originalUrl, 60)}
                                        </p>
                                    </div>

                                    {/* Clicks */}
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-semibold tabular-nums">
                                            {formatNumber(url.clickCount)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">clicks</p>
                                    </div>

                                    {/* Time */}
                                    <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                                        {timeAgo(url.createdAt)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
