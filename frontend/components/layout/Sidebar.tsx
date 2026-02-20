"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { MAIN_NAV_ITEMS, ADMIN_NAV_ITEMS, NavItem } from "@/lib/navigation";

function NavLink({ item }: { item: NavItem }) {
    const pathname = usePathname();
    const isActive = item.exact
        ? pathname === item.href
        : pathname.startsWith(item.href);
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className={cn(
                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-300",
                isActive
                    ? "bg-primary/10 text-primary font-black shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted font-bold"
            )}
        >
            {isActive && (
                <div className="absolute left-0 h-6 w-1 rounded-r-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
            )}
            <Icon
                className={cn(
                    "h-5 w-5 shrink-0 transition-all duration-300",
                    isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-foreground"
                )}
            />
            <span className="tracking-tight">{item.label}</span>
            {item.badge && (
                <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-tighter px-1.5 h-4">
                    {item.badge}
                </Badge>
            )}
        </Link>
    );
}

export function Sidebar() {
    const { user } = useAuth();

    return (
        <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-border bg-sidebar p-4 shadow-sm">
            {/* Branding */}
            <div className="mb-10 px-4 pt-4">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                        <Zap className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                        Shorten<span className="text-primary font-black uppercase">URL</span>
                    </span>
                </Link>
            </div>

            {/* Quick Action */}
            <div className="px-2 mb-8">
                <Link
                    href="/links/new"
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground px-4 py-3 text-sm font-bold transition-all hover:opacity-90 shadow-sm"
                >
                    <Plus className="h-4 w-4 stroke-[3px]" />
                    Create New Link
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 space-y-8 overflow-y-auto px-2">
                <div>
                    <p className="px-4 mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Main Network
                    </p>
                    <nav className="space-y-1">
                        {MAIN_NAV_ITEMS.map((item) => (
                            <NavLink key={item.href} item={item} />
                        ))}
                    </nav>
                </div>

                {/* Admin section */}
                {user?.isAdmin && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <p className="px-4 mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                            Central Command
                        </p>
                        <nav className="space-y-1">
                            {ADMIN_NAV_ITEMS.map((item) => (
                                <NavLink key={item.href} item={item} />
                            ))}
                        </nav>
                    </div>
                )}
            </div>

            {/* Footer / Status */}
            <div className="mt-auto px-4 py-6 border-t border-border">
                <div className="flex items-center gap-3 rounded-xl bg-muted p-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Online</span>
                </div>
            </div>
        </aside>
    );
}
