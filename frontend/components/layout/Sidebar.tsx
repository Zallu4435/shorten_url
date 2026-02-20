"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    Link2,
    LayoutDashboard,
    Plus,
    Settings,
    Shield,
    Users,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    exact?: boolean;
    adminOnly?: boolean;
    badge?: string;
}

const navItems: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
    },
    {
        label: "My Links",
        href: "/links",
        icon: Link2,
    },
    {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

const adminItems: NavItem[] = [
    {
        label: "Admin",
        href: "/admin",
        icon: Shield,
        adminOnly: true,
        exact: true,
    },
    {
        label: "Users",
        href: "/admin/users",
        icon: Users,
        adminOnly: true,
    },
    {
        label: "All URLs",
        href: "/admin/urls",
        icon: ExternalLink,
        adminOnly: true,
    },
];

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
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            <Icon
                className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
            />
            {item.label}
            {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs py-0 px-1.5">
                    {item.badge}
                </Badge>
            )}
        </Link>
    );
}

export function Sidebar() {
    const { user } = useAuth();

    return (
        <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-border bg-sidebar">
            {/* Logo */}
            <div className="flex h-14 items-center border-b border-border px-4">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                        <Link2 className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">
                        Shorten URL
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {/* Quick create */}
                <Link
                    href="/links/new"
                    className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 mb-3"
                >
                    <Plus className="h-4 w-4" />
                    New link
                </Link>

                {navItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                ))}

                {/* Admin section */}
                {user?.isAdmin && (
                    <>
                        <div className="pt-3 pb-1 px-3">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                                Admin
                            </p>
                        </div>
                        {adminItems.map((item) => (
                            <NavLink key={item.href} item={item} />
                        ))}
                    </>
                )}
            </nav>
        </aside>
    );
}
