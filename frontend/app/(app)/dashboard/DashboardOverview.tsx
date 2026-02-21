"use client";

import { useQuery } from "@apollo/client";
import {
    BarChart,
    Link as LinkIcon,
    MousePointer2,
    TrendingUp,
    ArrowRight,
    Plus,
    Activity,
    History,
    Zap,
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
import { PageHeader } from "@/components/shared/PageHeader";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import { EmptyTerminal } from "@/components/shared/EmptyTerminal";
import { PageLoading } from "@/components/shared/PageLoading";
import { formatNumber, timeAgo, truncateUrl, cn } from "@/lib/utils";
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
    const hasUrls = recentUrls.length > 0;

    // Bold initial load to prevent "flashy" fragmented skeletons
    if (analyticsLoading && urlsLoading && !analyticsData && !urlsData) {
        return <PageLoading message="SYNCHRONIZING CORE METRICS..." className="min-h-[600px]" />;
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 py-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Page Header */}
            <PageHeader
                title="Dashboard"
                description="Manage your network and track performance in real-time."
                icon={BarChart}
                stats={{
                    label: "Active Links",
                    value: urlsData?.myUrls?.total ?? 0,
                    unit: "ACTIVE"
                }}
            >
                <Button asChild className="rounded-xl h-11 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[11px] transition-all hover:opacity-90 shadow-lg shadow-primary/20 border border-primary/20 active:scale-95">
                    <Link href="/links/new">
                        <Plus className="mr-2 h-4 w-4 stroke-[3px]" />
                        Shorten URL
                    </Link>
                </Button>
            </PageHeader>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Links"
                    value={analytics?.totalUrls ?? 0}
                    icon={LinkIcon}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Total Clicks"
                    value={analytics?.totalClicks ?? 0}
                    icon={MousePointer2}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Unique Reach"
                    value={analytics?.uniqueClicks ?? 0}
                    icon={BarChart}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Clicks (30d)"
                    value={analytics?.clicksThisMonth ?? 0}
                    icon={TrendingUp}
                    loading={analyticsLoading}
                />
            </div>

            {!analyticsLoading && !hasUrls ? (
                <EmptyTerminal
                    title="No Links Created"
                    description="Start by creating your first shortened URL. We'll track every click and provide detailed platform insights."
                    icon={LinkIcon}
                    actionLabel="Create First Link"
                    actionHref="/links/new"
                />
            ) : (
                <>
                    {/* Advanced Insights */}
                    <div className="grid gap-6 lg:grid-cols-3 items-start">
                        {/* Traffic Dynamics */}
                        <div className="lg:col-span-2">
                            <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden h-full">
                                <CardHeader className="p-8 pb-4">
                                    <TechnicalIndicator label="Traffic Growth" icon={Activity} />
                                    <h2 className="text-xl font-black tracking-tight text-foreground">Click Activity</h2>
                                </CardHeader>
                                <CardContent className="p-8 pt-4">
                                    {analyticsLoading ? (
                                        <Skeleton className="h-[300px] w-full rounded-3xl" />
                                    ) : (
                                        <ClicksChart
                                            data={analytics?.clicksByDate ?? []}
                                            title="Platform Volume"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Performance Leaders */}
                        <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden h-full">
                            <CardHeader className="p-8 pb-6 flex flex-row items-center justify-between">
                                <div className="space-y-0.5">
                                    <TechnicalIndicator label="Performance" icon={TrendingUp} color="violet" className="mb-0" />
                                    <h2 className="text-lg font-black tracking-tight text-foreground">Top Links</h2>
                                </div>
                                <Link
                                    href="/links"
                                    className="h-10 w-10 flex items-center justify-center rounded-full bg-muted border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
                                >
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </CardHeader>
                            <CardContent className="px-8 pb-8 space-y-4">
                                {analyticsLoading
                                    ? Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <Skeleton className="h-14 flex-1 rounded-2xl" />
                                        </div>
                                    ))
                                    : (analytics?.topUrls ?? []).slice(0, 5).map((url: any) => (
                                        <div
                                            key={url.id}
                                            className="flex items-center justify-between gap-4 group p-1"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    href={`/links/${url.id}`}
                                                    className="text-lg font-black text-foreground truncate block tracking-tighter hover:text-primary transition-colors mb-0.5"
                                                >
                                                    /{url.slug}
                                                </Link>
                                                <p className="text-xs font-bold text-muted-foreground truncate uppercase tracking-widest">
                                                    {url.title || "External Link"}
                                                </p>
                                            </div>
                                            <div className="shrink-0 flex flex-col items-end">
                                                <span className="text-xl font-black text-foreground tabular-nums leading-none">
                                                    {formatNumber(url.clickCount)}
                                                </span>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mt-1">
                                                    Hits
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Entry Log */}
                    <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                        <CardHeader className="p-8 flex flex-row items-center justify-between border-b border-border">
                            <div className="space-y-0.5">
                                <TechnicalIndicator label="Live Stream" icon={Activity} color="amber" className="mb-0" />
                                <h2 className="text-xl font-black tracking-tight text-foreground">Recent Activity</h2>
                            </div>
                            <Button asChild variant="outline" className="rounded-2xl border-border px-6 font-black uppercase tracking-widest text-xs h-12 hover:bg-muted transition-all bg-background shadow-sm hover:border-primary/50">
                                <Link href="/links">
                                    Full Audit <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {urlsLoading ? (
                                <div className="p-10 space-y-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} className="h-20 w-full rounded-3xl" />
                                    ))}
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {recentUrls.map((url: ShortURL) => (
                                        <div
                                            key={url.id}
                                            className="flex items-center gap-8 p-10 hover:bg-muted/30 transition-all duration-300 group"
                                        >
                                            <div className={cn(
                                                "h-4 w-4 rounded-full shrink-0 transition-transform group-hover:scale-125",
                                                url.isActive ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-muted-foreground/20"
                                            )} />

                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    href={`/links/${url.id}`}
                                                    className="text-2xl font-black text-foreground tracking-tighter hover:text-primary transition-colors block mb-1"
                                                >
                                                    /{url.slug}
                                                </Link>
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="text-xs font-black px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-tighter shrink-0">URL</span>
                                                    <p className="text-sm font-bold text-muted-foreground truncate">
                                                        {url.originalUrl}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <p className="text-3xl font-black text-foreground tabular-nums tracking-tighter">
                                                    {formatNumber(url.clickCount)}
                                                </p>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Clicks</p>
                                            </div>

                                            <div className="min-w-[120px] text-right shrink-0 hidden lg:block">
                                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Created</p>
                                                <p className="text-sm font-bold text-muted-foreground">{timeAgo(url.createdAt)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
