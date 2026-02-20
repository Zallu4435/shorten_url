"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BarChart3, Link2, QrCode, Shield, Sparkles, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
}

const features: Feature[] = [
    {
        icon: BarChart3,
        title: "Deep analytics",
        description: "Clicks by device, country, browser, and referrer.",
    },
    {
        icon: QrCode,
        title: "QR code generation",
        description: "Every link gets its own QR code, instantly.",
    },
    {
        icon: Shield,
        title: "Private links",
        description: "Password-protect and set expiry dates.",
    },
    {
        icon: Sparkles,
        title: "AI slug suggestions",
        description: "Gemini generates creative, memorable slugs.",
    },
    {
        icon: Zap,
        title: "Webhook triggers",
        description: "Fire a POST request on every click event.",
    },
    {
        icon: Link2,
        title: "Dynamic redirects",
        description: "Route by device, time of day, or geolocation.",
    },
];

// Redirect already-authenticated users away from /login and /register
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
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            </div>
        );
    }

    if (isLoggedIn) return null;

    return <>{children}</>;
}

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <GuestGuard>
            <div className="grid min-h-screen lg:grid-cols-2">
                {/* ── Left panel — brand & features ──────────── */}
                <div className="relative hidden flex-col bg-zinc-950 p-10 text-white lg:flex">
                    {/* Subtle gradient orbs */}
                    <div
                        className="pointer-events-none absolute inset-0 overflow-hidden"
                        aria-hidden="true"
                    >
                        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
                        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl" />
                    </div>

                    <div className="relative z-10 flex h-full flex-col">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
                                <Link2 className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-semibold tracking-tight">
                                Shorten URL
                            </span>
                        </div>

                        {/* Tagline + features pushed to bottom */}
                        <div className="mt-auto">
                            <blockquote className="space-y-3">
                                <p className="text-3xl font-bold leading-snug tracking-tight">
                                    Shrink links.{" "}
                                    <span className="text-violet-400">Grow insights.</span>
                                </p>
                                <p className="text-base text-zinc-400 leading-relaxed">
                                    A production-grade link shortener with real analytics, AI
                                    suggestions, and enterprise-level controls.
                                </p>
                            </blockquote>

                            {/* Feature grid */}
                            <div className="mt-8 grid grid-cols-2 gap-3">
                                {features.map(({ icon: Icon, title, description }) => (
                                    <div
                                        key={title}
                                        className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm"
                                    >
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Icon className="h-3.5 w-3.5 text-violet-400" />
                                            <span className="text-sm font-medium text-white">
                                                {title}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400 leading-relaxed">
                                            {description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right panel — form ──────────────────────── */}
                <div className="flex min-h-screen items-center justify-center bg-background p-8">
                    <div className="w-full max-w-sm">{children}</div>
                </div>
            </div>
        </GuestGuard>
    );
}
