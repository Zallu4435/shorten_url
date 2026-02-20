"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    LayoutDashboard,
    Link2,
    Plus,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Links", href: "/links", icon: Link2 },
    { label: "New", href: "/links/new", icon: Plus, primary: true },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-end justify-around border-t border-border bg-background/95 pb-2 backdrop-blur-md md:hidden">
            {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                if (item.primary) {
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex h-12 w-12 -mt-4 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform active:scale-95"
                            aria-label="Create new link"
                        >
                            <Icon className="h-5 w-5 text-primary-foreground" />
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center gap-1 pt-2 px-3"
                    >
                        <Icon
                            className={cn(
                                "h-5 w-5 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        />
                        <span
                            className={cn(
                                "text-[10px] font-medium transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
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
