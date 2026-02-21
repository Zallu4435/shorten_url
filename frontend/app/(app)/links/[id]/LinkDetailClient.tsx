"use client";

import { useQuery } from "@apollo/client";
import {
    ArrowLeft,
    BarChart,
    Check,
    Copy,
    ExternalLink,
    MousePointer2,
    TrendingUp,
    Users,
    Settings,
    QrCode,
    Download,
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
import { PageLoading } from "@/components/shared/PageLoading";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { formatDateTime } from "@/lib/utils";
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

    if (urlLoading && !urlData) {
        return <PageLoading message="Loading link details..." />;
    }

    const handleCopy = () => {
        if (url?.shortUrl) {
            copy(url.shortUrl);
            toast.success("Link copied to clipboard");
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-10 py-6 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border pb-8">
                <div className="flex gap-4 min-w-0">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-xl bg-background border-border hover:bg-muted hover:border-primary/30 transition-all shadow-sm"
                        asChild
                    >
                        <Link href="/links">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>

                    <div className="min-w-0 flex-1">
                        {urlLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-8 w-48 rounded-lg" />
                                <Skeleton className="h-4 w-72 rounded-lg" />
                            </div>
                        ) : url ? (
                            <>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono">
                                        /{url.slug}
                                    </h1>
                                    <div className="flex items-center gap-1.5">
                                        {url.isActive ? (
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 px-2 py-0.5">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-muted text-[10px] font-black uppercase tracking-widest border border-border px-2 py-0.5">Inactive</Badge>
                                        )}
                                        {url.isPrivate && (
                                            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest border border-border px-2 py-0.5">Protected</Badge>
                                        )}
                                        {url.isFlagged && (
                                            <Badge variant="destructive" className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 px-2 py-0.5">Flagged</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-tighter shrink-0 border border-border">URL</span>
                                    <p className="text-sm font-medium text-muted-foreground truncate">
                                        {url.originalUrl}
                                    </p>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">
                                    Created: {formatDateTime(url.createdAt)}
                                </p>
                            </>
                        ) : (
                            <p className="text-muted-foreground font-bold">Link not found.</p>
                        )}
                    </div>
                </div>

                {url && (
                    <div className="flex items-center gap-3 shrink-0">
                        <Button variant="outline" className="h-11 px-6 rounded-xl font-bold gap-2 border-border hover:bg-muted shadow-sm hover:border-primary/30 transition-all" onClick={handleCopy}>
                            {copied ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                            Copy Link
                        </Button>
                        <Button variant="outline" className="h-11 px-6 rounded-xl font-bold gap-2 border-border hover:bg-muted shadow-sm hover:border-primary/30 transition-all" asChild>
                            <a href={url.shortUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                Open Link
                            </a>
                        </Button>
                        <Button variant="default" className="h-11 px-6 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 hover:opacity-90 border border-primary/20" asChild>
                            <Link href={`/links/${url.id}/edit`}>
                                <Settings className="h-4 w-4" />
                                Settings
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* Operational Intelligence Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Clicks"
                    value={analytics?.totalClicks ?? 0}
                    icon={MousePointer2}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Unique Visitors"
                    value={analytics?.uniqueClicks ?? 0}
                    icon={Users}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Devices"
                    value={analytics?.clicksByDevice?.length ?? 0}
                    icon={BarChart}
                    loading={analyticsLoading}
                />
                <StatCard
                    label="Countries"
                    value={analytics?.clicksByCountry?.length ?? 0}
                    icon={TrendingUp}
                    loading={analyticsLoading}
                />
            </div>

            {/* Performance Visualisation */}
            <div className="grid gap-6">
                <ClicksChart
                    data={analytics?.clicksByDate ?? []}
                    loading={analyticsLoading}
                    title="Clicks over time"
                />

                <div className="grid gap-6 md:grid-cols-2">
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

            {/* QR Code Card */}
            {url?.qrEnabled && url.qrCodeUrl ? (
                <div className="rounded-[32px] border border-border bg-card shadow-sm overflow-hidden">
                    <div className="p-7 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <QrCode className="h-4 w-4 text-primary" />
                            <h2 className="text-sm font-black uppercase tracking-widest">QR Code</h2>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                            On-the-fly · No disk storage
                        </span>
                    </div>
                    <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                        {/* QR Image */}
                        <div className="p-4 bg-white rounded-2xl shadow-md border border-border shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={url.qrCodeUrl}
                                alt={`QR code for /${url.slug}`}
                                className="w-48 h-48 object-contain"
                            />
                        </div>
                        {/* Info */}
                        <div className="space-y-4 min-w-0 flex-1">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Shareable Endpoint</p>
                                <code className="text-sm font-mono break-all text-foreground">{url.qrCodeUrl}</code>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Quality Spec</p>
                                <p className="text-xs text-muted-foreground">~600px · Error Correction H (30%) · ISO/IEC 18004 compliant</p>
                            </div>
                            <a
                                href={url.qrCodeUrl}
                                download={`qr-${url.slug}.png`}
                                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Download PNG
                            </a>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-[32px] border border-dashed border-border bg-muted/20 p-8 flex flex-col sm:flex-row items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-muted border border-border flex items-center justify-center shrink-0">
                        <QrCode className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                        <p className="text-sm font-black text-foreground">No QR Code</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Enable a scannable QR code for this link from the Settings page.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="h-10 px-5 rounded-xl border-border font-bold text-xs uppercase tracking-widest hover:bg-muted hover:border-primary/30 transition-all shrink-0"
                        asChild
                    >
                        <Link href={`/links/${url?.id}/edit`}>
                            Enable QR →
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
