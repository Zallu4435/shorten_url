"use client";

import { useQuery } from "@apollo/client";
import {
    ArrowLeft,
    BarChart3,
    Check,
    Copy,
    ExternalLink,
    MousePointerClick,
    TrendingUp,
    Users,
} from "lucide-react";
import Link from "next/link";

import { GET_URL_QUERY, GET_ANALYTICS_QUERY } from "@/lib/graphql/queries";
import { StatCard } from "@/components/analytics/StatCard";
import { ClicksChart } from "@/components/analytics/ClicksChart";
import { DeviceChart } from "@/components/analytics/DeviceChart";
import { CountryChart } from "@/components/analytics/CountryChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { formatDateTime, truncateUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { ShortURL, AnalyticsSummary } from "@/types";

export function LinkDetailClient({ id }: { id: string }) {
    const { copied, copy } = useCopyToClipboard();

    const { data: urlData, loading: urlLoading } = useQuery<{
        getUrl: ShortURL;
    }>(GET_URL_QUERY, { variables: { id } });

    const { data: analyticsData, loading: analyticsLoading } = useQuery<{
        getAnalytics: AnalyticsSummary;
    }>(GET_ANALYTICS_QUERY, { variables: { urlId: id } });

    const url = urlData?.getUrl;
    const analytics = analyticsData?.getAnalytics;

    const handleCopy = () => {
        if (url?.shortUrl) {
            copy(url.shortUrl);
            toast.success("Copied!");
        }
    };

    return (
        <div className="space-y-6">
            {/* Back + header */}
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5" asChild>
                    <Link href="/links">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>

                <div className="flex-1 min-w-0">
                    {urlLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-72" />
                        </div>
                    ) : url ? (
                        <>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-semibold tracking-tight font-mono">
                                    /{url.slug}
                                </h1>
                                {!url.isActive && (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}
                                {url.isPrivate && (
                                    <Badge variant="secondary">Private</Badge>
                                )}
                                {url.isFlagged && (
                                    <Badge variant="destructive">Flagged</Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                {truncateUrl(url.originalUrl, 80)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Created {formatDateTime(url.createdAt)}
                            </p>
                        </>
                    ) : (
                        <p className="text-muted-foreground">Link not found</p>
                    )}
                </div>

                {url && (
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={handleCopy}>
                            {copied ? (
                                <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Copy
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <a href={url.shortUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                Open
                            </a>
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    label="Total clicks"
                    value={analytics?.totalClicks ?? 0}
                    icon={MousePointerClick}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Unique visitors"
                    value={analytics?.uniqueClicks ?? 0}
                    icon={Users}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Devices tracked"
                    value={analytics?.clicksByDevice?.length ?? 0}
                    icon={BarChart3}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Countries"
                    value={analytics?.clicksByCountry?.length ?? 0}
                    icon={TrendingUp}
                    loading={analyticsLoading}
                />
            </div>

            {/* Clicks chart */}
            <ClicksChart
                data={analytics?.clicksByDate ?? []}
                loading={analyticsLoading}
                title="Clicks over time"
            />

            {/* Device + Country */}
            <div className="grid gap-4 md:grid-cols-2">
                <DeviceChart
                    data={analytics?.clicksByDevice ?? []}
                    loading={analyticsLoading}
                />
                <CountryChart
                    data={analytics?.clicksByCountry ?? []}
                    loading={analyticsLoading}
                />
            </div>
        </div>
    );
}
