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
import { EmptyAnalysisState } from "./EmptyAnalysisState";
import { Globe } from "lucide-react";
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
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                            data={top}
                            layout="vertical"
                            margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
                            barSize={8}
                        >
                            <XAxis
                                type="number"
                                tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                                hide
                            />
                            <YAxis
                                type="category"
                                dataKey="country"
                                tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 800 }}
                                axisLine={false}
                                tickLine={false}
                                width={90}
                                interval={0}
                            />
                            <Tooltip
                                cursor={false}
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    return (
                                        <div
                                            style={{
                                                background: "var(--popover)",
                                                border: "1px solid var(--border)",
                                                color: "var(--popover-foreground)",
                                            }}
                                            className="rounded-xl px-3 py-1.5 shadow-xl text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            <span style={{ color: "var(--primary)" }} className="mr-1.5">
                                                {payload[0].value?.toLocaleString()}
                                            </span>
                                            Clicks
                                        </div>
                                    );
                                }}
                            />
                            <Bar dataKey="count" radius={[0, 8, 8, 0]} animationDuration={1000}>
                                {top.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill="var(--chart-1)"
                                        opacity={1 - i * 0.1}
                                        className="transition-opacity hover:opacity-80"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[240px] w-full">
                        <EmptyAnalysisState
                            title="No Geo-Spectral Data"
                            description="Satellite origin triangulation failed. No global ingress detected."
                            icon={Globe}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
