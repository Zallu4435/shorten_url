"use client";

import { X, Copy, Check, Terminal, Download, Sparkles, ShieldAlert, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { toast } from "sonner";

interface TokenRevealModalProps {
    title?: string;
    description?: string;
    rawToken: string;
    agentCommand: string;
    onClose: () => void;
}

export function TokenRevealModal({
    title = "Access Granted",
    description = "Node credentials established. Secure your token to complete the neural uplink.",
    rawToken,
    agentCommand,
    onClose
}: TokenRevealModalProps) {
    const tokenCopy = useCopyToClipboard();
    const cmdCopy = useCopyToClipboard();

    const handleCopyToken = () => {
        tokenCopy.copy(rawToken);
        toast.success("Security token copied to buffer");
    };

    const handleCopyCmd = () => {
        cmdCopy.copy(agentCommand);
        toast.success("Startup command copied to buffer");
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <Card className="relative w-full max-w-[500px] rounded-[40px] border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                <CardContent className="p-0 flex flex-col">
                    {/* Header */}
                    <div className="bg-muted/30 p-8 border-b border-border">
                        <div className="flex items-center justify-between mb-6">
                            <TechnicalIndicator
                                label="Credentials Secured"
                                icon={Sparkles}
                                color="emerald"
                                className="mb-0"
                            />
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-background/80" onClick={onClose}>
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight text-foreground leading-none">
                                {title}
                            </h2>
                            <p className="text-sm font-bold text-muted-foreground/60 tracking-tight leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="space-y-6">
                            {/* Token Field */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                                    <KeyRound size={12} className="text-emerald-500" />
                                    Secret Access Token
                                </Label>
                                <div className="group relative">
                                    <div className="flex items-center gap-3 bg-muted/40 border-border rounded-2xl p-4 transition-all hover:bg-muted/60">
                                        <code className="text-xs font-mono font-bold text-foreground flex-1 break-all select-all">
                                            {rawToken}
                                        </code>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg border-border hover:text-emerald-500 hover:bg-emerald-500/10 shrink-0 transition-all font-bold"
                                            onClick={handleCopyToken}
                                        >
                                            {tokenCopy.copied ? <Check size={14} /> : <Copy size={14} />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5 px-1">
                                    <ShieldAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] font-bold text-muted-foreground/60 leading-tight">
                                        This token is highly volatile and <span className="text-amber-500 uppercase font-black">will not be displayed again</span>. Store it securely.
                                    </p>
                                </div>
                            </div>

                            {/* Command Field */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                                    <Terminal size={12} className="text-primary" />
                                    Terminal Startup
                                </Label>
                                <div className="bg-zinc-950 border border-border shadow-inner rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500/40" />
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500/40" />
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 px-2.5 rounded-lg border border-white/5 bg-white/5 text-[9px] font-black text-white hover:bg-white/10 shrink-0 transition-all uppercase tracking-widest"
                                            onClick={handleCopyCmd}
                                        >
                                            {cmdCopy.copied ? <Check size={10} className="mr-1" /> : <Copy size={10} className="mr-1" />}
                                            {cmdCopy.copied ? "Copied" : "Copy Command"}
                                        </Button>
                                    </div>
                                    <div className="bg-black/40 p-3.5 rounded-xl border border-white/5">
                                        <code className="text-[11px] font-mono font-bold text-emerald-500/90 break-all select-all leading-relaxed">
                                            {agentCommand}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    asChild
                                    className="h-14 w-full rounded-2xl font-black uppercase tracking-widest text-[10px] border-border hover:bg-muted/50 transition-all shadow-sm"
                                >
                                    <a href="/agent/agent.py" download="agent.py">
                                        <Download size={14} className="mr-2" />
                                        Download Local Bridge (.py)
                                    </a>
                                </Button>

                                <Button
                                    className="h-14 w-full rounded-2xl bg-foreground text-background font-black uppercase tracking-widest text-[10px] hover:opacity-90 active:scale-[0.98] transition-all shadow-xl"
                                    onClick={onClose}
                                >
                                    Confirm and Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
