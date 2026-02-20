"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: number;
    icon: LucideIcon;
    trend?: number; // % change; positive = up, negative = down
    iconColor?: string;
    loading?: boolean;
}

// Count-up animation hook
function useCountUp(target: number, duration = 1200, enabled = true) {
    const [count, setCount] = useState(0);
    const frame = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled || target === 0) {
            setCount(target);
            return;
        }
        const start = performance.now();
        const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
            setCount(Math.round(eased * target));
            if (progress < 1) frame.current = requestAnimationFrame(animate);
        };
        frame.current = requestAnimationFrame(animate);
        return () => {
            if (frame.current) cancelAnimationFrame(frame.current);
        };
    }, [target, duration, enabled]);

    return count;
}

export function StatCard({
    label,
    value,
    icon: Icon,
    trend,
    iconColor = "text-primary",
    loading = false,
}: StatCardProps) {
    const displayed = useCountUp(value, 1000, !loading);

    if (loading) {
        return (
            <Card>
                <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-3.5 w-24" />
                            <Skeleton className="h-7 w-16" />
                        </div>
                        <Skeleton className="h-9 w-9 rounded-lg" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const TrendIcon =
        trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

    return (
        <Card className="transition-shadow duration-200 hover:shadow-md">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {label}
                        </p>
                        <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">
                            {formatNumber(displayed)}
                        </p>
                        {trend !== undefined && TrendIcon && (
                            <div
                                className={cn(
                                    "mt-1.5 flex items-center gap-1 text-xs font-medium",
                                    trend > 0
                                        ? "text-emerald-500"
                                        : trend < 0
                                            ? "text-destructive"
                                            : "text-muted-foreground"
                                )}
                            >
                                <TrendIcon className="h-3 w-3" />
                                <span>
                                    {trend > 0 ? "+" : ""}
                                    {trend}% vs last month
                                </span>
                            </div>
                        )}
                    </div>

                    <div
                        className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10",
                            iconColor
                        )}
                    >
                        <Icon className="h-4.5 w-4.5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
