"use client";

import { useState } from "react";
import { X, Copy, Check, Terminal, Download, Sparkles, ShieldAlert, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { toast } from "sonner";
import { Portal } from "@/components/shared/Portal";

interface TokenRevealModalProps {
    title?: string;
    description?: string;
    rawToken: string;
    alias: string;
    onClose: () => void;
}

export function TokenRevealModal({
    title = "Access Granted",
    description = "Node credentials established. Secure your token to complete the neural uplink.",
    rawToken,
    alias,
    onClose
}: TokenRevealModalProps) {
    const [platform, setPlatform] = useState<"python" | "node">("python");
    const tokenCopy = useCopyToClipboard();
    const cmdCopy = useCopyToClipboard();

    const pythonCmd = `curl -sSL ${window.location.origin}/agent/agent.py -o agent.py && python3 agent.py --alias ${alias} --token ${rawToken}`;
    const nodeCmd = `curl -sSL ${window.location.origin}/agent/agent.js -o agent.js && node agent.js --alias ${alias} --token ${rawToken}`;

    const activeCmd = platform === "python" ? pythonCmd : nodeCmd;

    const handleCopyToken = () => {
        tokenCopy.copy(rawToken);
        toast.success("Security token copied to buffer");
    };

    const handleCopyCmd = () => {
        cmdCopy.copy(activeCmd);
        toast.success("One-liner command copied to buffer");
    };

    return (
        <Portal>
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <Card className="relative w-full max-w-[480px] max-h-[90vh] rounded-[32px] border-border bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                    {/* Fixed Header */}
                    <div className="bg-muted/30 p-5 border-b border-border/50 shrink-0">
                        <div className="flex items-center justify-between mb-3.5">
                            <TechnicalIndicator
                                label="Credentials Secured"
                                icon={Sparkles}
                                color="emerald"
                                className="mb-0"
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={onClose}>
                                <X size={16} />
                            </Button>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-xl font-bold tracking-tight text-foreground leading-tight">
                                {title}
                            </h2>
                            <p className="text-[12px] font-medium text-muted-foreground/70 tracking-tight leading-relaxed line-clamp-2">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Scrollable Body */}
                    <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-5">
                            <div className="space-y-5">
                                {/* Token Field */}
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-1 flex items-center gap-2">
                                        <KeyRound size={12} className="text-emerald-500" />
                                        Secret Access Token
                                    </Label>
                                    <div className="group relative">
                                        <div className="flex items-center gap-3 bg-muted/40 border border-border/40 rounded-xl p-3.5 transition-all hover:bg-muted/60">
                                            <code className="text-xs font-mono font-medium text-foreground flex-1 break-all select-all">
                                                {rawToken}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:text-emerald-500 hover:bg-emerald-500/10 shrink-0 transition-all"
                                                onClick={handleCopyToken}
                                            >
                                                {tokenCopy.copied ? <Check size={14} /> : <Copy size={14} />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 px-1">
                                        <ShieldAlert size={12} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[10.5px] font-medium text-muted-foreground/50 leading-tight">
                                            This token is highly volatile and <span className="text-amber-600 font-bold">WILL NOT BE DISPLAYED AGAIN</span>. Store it securely.
                                        </p>
                                    </div>
                                </div>

                                {/* Command Field */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
                                            <Terminal size={12} className="text-primary" />
                                            One-Liner Bridge Command
                                        </Label>
                                        <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/40">
                                            <button
                                                onClick={() => setPlatform("python")}
                                                className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${platform === "python" ? "bg-background text-primary shadow-sm" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
                                            >
                                                Python
                                            </button>
                                            <button
                                                onClick={() => setPlatform("node")}
                                                className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${platform === "node" ? "bg-background text-primary shadow-sm" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
                                            >
                                                Node.js
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-950 border border-white/5 shadow-2xl rounded-xl p-3.5 flex flex-col gap-3 relative overflow-hidden group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-1.5">
                                                <div className="h-2 w-2 rounded-full bg-red-500/15 border border-red-500/20" />
                                                <div className="h-2 w-2 rounded-full bg-amber-500/15 border border-amber-500/20" />
                                                <div className="h-2 w-2 rounded-full bg-emerald-500/15 border border-emerald-500/20" />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 rounded-lg bg-white/5 text-[9px] font-bold text-white/50 hover:text-white hover:bg-white/10 shrink-0 transition-all uppercase tracking-widest"
                                                onClick={handleCopyCmd}
                                            >
                                                {cmdCopy.copied ? <Check size={10} className="mr-1" /> : <Copy size={10} className="mr-1" />}
                                                {cmdCopy.copied ? "Copied" : "Copy"}
                                            </Button>
                                        </div>
                                        <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                            <code className="text-[11px] font-mono font-medium text-emerald-400/90 break-all select-all leading-relaxed">
                                                {activeCmd}
                                            </code>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-medium text-muted-foreground/30 px-1">
                                        Downloads the bridge and starts the tunnel automatically.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    {/* Fixed Footer */}
                    <div className="p-5 border-t border-border/50 bg-muted/20 shrink-0">
                        <div className="flex flex-col gap-2.5">
                            <Button
                                variant="outline"
                                asChild
                                className="h-11 w-full rounded-xl font-bold uppercase tracking-widest text-[10px] border-border/50 hover:bg-muted/50 transition-all shadow-sm"
                            >
                                <a href={platform === "python" ? "/agent/agent.py" : "/agent/agent.js"} download={platform === "python" ? "agent.py" : "agent.js"}>
                                    <Download size={14} className="mr-2" />
                                    Manual {platform === "python" ? "Python" : "Node.js"} Download
                                </a>
                            </Button>

                            <Button
                                className="h-11 w-full rounded-xl bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
                                onClick={onClose}
                            >
                                Confirm and Close
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </Portal>
    );
}
