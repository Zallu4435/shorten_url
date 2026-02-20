"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
    label: string;
    value: string;
}

interface FilterSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
    icon?: LucideIcon;
    className?: string;
}

export function FilterSelect({
    value,
    onValueChange,
    options,
    placeholder = "Filter",
    icon: Icon = SlidersHorizontal,
    className,
}: FilterSelectProps) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={cn("w-full h-12 bg-muted/30 border-border/50 rounded-2xl focus:ring-primary/20 text-sm font-bold gap-3 px-4 shadow-sm transition-all hover:bg-muted/50 outline-none cursor-pointer", className)}>
                <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder={placeholder} />
                </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border bg-popover/95 backdrop-blur-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-200">
                {options.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        className="rounded-xl px-4 py-3 cursor-pointer focus:bg-primary/10 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-bold text-sm tracking-tight"
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
