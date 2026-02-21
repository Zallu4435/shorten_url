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
import { EmptyAnalysisState } from "./EmptyAnalysisState";
import { MousePointer2 } from "lucide-react";
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
        <div
            style={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                color: "var(--popover-foreground)",
            }}
            className="rounded-xl px-4 py-2.5 shadow-2xl text-[10px] font-bold uppercase tracking-widest"
        >
            <p style={{ color: "var(--muted-foreground)" }} className="mb-1">{label}</p>
            <p className="text-sm font-extrabold" style={{ color: "var(--foreground)" }}>
                {payload[0].value.toLocaleString()}{" "}
                <span style={{ color: "var(--primary)" }}>Clicks</span>
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
                <CardHeader className="p-8 pb-5 border-b border-border">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/30 animate-pulse">{title}</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <Skeleton className="h-[240px] w-full rounded-3xl" />
                </CardContent>
            </Card>
        );
    }

    const hasData = data.length > 0 && data.some(d => d.count > 0);
    const isSinglePoint = data.length === 1;

    const chartData = data.map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        }),
        clicks: d.count,
    }));

    // Compute nice integer tick values
    const maxVal = hasData ? Math.max(...data.map(d => d.count)) : 0;
    const yTicks = (() => {
        if (maxVal === 0) return [0];
        const step = maxVal <= 5 ? 1 : maxVal <= 20 ? 5 : maxVal <= 100 ? 10 : Math.ceil(maxVal / 5 / 10) * 10;
        const ticks: number[] = [];
        for (let i = 0; i <= maxVal; i += step) ticks.push(i);
        if (ticks[ticks.length - 1] < maxVal) ticks.push(ticks[ticks.length - 1] + step);
        return ticks;
    })();

    return (
        <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-8 pb-5 border-b border-border">
                <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pr-3">
                {hasData ? (
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart
                            data={chartData}
                            margin={{ left: -10, right: 14, top: 14, bottom: 4 }}
                        >
                            <defs>
                                <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="4 4"
                                stroke="var(--border)"
                                vertical={false}
                                opacity={0.7}
                            />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                dy={8}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                                ticks={yTicks}
                                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: "var(--primary)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="clicks"
                                stroke="var(--primary)"
                                strokeWidth={4}
                                fill="url(#clicksGradient)"
                                // Always show dots on data points for maximum clarity
                                dot={{
                                    r: 4,
                                    fill: "var(--primary)",
                                    stroke: "var(--background)",
                                    strokeWidth: 2,
                                    strokeOpacity: 0.8
                                }}
                                activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 3 }}
                                connectNulls
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[240px] w-full">
                        <EmptyAnalysisState
                            title="No Temporal Activity"
                            description="Terminal has not detected any inbound signals in the specified timeframe."
                            icon={MousePointer2}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
