"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ShieldCheck, Loader2, ArrowRight, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import { cn } from "@/lib/utils";

export function PasswordPromptClient() {
    const searchParams = useSearchParams();
    const slug = searchParams.get("slug");
    const errorParam = searchParams.get("error");

    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState(errorParam || "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || !slug) return;

        setIsSubmitting(true);
        setLocalError("");

        try {
            // Call the backend verification endpoint
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${slug}/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (data.success && data.redirect_url) {
                toast.success("Identity verified. Decrypting target...");
                // Small delay for the "perfect" UX feel
                setTimeout(() => {
                    window.location.href = data.redirect_url;
                }, 800);
            } else {
                setLocalError(data.error || "Access Denied: Invalid Authentication Token");
                toast.error("Decryption failed. Please verify credentials.");
                setIsSubmitting(false);
            }
        } catch {
            setLocalError("Network Protocol Error: Could not reach verification node");
            toast.error("Verification unavailable");
            setIsSubmitting(false);
        }
    };

    if (!slug) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <h1 className="text-xl font-black uppercase tracking-tighter mb-2">Protocol Error</h1>
                <p className="text-sm font-bold text-muted-foreground mb-6">No slug identifier provided in request.</p>
                <Button asChild variant="outline" className="rounded-xl px-8 font-black uppercase tracking-widest text-[11px]">
                    <Link href="/">Return to Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                <Card className="rounded-[40px] border-border bg-card shadow-2xl overflow-hidden">
                    <CardHeader className="p-10 pb-2 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                <div className="relative h-20 w-20 rounded-[28px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 border border-primary/20">
                                    <Lock className="h-9 w-9 text-primary-foreground stroke-[2.5px]" />
                                </div>
                            </div>
                        </div>
                        <TechnicalIndicator label="Secure Gateway" icon={ShieldCheck} className="mx-auto" />
                        <h1 className="text-3xl font-black tracking-tighter text-foreground mt-4">
                            Protected Access
                        </h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 opacity-60">
                            ID: {slug.toUpperCase()}
                        </p>
                    </CardHeader>

                    <CardContent className="p-10 pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">
                                    Access Password
                                </label>
                                <div className="relative group">
                                    <Input
                                        type="password"
                                        placeholder="Enter secure key..."
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isSubmitting}
                                        autoFocus
                                        className={cn(
                                            "h-16 bg-muted/20 border-border rounded-2xl font-black text-center tracking-[0.3em] transition-all duration-300 focus-visible:ring-primary/20 shadow-inner px-6",
                                            localError && "border-destructive/50 bg-destructive/[0.02]"
                                        )}
                                    />
                                </div>
                                {localError && (
                                    <p className="text-[10px] font-black uppercase text-destructive tracking-widest text-center animate-in fade-in slide-in-from-top-1">
                                        {localError}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || !password}
                                className="w-full h-16 rounded-[24px] bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-[0_20px_40px_-12px_rgba(var(--primary),0.3)] hover:opacity-95 active:scale-[0.98] transition-all border border-primary/20 relative group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Verifying Protocol
                                        </>
                                    ) : (
                                        <>
                                            Authenticate
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </span>
                            </Button>

                            <div className="pt-4 flex flex-col items-center gap-6">
                                <div className="flex items-center gap-2 opacity-30">
                                    <Zap className="h-3 w-3 text-primary fill-current" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">AES-256 SECURED</span>
                                    <Zap className="h-3 w-3 text-primary fill-current" />
                                </div>
                                <p className="text-[9px] font-bold text-muted-foreground text-center leading-relaxed max-w-[240px]">
                                    This link is restricted. Unauthorized access attempts are monitored and logged by the system.
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
