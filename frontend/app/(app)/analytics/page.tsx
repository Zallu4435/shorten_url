"use client";

import { useQuery } from "@apollo/client";
import { BarChart, Link as LinkIcon, MousePointer2, TrendingUp } from "lucide-react";

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
import { PageHeader } from "@/components/shared/PageHeader";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import { EmptyTerminal } from "@/components/shared/EmptyTerminal";
import { PageLoading } from "@/components/shared/PageLoading";
import { formatNumber } from "@/lib/utils";
import type { UserAnalyticsOverview } from "@/types";

export default function AnalyticsPage() {
    const { data, loading } = useQuery<{ myAnalytics: UserAnalyticsOverview }>(
        MY_ANALYTICS_QUERY
    );

    const analytics = data?.myAnalytics;

    if (loading && !data) {
        return <PageLoading message="Compiling Global Intelligence..." />;
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 py-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Page Header */}
            <PageHeader
                title="Analytics"
                description="Detailed performance insights for all your shortened links."
                icon={BarChart}
                stats={{
                    label: "Link Matrix",
                    value: analytics?.totalUrls ?? 0,
                    unit: "NODES"
                }}
            />

            {/* Global Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Links" value={analytics?.totalUrls ?? 0} icon={LinkIcon} loading={loading} />
                <StatCard label="Total Clicks" value={analytics?.totalClicks ?? 0} icon={MousePointer2} loading={loading} />
                <StatCard label="Unique Visitors" value={analytics?.uniqueClicks ?? 0} icon={BarChart} loading={loading} />
                <StatCard label="Flux (30d)" value={analytics?.clicksThisMonth ?? 0} icon={TrendingUp} loading={loading} />
            </div>

            {/* Performance Hierarchy */}
            <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-6 flex flex-row items-center justify-between border-b border-border">
                    <div className="space-y-0.5">
                        <TechnicalIndicator label="Top Performing Links" icon={TrendingUp} className="mb-0" />
                        <h2 className="text-xl font-black tracking-tight text-foreground">Top Performing Links</h2>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-10 space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {(analytics?.topUrls ?? []).map((url: any, i: number) => (
                                <div key={url.id} className="flex items-center gap-6 p-8 hover:bg-muted/30 transition-colors group">
                                    <span className="text-xl font-black text-muted-foreground w-8 tabular-nums italic">
                                        {(i + 1).toString().padStart(2, '0')}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/links/${url.id}`}
                                            className="text-lg font-black text-foreground hover:text-primary transition-colors block tracking-tighter"
                                        >
                                            /{url.slug}
                                        </Link>
                                        <p className="text-xs font-bold text-muted-foreground truncate uppercase tracking-widest mt-0.5">
                                            {url.title || "External Endpoint"}
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end">
                                        <span className="text-2xl font-black text-foreground tabular-nums leading-none">
                                            {formatNumber(url.clickCount)}
                                        </span>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter mt-1">
                                            Clicks
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {!loading && !analytics?.topUrls?.length && (
                                <div className="p-20">
                                    <EmptyTerminal
                                        title="No Analytics Data"
                                        description="No traffic detected yet. Performance metrics will appear once your links are visited."
                                        icon={LinkIcon}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
