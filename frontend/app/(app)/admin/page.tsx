"use client";

import { useQuery } from "@apollo/client";
import { Users, Link2, MousePointerClick, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Admin Panel</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Platform overview & management</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/users">Manage Users</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/urls">Manage URLs</Link>
                    </Button>
                </div>
            </div>

            {/* Totals */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Platform totals</p>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard label="Total users" value={stats?.totalUsers ?? 0} icon={Users} loading={loading} />
                    <StatCard label="Total URLs" value={stats?.totalUrls ?? 0} icon={Link2} loading={loading} />
                    <StatCard label="Total clicks" value={stats?.totalClicks ?? 0} icon={MousePointerClick} loading={loading} />
                    <StatCard label="Flagged URLs" value={stats?.flaggedUrls ?? 0} icon={AlertTriangle} loading={loading} />
                </div>
            </div>

            {/* Today */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Today</p>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                    <StatCard label="New users" value={stats?.newUsersToday ?? 0} icon={Users} loading={loading} />
                    <StatCard label="New URLs" value={stats?.newUrlsToday ?? 0} icon={Link2} loading={loading} />
                    <StatCard label="Clicks" value={stats?.clicksToday ?? 0} icon={TrendingUp} loading={loading} />
                </div>
            </div>

            {/* This month */}
            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">This month</p>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                    <StatCard label="New users" value={stats?.newUsersThisMonth ?? 0} icon={Users} loading={loading} />
                    <StatCard label="New URLs" value={stats?.newUrlsThisMonth ?? 0} icon={Link2} loading={loading} />
                    <StatCard label="Clicks" value={stats?.clicksThisMonth ?? 0} icon={Calendar} loading={loading} />
                </div>
            </div>

            {/* Quick links */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Quick actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/users">View all users</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/urls">View all URLs</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/urls?flagged=true">View flagged URLs</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
