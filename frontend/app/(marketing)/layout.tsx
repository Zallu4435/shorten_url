"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    BarChart,
    Link as LinkIcon,
    Scan,
    Shield,
    Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
    icon: LucideIcon;
    label: string;
    description: string;
}

const features: Feature[] = [
    {
        icon: BarChart,
        label: "Detailed Analytics",
        description: "Real-time click tracking, device, country & referrer breakdown.",
    },
    {
        icon: Scan,
        label: "QR Codes",
        description: "Instant QR generation for every link you create.",
    },
    {
        icon: Scan,
        label: "Smart Suggestions",
        description: "Intelligent slug and metadata generation in one click.",
    },
    {
        icon: Shield,
        label: "Password Protection",
        description: "Lock any link behind a secret key for private sharing.",
    },
    {
        icon: Activity,
        label: "Webhooks",
        description: "Fire real-time events to your server on every click.",
    },
];

function GuestGuard({ children }: { children: React.ReactNode }) {
    const { isLoggedIn, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && isLoggedIn) {
            router.replace("/dashboard");
        }
    }, [loading, isLoggedIn, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (isLoggedIn) return null;
    return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <GuestGuard>
            <div className="relative min-h-screen w-full bg-background overflow-hidden">
                {/* Subtle radial glow using primary token */}
                <div className="pointer-events-none fixed inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-primary/3 blur-[100px]" />
                </div>

                <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row">

                    {/* ── Left Side: Brand & Features ─────────── */}
                    <div className="hidden lg:flex flex-1 flex-col justify-between p-16 xl:p-24 border-r border-border">

                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                                <Activity className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-foreground">
                                Shorten<span className="text-primary font-black uppercase">URL</span>
                            </span>
                        </div>

                        {/* Headline */}
                        <div className="max-w-md space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                                    <Activity className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                                        Advanced Link Management
                                    </span>
                                </div>

                                <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-foreground xl:text-6xl">
                                    Scale your links.{" "}
                                    <span className="text-primary">Own your data.</span>
                                </h1>

                                <p className="text-base font-medium leading-relaxed text-muted-foreground">
                                    Enterprise-grade link shortening with detailed analytics,
                                    custom routing, and powerful integrations.
                                </p>
                            </div>

                            {/* Feature list */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                {features.map((f) => {
                                    const Icon = f.icon;
                                    return (
                                        <div key={f.label} className="flex items-start gap-4">
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground">{f.label}</p>
                                                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                                    {f.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bottom system status */}
                        <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3 w-fit">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                System Online
                            </span>
                        </div>
                    </div>

                    {/* ── Right Side: Form ─────────────────────── */}
                    <div className="flex flex-1 flex-col items-center justify-center p-6 lg:p-12 xl:p-20">

                        {/* Mobile-only logo */}
                        <div className="mb-8 flex items-center gap-3 lg:hidden">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                                <Activity className="h-4.5 w-4.5 text-primary-foreground fill-primary-foreground" />
                            </div>
                            <span className="text-lg font-bold tracking-tight text-foreground">
                                Shorten<span className="text-primary font-black uppercase">URL</span>
                            </span>
                        </div>

                        <div className="relative w-full max-w-[440px]">
                            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
                                {/* Primary accent bar */}
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-primary/60 rounded-t-2xl" />
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestGuard>
    );
}
