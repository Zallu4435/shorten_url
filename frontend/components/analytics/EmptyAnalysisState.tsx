"use client";

import { LucideIcon, Ghost } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyAnalysisStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    className?: string;
}

export function EmptyAnalysisState({
    title,
    description,
    icon: Icon = Ghost,
    className,
}: EmptyAnalysisStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-1000",
                "relative overflow-hidden h-full w-full",
                className
            )}
        >
            {/* Background Decorative Element - Subtler Gradient */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--primary)_0,transparent_70%)] blur-[60px]" />
            </div>

            {/* Content Container - Flex column with controlled gap */}
            <div className="relative z-10 flex flex-col items-center gap-4 max-w-[400px]">
                {/* Icon Group - Scaled down slightly for better fit */}
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-125 animate-pulse" />
                    <div className="relative h-12 w-12 bg-card border border-border/50 rounded-xl flex items-center justify-center shadow-xl backdrop-blur-xl">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                </div>

                {/* Text Group */}
                <div className="space-y-1">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/90">
                        {title}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground/50 leading-relaxed uppercase tracking-wider px-4">
                        {description}
                    </p>
                </div>

                {/* Status Indicator - More compact */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted/20 border border-border/20 backdrop-blur-sm">
                    <div className="h-1 w-1 rounded-full bg-primary/40 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
                        Signal: Awaiting Data
                    </span>
                </div>
            </div>
        </div>
    );
}
