"use client";

import { Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLoadingProps {
    message?: string;
    className?: string;
}

export function AppLoading({ message = "Loading...", className }: AppLoadingProps) {
    return (
        <div className={cn(
            "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background",
            className
        )}>
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-1000">
                {/* Brand Logo with Premium Glow */}
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/40 group">
                        <Zap className="h-8 w-8 text-primary-foreground fill-primary-foreground animate-pulse" />
                    </div>
                </div>

                {/* Brand Name */}
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tighter text-foreground">
                        Shorten<span className="text-primary font-black uppercase">URL</span>
                    </h1>
                    <div className="flex items-center gap-3 text-muted-foreground/60">
                        <Loader2 className="h-3 w-3 animate-spin stroke-[3px]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                            {message}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
