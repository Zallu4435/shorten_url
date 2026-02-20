"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TechnicalIndicatorProps {
    label: string;
    icon?: LucideIcon;
    color?: "primary" | "amber" | "violet" | "emerald" | "red";
    className?: string;
}

export function TechnicalIndicator({
    label,
    icon: Icon,
    color = "primary",
    className,
}: TechnicalIndicatorProps) {
    const colorClasses = {
        primary: "text-primary bg-primary/10",
        amber: "text-amber-500 bg-amber-500/10",
        violet: "text-violet-500 bg-violet-500/10",
        emerald: "text-emerald-500 bg-emerald-500/10",
        red: "text-red-500 bg-red-500/10",
    };

    return (
        <div className={cn("flex items-center gap-2 px-1 mb-4 select-none", className)}>
            {Icon && (
                <div className={cn("h-4 w-4 rounded-sm flex items-center justify-center", colorClasses[color])}>
                    <Icon className="h-3 w-3" />
                </div>
            )}
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                {label}
            </p>
        </div>
    );
}
