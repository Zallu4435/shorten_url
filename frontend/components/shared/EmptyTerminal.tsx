"use client";

import { LucideIcon, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyTerminalProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    actionLabel?: string;
    actionHref?: string;
    onClick?: () => void;
    className?: string;
}

export function EmptyTerminal({
    title,
    description,
    icon: Icon = Terminal,
    actionLabel,
    actionHref,
    onClick,
    className,
}: EmptyTerminalProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-16 rounded-[40px] border-2 border-dashed border-border/40 bg-muted/10 text-center animate-in zoom-in-95 duration-700",
            className
        )}>
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-30 animate-pulse" />
                <div className="relative h-20 w-20 rounded-3xl bg-muted/60 border border-border flex items-center justify-center shadow-xl">
                    <Icon className="h-10 w-10 text-muted-foreground/50" />
                </div>
            </div>

            <h3 className="text-2xl font-black tracking-tighter text-foreground mb-3 uppercase">
                {title}
            </h3>
            <p className="max-w-md text-sm font-bold text-muted-foreground/80 leading-relaxed mb-10 tracking-tight">
                {description}
            </p>

            {actionLabel && (actionHref || onClick) && (
                <Button
                    asChild={!!actionHref}
                    onClick={onClick}
                    className="rounded-2xl h-12 px-10 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 transition-all border border-primary/20 active:scale-[0.98]"
                >
                    {actionHref ? (
                        <Link href={actionHref}>
                            {actionLabel}
                        </Link>
                    ) : (
                        actionLabel
                    )}
                </Button>
            )}
        </div>
    );
}
