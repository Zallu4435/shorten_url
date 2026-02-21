"use client";

import { useQuery } from "@apollo/client";
import {
    Users, Link as LinkIcon, MousePointerClick, AlertTriangle,
    TrendingUp, ShieldCheck, Zap, Activity, Globe, CheckCircle2,
    MousePointer2,
} from "lucide-react";
import Link from "next/link";

import { PLATFORM_STATS_QUERY } from "@/lib/graphql/queries";
import { StatCard } from "@/components/analytics/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
        <div className="space-y-10 max-w-[1400px] mx-auto py-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <PageHeader
                title="Admin Dashboard"
                description="System overview, user management, and performance metrics."
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
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Links
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            {/* Platform Totals */}
            <div className="space-y-4">
                <TechnicalIndicator label="Platform Overview" icon={Activity} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} loading={loading} />
                    <StatCard label="Active Users" value={stats?.activeUsers ?? 0} icon={CheckCircle2} loading={loading} />
                    <StatCard label="Total Links" value={stats?.totalUrls ?? 0} icon={LinkIcon} loading={loading} />
                    <StatCard label="Total Clicks" value={stats?.totalClicks ?? 0} icon={MousePointerClick} loading={loading} />
                </div>
            </div>

            {/* Time-windowed activity */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Today */}
                <div className="space-y-4">
                    <TechnicalIndicator label="Activity (24h)" icon={Zap} color="amber" />
                    <div className="grid grid-cols-1 gap-4">
                        <StatCard label="New Users Today" value={stats?.newUsersToday ?? 0} icon={Users} loading={loading} />
                        <StatCard label="New Links Today" value={stats?.newUrlsToday ?? 0} icon={LinkIcon} loading={loading} />
                        <StatCard label="Clicks Today" value={stats?.clicksToday ?? 0} icon={MousePointer2} loading={loading} />
                    </div>
                </div>

                {/* This Week */}
                <div className="space-y-4">
                    <TechnicalIndicator label="Activity (7d)" icon={TrendingUp} color="violet" />
                    <div className="grid grid-cols-1 gap-4">
                        <StatCard label="Clicks This Week" value={stats?.clicksThisWeek ?? 0} icon={MousePointer2} loading={loading} />
                        <StatCard label="Active Links" value={stats?.activeUrls ?? 0} icon={LinkIcon} loading={loading} />
                        <StatCard label="Flagged Links" value={stats?.flaggedUrls ?? 0} icon={AlertTriangle} loading={loading} />
                    </div>
                </div>

                {/* This Month */}
                <div className="space-y-4">
                    <TechnicalIndicator label="Activity (30d)" icon={Globe} color="violet" />
                    <div className="grid grid-cols-1 gap-4">
                        <StatCard label="Clicks This Month" value={stats?.clicksThisMonth ?? 0} icon={MousePointerClick} loading={loading} />
                        <StatCard label="Total URLs" value={stats?.totalUrls ?? 0} icon={LinkIcon} loading={loading} />
                        <StatCard label="Active Users" value={stats?.activeUsers ?? 0} icon={Users} loading={loading} />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-5 border-b border-border">
                    <TechnicalIndicator label="Quick Actions" icon={ShieldCheck} />
                </CardHeader>
                <CardContent className="p-8 flex flex-wrap gap-3">
                    <Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-border hover:bg-muted shadow-sm transition-all hover:border-primary/30" asChild>
                        <Link href="/admin/users">
                            <Users className="mr-2 h-4 w-4 text-primary" />
                            All Users
                        </Link>
                    </Button>
                    <Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-border hover:bg-muted shadow-sm transition-all hover:border-primary/30" asChild>
                        <Link href="/admin/urls">
                            <LinkIcon className="mr-2 h-4 w-4 text-primary" />
                            All Links
                        </Link>
                    </Button>
                    <Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-red-500/20 text-red-500 bg-red-500/[0.02] hover:bg-red-500/10 shadow-sm transition-all" asChild>
                        <Link href="/admin/urls?flagged=true">
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Flagged Links
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
