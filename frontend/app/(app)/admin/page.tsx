"use client";

import { useQuery } from "@apollo/client";
import { Users, Link2, MousePointerClick, AlertTriangle, TrendingUp, Calendar, ShieldCheck, Zap, Activity, Globe } from "lucide-react";
import Link from "next/link";

import { PLATFORM_STATS_QUERY } from "@/lib/graphql/queries";
import { StatCard } from "@/components/analytics/StatCard";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { PlatformStats } from "@/types";

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const { data, loading } = useQuery<{ platformStats: PlatformStats }>(
        PLATFORM_STATS_QUERY,
        { skip: !user?.isAdmin }
    );

    useEffect(() => {
        if (!authLoading && user && !user.isAdmin) {
            router.replace("/dashboard");
        }
    }, [authLoading, user, router]);

    if (!user?.isAdmin) return null;

    const stats = data?.platformStats;

    return (
        <div className="space-y-12 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
            <PageHeader
                title="Central Command"
                description="Global platform intelligence & node oversight"
                icon={ShieldCheck}
                stats={{
                    label: "Network Health",
                    value: "OPTIMAL",
                    unit: "SYS"
                }}
            >
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-border hover:bg-muted shadow-sm" asChild>
                        <Link href="/admin/users">
                            <Users className="mr-2 h-4 w-4" />
                            User Directory
                        </Link>
                    </Button>
                    <Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-border hover:bg-muted shadow-sm" asChild>
                        <Link href="/admin/urls">
                            <Link2 className="mr-2 h-4 w-4" />
                            Node Registry
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            {/* Totals */}
            <div className="space-y-4">
                <TechnicalIndicator label="Platform Aggregate" icon={Activity} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} loading={loading} />
                    <StatCard label="Total Nodes" value={stats?.totalUrls ?? 0} icon={Link2} loading={loading} />
                    <StatCard label="Traffic Volume" value={stats?.totalClicks ?? 0} icon={MousePointerClick} loading={loading} />
                    <StatCard label="Alerted Nodes" value={stats?.flaggedUrls ?? 0} icon={AlertTriangle} loading={loading} />
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* Today */}
                <div className="space-y-4">
                    <TechnicalIndicator label="Live Pulse (24h)" icon={Zap} color="amber" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <StatCard label="New Users" value={stats?.newUsersToday ?? 0} icon={Users} loading={loading} />
                        <StatCard label="Provisioned" value={stats?.newUrlsToday ?? 0} icon={Link2} loading={loading} />
                        <StatCard label="Resolutions" value={stats?.clicksToday ?? 0} icon={Activity} loading={loading} />
                    </div>
                </div>

                {/* This month */}
                <div className="space-y-4">
                    <TechnicalIndicator label="Temporal Flow (30d)" icon={Globe} color="violet" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <StatCard label="Network Growth" value={stats?.newUsersThisMonth ?? 0} icon={Users} loading={loading} />
                        <StatCard label="Node Expansion" value={stats?.newUrlsThisMonth ?? 0} icon={Link2} loading={loading} />
                        <StatCard label="Data Flux" value={stats?.clicksThisMonth ?? 0} icon={Calendar} loading={loading} />
                    </div>
                </div>
            </div>

            {/* Quick links */}
            <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="p-10 pb-6 bg-muted/30 border-b border-border">
                    <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">
                        Quick Commands
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-10 flex flex-wrap gap-4">
                    <Button variant="outline" className="rounded-xl h-12 px-6 font-bold border-border hover:bg-muted shadow-sm transition-all hover:border-primary/30" asChild>
                        <Link href="/admin/users">
                            <Users className="mr-3 h-4 w-4 text-primary" />
                            Audit User Matrix
                        </Link>
                    </Button>
                    <Button variant="outline" className="rounded-xl h-12 px-6 font-bold border-border hover:bg-muted shadow-sm transition-all hover:border-primary/30" asChild>
                        <Link href="/admin/urls">
                            <Link2 className="mr-3 h-4 w-4 text-primary" />
                            Scan Link Registry
                        </Link>
                    </Button>
                    <Button variant="outline" className="rounded-xl h-12 px-6 font-bold border-red-500/20 text-red-500 bg-red-500/[0.02] hover:bg-red-500/10 shadow-sm transition-all" asChild>
                        <Link href="/admin/urls?flagged=true">
                            <AlertTriangle className="mr-3 h-4 w-4" />
                            Review Flagged Nodes
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
