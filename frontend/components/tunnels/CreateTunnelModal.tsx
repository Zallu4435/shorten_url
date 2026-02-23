"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { X, Copy, Check, Terminal, Download, Plus, Sparkles, ShieldAlert, KeyRound, Network } from "lucide-react";
import { CREATE_TUNNEL_MUTATION, MY_TUNNELS_QUERY } from "@/lib/graphql/tunnels";
import type { CreateTunnelPayload } from "@/types/tunnel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

interface CreateTunnelModalProps {
    onClose: () => void;
    onTokenRevealed?: (rawToken: string, agentCommand: string) => void;
}

type Step = "form" | "token";

export function CreateTunnelModal({ onClose, onTokenRevealed }: CreateTunnelModalProps) {
    const [step, setStep] = useState<Step>("form");
    const [alias, setAlias] = useState("");
    const [localPort, setLocalPort] = useState("3000");
    const [formError, setFormError] = useState("");
    const [payload, setPayload] = useState<CreateTunnelPayload | null>(null);

    const tokenCopy = useCopyToClipboard();
    const cmdCopy = useCopyToClipboard();

    const [createTunnel, { loading }] = useMutation(CREATE_TUNNEL_MUTATION, {
        refetchQueries: [{ query: MY_TUNNELS_QUERY }],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!alias.trim()) {
            setFormError("Alias is required to identify your node.");
            return;
        }

        try {
            const { data } = await createTunnel({
                variables: {
                    alias: alias.trim().toLowerCase(),
                    localPort: localPort ? parseInt(localPort, 10) : undefined,
                },
            });

            const result: CreateTunnelPayload = data?.createTunnel;
            if (result?.error) {
                setFormError(result.error);
                return;
            }

            setPayload(result);
            setStep("token");
            onTokenRevealed?.(result.rawToken ?? "", result.agentCommand ?? "");
            toast.success("Tunnel node initialized");
        } catch (err: any) {
            setFormError(err.message);
        }
    };

    const handleCopyToken = () => {
        if (payload?.rawToken) {
            tokenCopy.copy(payload.rawToken);
            toast.success("Security token copied to buffer");
        }
    };

    const handleCopyCmd = () => {
        if (payload?.agentCommand) {
            cmdCopy.copy(payload.agentCommand);
            toast.success("Startup command copied to buffer");
        }
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
                                label={step === "form" ? "Node Configuration" : "Uplink Secure"}
                                icon={step === "form" ? Plus : Sparkles}
                                color={step === "form" ? "primary" : "emerald"}
                                className="mb-0"
                            />
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-background/80" onClick={onClose}>
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight text-foreground leading-none">
                                {step === "form" ? "Initialize Node" : "Access Granted"}
                            </h2>
                            <p className="text-sm font-bold text-muted-foreground/60 tracking-tight leading-relaxed">
                                {step === "form"
                                    ? "Create a secure tunnel to expose your local environment to the public web."
                                    : "Node established. Secure your credentials to complete the neural uplink."}
                            </p>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* ── Step 1: Form ── */}
                        {step === "form" && (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="space-y-5">
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Public Alias</Label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground/20 tracking-tight pointer-events-none group-focus-within:text-primary/40">
                                                tunnels.matrix/
                                            </div>
                                            <Input
                                                className="h-14 pl-[112px] rounded-2xl border-border bg-muted/20 focus:bg-background focus:ring-primary/10 transition-all font-bold text-base tracking-tight text-foreground"
                                                placeholder="my-project"
                                                value={alias}
                                                onChange={(e) => setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                                autoFocus
                                                maxLength={30}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Local Port</Label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                <Network size={16} className="text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                                            </div>
                                            <Input
                                                className="h-14 pl-12 rounded-2xl border-border bg-muted/20 focus:bg-background focus:ring-primary/10 transition-all font-bold text-base tracking-tight text-foreground"
                                                type="number"
                                                placeholder="3000"
                                                value={localPort}
                                                onChange={(e) => setLocalPort(e.target.value)}
                                                min={1}
                                                max={65535}
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold text-muted-foreground/40 ml-1 tracking-tight">
                                            Default is <span className="text-primary/60">3000</span> (Next.js) or <span className="text-primary/60">5173</span> (Vite).
                                        </p>
                                    </div>
                                </div>

                                {formError && (
                                    <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 text-[11px] font-bold flex items-center gap-2.5 animate-in slide-in-from-top-1">
                                        <ShieldAlert size={14} />
                                        {formError}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="h-14 w-full rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all pt-1"
                                    disabled={loading}
                                >
                                    {loading ? "Initializing..." : "Establish Uplink"}
                                </Button>
                            </form>
                        )}

                        {/* ── Step 2: Token reveal ── */}
                        {step === "token" && payload && (
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                                        <KeyRound size={12} className="text-emerald-500" />
                                        Secret Access Token
                                    </Label>
                                    <div className="group relative">
                                        <div className="flex items-center gap-3 bg-muted/40 border-border rounded-2xl p-4 transition-all hover:bg-muted/60">
                                            <code className="text-xs font-mono font-bold text-foreground flex-1 break-all select-all">
                                                {payload.rawToken}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg border-border hover:text-emerald-500 hover:bg-emerald-500/10 shrink-0 transition-all"
                                                onClick={handleCopyToken}
                                            >
                                                {tokenCopy.copied ? <Check size={14} /> : <Copy size={14} />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5 px-1">
                                        <ShieldAlert size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] font-bold text-muted-foreground/60 leading-tight">
                                            This token is volatile and <span className="text-amber-500 uppercase font-black">will not be shown again</span>.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
                                        <Terminal size={12} className="text-primary" />
                                        Startup Instruction
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
                                                {payload.agentCommand}
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="h-14 w-full rounded-2xl font-black uppercase tracking-widest text-[10px] border-border hover:bg-muted/50 transition-all"
                                    >
                                        <a href="/agent/agent.py" download="agent.py">
                                            <Download size={14} className="mr-2" />
                                            Download Agent Utility (.py)
                                        </a>
                                    </Button>

                                    <Button
                                        className="h-14 w-full rounded-2xl bg-foreground text-background font-black uppercase tracking-widest text-[10px] hover:opacity-90 active:scale-[0.98] transition-all"
                                        onClick={onClose}
                                    >
                                        Close and Monitor Node
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
