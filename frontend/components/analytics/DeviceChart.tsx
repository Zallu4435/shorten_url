"use client";

import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeviceBreakdown } from "@/types";

const COLORS = [
    "hsl(var(--primary))",
    "hsl(230, 70%, 50%)",
    "hsl(162, 70%, 45%)",
    "hsl(45, 90%, 50%)",
];

interface DeviceChartProps {
    data: DeviceBreakdown[];
    loading?: boolean;
}

export function DeviceChart({ data, loading = false }: DeviceChartProps) {
    if (loading) {
        return (
            <Card className="rounded-[40px] border-border bg-card shadow-sm">
                <CardHeader className="p-10 pb-6 border-b border-border">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/30 animate-pulse">Terminal Origin</CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                    <Skeleton className="h-[130px] w-full rounded-3xl" />
                </CardContent>
            </Card>
        );
    }

    const total = data.reduce((s, d) => s + d.count, 0);

    return (
        <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-10 pb-6 border-b border-border">
                <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Terminal Profile
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <div className="flex items-center gap-8">
                    <div className="shrink-0">
                        <ResponsiveContainer width={130} height={130}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="count"
                                    nameKey="deviceType"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={65}
                                    paddingAngle={4}
                                    strokeWidth={0}
                                    animationDuration={1500}
                                    animationBegin={200}
                                >
                                    {data.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} className="focus:outline-none transition-opacity hover:opacity-80" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        return (
                                            <div className="rounded-xl border border-border bg-popover/80 backdrop-blur-sm px-3 py-1.5 shadow-xl text-[10px] font-bold">
                                                {payload[0].name}: {payload[0].value?.toLocaleString()}
                                            </div>
                                        );
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex-1 space-y-3">
                        {data.map((d, i) => (
                            <div key={d.deviceType} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                    />
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
                                        {d.deviceType}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1.5 ml-4">
                                    <span className="text-sm font-extrabold text-foreground tabular-nums">
                                        {total ? Math.round((d.count / total) * 100) : 0}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground/40">%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
