import {
    LayoutDashboard,
    Link2,
    TrendingUp,
    Settings,
    Shield,
    Users,
    ExternalLink,
    Plus,
} from "lucide-react";

export interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    exact?: boolean;
    adminOnly?: boolean;
    badge?: string;
    primary?: boolean;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
    {
        label: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
    },
    {
        label: "Link Hub",
        href: "/links",
        icon: Link2,
    },
    {
        label: "Analytics",
        href: "/analytics",
        icon: TrendingUp,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
    {
        label: "Command",
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
        label: "Network",
        href: "/admin/urls",
        icon: ExternalLink,
        adminOnly: true,
    },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Links", href: "/links", icon: Link2 },
    { label: "New", href: "/links/new", icon: Plus, primary: true },
    { label: "Trends", href: "/analytics", icon: TrendingUp },
    { label: "Settings", href: "/settings", icon: Settings },
];
