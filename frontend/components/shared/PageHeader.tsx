"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description: string;
    icon: LucideIcon;
    children?: React.ReactNode;
    stats?: {
        label: string;
        value: string | number;
        unit?: string;
    };
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    children,
    stats,
}: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8 mb-8 animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-[20px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
                    <Icon className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground leading-tight">
                        {title}
                    </h1>
                    <p className="text-sm md:text-base font-bold text-muted-foreground tracking-tight max-w-xl">
                        {description}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
                {stats && (
                    <div className="px-5 py-3 rounded-2xl bg-muted/40 border border-border/50 text-right backdrop-blur-sm">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">
                            {stats.label}
                        </p>
                        <div className="flex items-baseline justify-end gap-1.5">
                            <span className="text-2xl font-black text-foreground tracking-tighter leading-none">
                                {stats.value}
                            </span>
                            {stats.unit && (
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {stats.unit}
                                </span>
                            )}
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-3">
                    {children}
                </div>
            </div>
        </div>
    );
}
