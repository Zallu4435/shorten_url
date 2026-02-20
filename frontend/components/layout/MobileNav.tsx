"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MOBILE_NAV_ITEMS } from "@/lib/navigation";

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-20 items-end justify-around px-2 pb-4 pt-2 border-t border-border bg-background/80 backdrop-blur-xl md:hidden">
            {MOBILE_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                if (item.primary) {
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex h-14 w-14 -mt-8 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/20 transition-transform active:scale-90"
                            aria-label="Create new link"
                        >
                            <Icon className="h-7 w-7 text-primary-foreground stroke-[3px]" />
                            <div className="absolute inset-0 rounded-2xl bg-primary animate-ping opacity-20 pointer-events-none" />
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center gap-1.5 px-4 h-full pt-2 group"
                    >
                        <div className={cn(
                            "relative flex items-center justify-center p-2 rounded-xl transition-all duration-300",
                            isActive ? "bg-primary/10" : "group-hover:bg-muted"
                        )}>
                            <Icon
                                className={cn(
                                    "h-5 w-5 transition-all duration-300",
                                    isActive ? "text-primary scale-110" : "text-muted-foreground"
                                )}
                            />
                            {isActive && (
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                            )}
                        </div>
                        <span
                            className={cn(
                                "text-[9px] font-black uppercase tracking-widest transition-colors duration-300",
                                isActive ? "text-foreground" : "text-muted-foreground"
                            )}
                        >
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
