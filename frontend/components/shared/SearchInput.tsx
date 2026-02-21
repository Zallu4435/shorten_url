"use client";

import { Search, X } from "lucide-react";
import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    inputRef?: React.RefObject<HTMLInputElement | null>;
    className?: string;
}

export function SearchInput({
    placeholder = "Search by slug, title, or destination...",
    value,
    onChange,
    onFocus,
    inputRef,
    className,
}: SearchInputProps) {
    return (
        <div className={cn("relative group w-full", className)}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
            </div>

            <Input
                ref={inputRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={onFocus}
                className={cn(
                    "h-12 pl-11 pr-10 bg-muted/30 border-border/50 rounded-2xl font-bold tracking-tight",
                    "placeholder:text-muted-foreground/60 placeholder:font-medium",
                    "focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all shadow-sm",
                    "text-sm"
                )}
            />

            {value && (
                <button
                    onClick={() => onChange("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-muted transition-all cursor-pointer"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}
