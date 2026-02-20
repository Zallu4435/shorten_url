"use client";

import { useQuery } from "@apollo/client";
import { BarChart3, Link2, MousePointerClick, TrendingUp } from "lucide-react";

import { MY_ANALYTICS_QUERY } from "@/lib/graphql/queries";
import { StatCard } from "@/components/analytics/StatCard";
import { ClicksChart } from "@/components/analytics/ClicksChart";
import { DeviceChart } from "@/components/analytics/DeviceChart";
import { CountryChart } from "@/components/analytics/CountryChart";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import type { UserAnalyticsOverview } from "@/types";

export default function AnalyticsPage() {
    const { data, loading } = useQuery<{ myAnalytics: UserAnalyticsOverview }>(
        MY_ANALYTICS_QUERY
    );

    const analytics = data?.myAnalytics;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Performance across all your links
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total links" value={analytics?.totalUrls ?? 0} icon={Link2} loading={loading} />
                <StatCard label="Total clicks" value={analytics?.totalClicks ?? 0} icon={MousePointerClick} loading={loading} />
                <StatCard label="Unique clicks" value={analytics?.uniqueClicks ?? 0} icon={BarChart3} loading={loading} />
                <StatCard label="This month" value={analytics?.clicksThisMonth ?? 0} icon={TrendingUp} loading={loading} />
            </div>

            {/* Top URLs */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Top performing links
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {(analytics?.topUrls ?? []).map((url, i) => (
                                <div key={url.id} className="flex items-center gap-4 py-3">
                                    <span className="text-sm font-mono text-muted-foreground w-6">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/links/${url.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                                            /{url.slug}
                                        </Link>
                                        {url.title && (
                                            <p className="text-xs text-muted-foreground truncate">{url.title}</p>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className="tabular-nums">
                                        {formatNumber(url.clickCount)} clicks
                                    </Badge>
                                </div>
                            ))}
                            {!loading && !analytics?.topUrls?.length && (
                                <p className="text-sm text-muted-foreground py-6 text-center">No data yet</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
