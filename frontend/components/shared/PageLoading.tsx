"use client";

import { Loader2, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
    message?: string;
    className?: string;
    fullScreen?: boolean;
}

export function PageLoading({
    message = "INITIALIZING SYSTEM PROTOCOLS...",
    className,
    fullScreen = false
}: PageLoadingProps) {
    return (
        <div className={cn(
            "relative flex w-full flex-col items-center justify-center bg-background/50 backdrop-blur-sm transition-all duration-500 animate-in fade-in",
            fullScreen ? "fixed inset-0 z-[100] h-screen" : "h-full min-h-[400px]",
            className
        )}>
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />

            <div className="relative flex flex-col items-center gap-8">
                {/* stylized Spinner Container */}
                <div className="relative">
                    {/* Inner Rotating Ring */}
                    <div className="absolute inset-0 rounded-full border-b-2 border-primary/20 animate-[spin_3s_linear_infinite]" />

                    {/* Main Loader */}
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] bg-card border border-border shadow-2xl shadow-primary/10 group">
                        <Loader2 className="h-10 w-10 text-primary animate-spin stroke-[2.5px]" />
                        <Zap className="absolute m-auto h-4 w-4 text-primary fill-primary animate-pulse opacity-50" />
                    </div>

                    {/* Orbiting Particles */}
                    <div className="absolute -inset-4 border border-primary/10 rounded-full animate-[spin_10s_linear_infinite]" />
                </div>

                {/* typography */}
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex items-center gap-3">
                        <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-primary/40" />
                        <span className="text-[11px] font-black text-primary uppercase tracking-[0.5em] drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]">
                            {message}
                        </span>
                        <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-primary/40" />
                    </div>

                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">
                            Verifying Secure Connection
                        </span>
                    </div>
                </div>
            </div>

            {/* System Status Indicators in Corners (Optional, subtle) */}
            <div className="absolute bottom-10 flex gap-4 opacity-20">
                <div className="h-1 w-1 rounded-full bg-primary animate-ping" />
                <div className="h-1 w-1 rounded-full bg-primary animate-ping [animation-delay:0.2s]" />
                <div className="h-1 w-1 rounded-full bg-primary animate-ping [animation-delay:0.4s]" />
            </div>
        </div>
    );
}
