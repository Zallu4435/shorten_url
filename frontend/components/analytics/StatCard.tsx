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
    trend?: number;
    iconColor?: string;
    loading?: boolean;
}

function useCountUp(target: number, duration = 1200, enabled = true) {
    const [count, setCount] = useState(0);
    const frame = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled || target === 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCount(target);
            return;
        }
        const start = performance.now();
        const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
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
    iconColor = "text-violet-500",
    loading = false,
}: StatCardProps) {
    const displayed = useCountUp(value, 1000, !loading);

    if (loading) {
        return (
            <Card className="rounded-2xl border-border bg-card shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const TrendIcon =
        trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

    return (
        <Card className="relative overflow-hidden group transition-all duration-300 rounded-[32px] border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.99]">
            <CardContent className="p-8">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">
                            {label}
                        </p>
                        <p className="text-4xl font-black tracking-tighter text-foreground tabular-nums leading-none">
                            {formatNumber(displayed)}
                        </p>
                        {trend !== undefined && TrendIcon && (
                            <div
                                className={cn(
                                    "mt-5 flex items-center gap-1.5 text-xs font-black",
                                    trend > 0
                                        ? "text-emerald-500"
                                        : trend < 0
                                            ? "text-red-500"
                                            : "text-muted-foreground"
                                )}
                            >
                                <TrendIcon className="h-4 w-4 stroke-[3px]" />
                                <span className="uppercase tracking-[0.1em]">
                                    {trend > 0 ? "+" : ""}{trend}% Flux
                                </span>
                            </div>
                        )}
                    </div>

                    <div
                        className={cn(
                            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted/50 border border-border transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20",
                            iconColor
                        )}
                    >
                        <Icon className="h-6 w-6 stroke-[2.5px]" />
                    </div>
                </div>
            </CardContent>
            {/* Subtle highlight effect */}
            <div className="absolute inset-x-0 bottom-0 h-[4px] bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>
    );
}
