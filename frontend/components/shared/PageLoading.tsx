"use client";

import { Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
    message?: string;
    className?: string;
}

export function PageLoading({ message = "Loading...", className }: PageLoadingProps) {
    return (
        <div className={cn(
            "relative flex h-full min-h-[300px] w-full flex-col items-center justify-center bg-transparent",
            className
        )}>
            <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
                <div className="relative">
                    <Loader2 className="h-6 w-6 text-primary/30 animate-spin stroke-[1.5px]" />
                    <Zap className="absolute inset-0 m-auto h-2.5 w-2.5 text-primary/40 fill-primary/20 animate-pulse" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground/50 tracking-wide">
                    {message}
                </span>
            </div>
        </div>
    );
}
