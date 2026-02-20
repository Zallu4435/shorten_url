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
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
            <p className="text-muted-foreground mb-0.5">{label}</p>
            <p className="font-semibold">
                {payload[0].value.toLocaleString()} clicks
            </p>
        </div>
    );
}

export function ClicksChart({
    data,
    loading = false,
    title = "Clicks over time",
}: ClicksChartProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[220px] w-full rounded-lg" />
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
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData} margin={{ left: -20, right: 4 }}>
                        <defs>
                            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(277,60%,62%)" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="hsl(277,60%,62%)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
                        <Area
                            type="monotone"
                            dataKey="clicks"
                            stroke="hsl(277,60%,62%)"
                            strokeWidth={2}
                            fill="url(#clicksGradient)"
                            dot={false}
                            activeDot={{ r: 4, fill: "hsl(277,60%,62%)", stroke: "none" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
