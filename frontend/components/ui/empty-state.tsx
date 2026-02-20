"use client";

import { LucideIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actionLabel?: string;
    actionHref?: string;
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    actionLabel,
    actionHref,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-500",
            className
        )}>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border mb-4">
                <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground mb-1">
                {title}
            </h3>
            <p className="max-w-[300px] text-sm text-muted-foreground font-medium mb-6">
                {description}
            </p>
            {actionLabel && actionHref && (
                <Button asChild className="rounded-xl h-10 px-6 bg-primary text-primary-foreground font-bold shadow-sm">
                    <Link href={actionHref}>
                        <Plus className="mr-2 h-4 w-4 stroke-[3px]" />
                        {actionLabel}
                    </Link>
                </Button>
            )}
        </div>
    );
}
