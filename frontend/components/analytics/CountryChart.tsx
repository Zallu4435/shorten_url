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
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Top countries</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[180px] w-full rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    const top = data.slice(0, 8);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Top countries
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                        data={top}
                        layout="vertical"
                        margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                        barSize={10}
                    >
                        <XAxis
                            type="number"
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="country"
                            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                            width={80}
                        />
                        <Tooltip
                            formatter={(value: number) => [value.toLocaleString(), "clicks"]}
                            contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                fontSize: 12,
                            }}
                            cursor={{ fill: "hsl(var(--muted))" }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {top.map((_, i) => (
                                <Cell
                                    key={i}
                                    fill={`hsl(277 ${60 - i * 5}% ${62 + i * 2}%)`}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
