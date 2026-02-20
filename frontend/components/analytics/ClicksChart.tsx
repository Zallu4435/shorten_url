"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateBreakdown } from "@/types";

interface ClicksChartProps {
    data: DateBreakdown[];
    loading?: boolean;
    title?: string;
}

function CustomTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-border bg-popover/80 backdrop-blur-md px-4 py-2.5 shadow-2xl text-[10px] font-bold uppercase tracking-widest">
            <p className="text-muted-foreground/60 mb-1">{label}</p>
            <p className="text-sm font-extrabold text-foreground">
                {payload[0].value.toLocaleString()} <span className="text-primary">Hits</span>
            </p>
        </div>
    );
}

export function ClicksChart({
    data,
    loading = false,
    title = "Traffic Temporal Flow",
}: ClicksChartProps) {
    if (loading) {
        return (
            <Card className="rounded-[40px] border-border bg-card shadow-sm">
                <CardHeader className="p-10 pb-6 border-b border-border">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/30 animate-pulse">{title}</CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                    <Skeleton className="h-[260px] w-full rounded-3xl" />
                </CardContent>
            </Card>
        );
    }

    const chartData = data.map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
        clicks: d.count,
    }));

    return (
        <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-10 pb-6 border-b border-border">
                <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pr-4">
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
                        <defs>
                            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="hsl(var(--border))"
                            vertical={false}
                            opacity={0.4}
                        />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="clicks"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            fill="url(#clicksGradient)"
                            dot={false}
                            activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
