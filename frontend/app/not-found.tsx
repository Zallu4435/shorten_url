"use client";

import Link from "next/link";
import { Link2Off, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";

export default function NotFound() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-background/50 backdrop-blur-3xl p-6 text-center overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute h-[500px] w-[500px] bg-primary/5 rounded-full blur-[140px] animate-pulse -z-10" />

            <div className="relative w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-1000 slide-in-from-bottom-8">
                <Card className="rounded-[44px] border-border bg-card/40 shadow-2xl backdrop-blur-md overflow-hidden p-2">
                    <CardContent className="p-10 flex flex-col items-center">
                        {/* Status Identifier */}
                        <div className="flex flex-col items-center gap-6 mb-8 w-full">
                            <TechnicalIndicator
                                label="404 Protocol"
                                icon={Link2Off}
                                color="primary"
                                className="mb-0"
                            />

                            <div className="space-y-3">
                                <h1 className="text-3xl font-black tracking-tighter text-foreground leading-tight">
                                    Node Not Found
                                </h1>
                                <p className="text-sm font-bold text-muted-foreground/60 tracking-tight max-w-[280px] mx-auto leading-relaxed">
                                    The requested neural path does not exist or has been permanently de-indexed from the core.
                                </p>
                            </div>
                        </div>

                        {/* Actions Hub */}
                        <div className="flex flex-col gap-4 w-full pt-4">
                            <Button
                                asChild
                                className="h-16 rounded-[24px] bg-primary text-primary-foreground font-black uppercase tracking-[0.3em] text-[11px] shadow-xl hover:opacity-90 active:scale-[0.98] transition-all group"
                            >
                                <Link href="/" className="flex items-center gap-3">
                                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                    Return to Control Center
                                </Link>
                            </Button>

                            <Button
                                variant="outline"
                                asChild
                                className="h-16 rounded-[24px] border-border bg-transparent text-foreground font-black uppercase tracking-[0.3em] text-[11px] hover:bg-muted/50 active:scale-[0.98] transition-all group"
                            >
                                <Link href="/links/new" className="flex items-center gap-3">
                                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                                    Generate New Path
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Secure Protocol Branding */}
                <div className="mt-10 flex flex-col items-center gap-4 opacity-40">
                    <div className="flex items-center gap-3">
                        <div className="h-px w-6 bg-border" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                            Powered by <span className="text-foreground">Shorten URL</span>
                        </span>
                        <div className="h-px w-6 bg-border" />
                    </div>
                </div>
            </div>
        </div>
    );
}
