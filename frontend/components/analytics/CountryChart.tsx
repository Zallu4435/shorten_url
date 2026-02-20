"use client";

import {
    Bar,
    BarChart,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CountryBreakdown } from "@/types";

interface CountryChartProps {
    data: CountryBreakdown[];
    loading?: boolean;
}

export function CountryChart({ data, loading = false }: CountryChartProps) {
    if (loading) {
        return (
            <Card className="rounded-[40px] border-border bg-card shadow-sm">
                <CardHeader className="p-10 pb-6 border-b border-border">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/30 animate-pulse">Geographic Spread</CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                    <Skeleton className="h-[240px] w-full rounded-3xl" />
                </CardContent>
            </Card>
        );
    }

    const top = data.slice(0, 8);

    return (
        <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-10 pb-6 border-b border-border">
                <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Geographic Distribution
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                        data={top}
                        layout="vertical"
                        margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
                        barSize={8}
                    >
                        <XAxis
                            type="number"
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
                            axisLine={false}
                            tickLine={false}
                            hide
                        />
                        <YAxis
                            type="category"
                            dataKey="country"
                            tick={{ fontSize: 10, fill: "hsl(var(--foreground))", fontWeight: 800 }}
                            axisLine={false}
                            tickLine={false}
                            width={100}
                            interval={0}
                        />
                        <Tooltip
                            cursor={{ fill: "hsl(var(--muted)/0.5)", radius: 4 }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                    <div className="rounded-xl border border-border bg-popover/80 backdrop-blur-sm px-3 py-1.5 shadow-xl text-[10px] font-bold">
                                        <span className="text-primary mr-1.5">{payload[0].value?.toLocaleString()}</span>
                                        RESOLUTIONS
                                    </div>
                                );
                            }}
                        />
                        <Bar dataKey="count" radius={[0, 10, 10, 0]} animationDuration={1000}>
                            {top.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={`hsl(var(--primary) / ${1 - i * 0.1})`}
                                    className="transition-opacity hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
