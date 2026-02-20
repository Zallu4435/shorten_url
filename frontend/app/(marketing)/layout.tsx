"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BarChart3, Link2, QrCode, Shield, Sparkles, Zap, ArrowRight, MousePointerClick } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
}

const features: Feature[] = [
    { icon: BarChart3, title: "Analytics", description: "Real-time click tracking." },
    { icon: QrCode, title: "QR Codes", description: "Instant generation." },
    { icon: Sparkles, title: "AI Slugs", description: "Genini suggestions." },
    { icon: Shield, title: "Secure", description: "Password protection." },
];

const stats = [
    { value: "10M+", label: "Links Created" },
    { value: "99.99%", label: "System Uptime" },
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
            <div className="flex h-screen w-full items-center justify-center bg-[#070709]">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            </div>
        );
    }

    if (isLoggedIn) return null;
    return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <GuestGuard>
            <div className="relative min-h-screen w-full bg-[#070708] lg:bg-[#070708] overflow-hidden selection:bg-violet-500/30">
                {/* ── Visual Effects ──────────────── */}
                <div className="pointer-events-none fixed inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[100px]" />
                    <div className="absolute inset-0 opacity-[0.02]"
                        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                </div>

                <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row">
                    {/* ── Left Side: Content ──────────────── */}
                    <div className="flex flex-1 flex-col justify-between p-8 pt-12 lg:p-16 lg:pt-16 xl:p-24">
                        {/* Logo Area */}
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-violet-500/20">
                                <Link2 className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-white">
                                SHORTEN<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">URL</span>
                            </span>
                        </div>

                        {/* Mid Content */}
                        <div className="max-w-xl">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-2">
                                <Sparkles className="h-4 w-4 text-violet-400" />
                                <span className="text-xs font-bold uppercase tracking-widest text-violet-300">Next Gen Link Intelligence</span>
                            </div>

                            <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl xl:text-7xl">
                                Scale your links.{" "}
                                <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400">
                                    Own your data.
                                </span>
                            </h1>

                            <p className="mt-8 text-lg font-medium leading-relaxed text-zinc-400 xl:text-xl">
                                Enterprise-grade link optimization platform with deep analytics, smart routing, and global scale.
                            </p>

                            <div className="mt-12 grid grid-cols-2 gap-8 border-t border-white/5 pt-12">
                                {stats.map((s) => (
                                    <div key={s.label}>
                                        <div className="text-4xl font-black text-white">{s.value}</div>
                                        <div className="mt-1 text-sm font-bold uppercase tracking-widest text-zinc-500">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer (Desktop) */}
                        <div className="hidden items-center gap-6 lg:flex">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-10 w-10 rounded-full border-2 border-[#070708] bg-zinc-800" />
                                ))}
                            </div>
                            <p className="text-sm font-medium text-zinc-500">
                                Trusted by <span className="text-white">50k+</span> creators worldwide
                            </p>
                        </div>
                    </div>

                    {/* ── Right Side: Form ──────────────── */}
                    <div className="flex flex-1 items-center justify-center p-6 lg:p-12 xl:p-24">
                        <div className="relative w-full max-w-[480px]">
                            {/* Decorative background for the form area */}
                            <div className="absolute -inset-4 rounded-[40px] bg-gradient-to-tr from-violet-600/10 via-transparent to-indigo-600/10 blur-2xl" />

                            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-3xl sm:p-12">
                                {/* Top bar decor */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-600" />

                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GuestGuard>
    );
}
