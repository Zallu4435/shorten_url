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
    "hsl(277,60%,62%)",
    "hsl(230,60%,62%)",
    "hsl(162,60%,50%)",
    "hsl(45,80%,58%)",
];

interface DeviceChartProps {
    data: DeviceBreakdown[];
    loading?: boolean;
}

export function DeviceChart({ data, loading = false }: DeviceChartProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Devices</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[180px] w-full rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    const total = data.reduce((s, d) => s + d.count, 0);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Devices
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="count"
                                nameKey="deviceType"
                                cx="50%"
                                cy="50%"
                                innerRadius={42}
                                outerRadius={65}
                                paddingAngle={2}
                                strokeWidth={0}
                            >
                                {data.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [
                                    `${value.toLocaleString()} (${total ? Math.round((value / total) * 100) : 0}%)`,
                                ]}
                                contentStyle={{
                                    background: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    fontSize: 12,
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="flex-1 space-y-2">
                        {data.map((d, i) => (
                            <div key={d.deviceType} className="flex items-center gap-2">
                                <div
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <span className="text-xs text-muted-foreground capitalize flex-1 truncate">
                                    {d.deviceType}
                                </span>
                                <span className="text-xs font-medium tabular-nums">
                                    {total ? Math.round((d.count / total) * 100) : 0}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
