"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
    Copy,
    RefreshCw,
    Terminal,
    Trash2,
    Check,
    MoreHorizontal,
    ExternalLink,
    ShieldAlert,
    Activity
} from "lucide-react";
import type { Tunnel } from "@/types/tunnel";
import {
    DELETE_TUNNEL_MUTATION,
    REGENERATE_TOKEN_MUTATION,
    UPDATE_TUNNEL_MUTATION,
    MY_TUNNELS_QUERY,
} from "@/lib/graphql/tunnels";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn, formatBytes } from "@/lib/utils";
import { toast } from "sonner";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";

interface TunnelCardProps {
    tunnel: Tunnel;
    onTokenRegenerated?: (rawToken: string, alias: string, agentCommand: string) => void;
}

export function TunnelCard({ tunnel, onTokenRegenerated }: TunnelCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { copied, copy } = useCopyToClipboard();

    const [deleteTunnel, { loading: deleting }] = useMutation(DELETE_TUNNEL_MUTATION, {
        refetchQueries: [{ query: MY_TUNNELS_QUERY }],
        onCompleted: () => toast.success("Node terminated successfully"),
    });

    const [regenerateToken, { loading: regenerating }] = useMutation(REGENERATE_TOKEN_MUTATION);

    const [updateTunnel, { loading: updating }] = useMutation(UPDATE_TUNNEL_MUTATION, {
        refetchQueries: [{ query: MY_TUNNELS_QUERY }],
    });

    const handleCopy = () => {
        copy(tunnel.publicUrl);
        toast.success("Public URL copied to buffer");
    };

    const handleToggleActive = async () => {
        try {
            await updateTunnel({ variables: { id: tunnel.id, isActive: !tunnel.isActive } });
        } catch {
            toast.error("Failed to reconfigure node status");
        }
    };

    const handleDelete = async () => {
        await deleteTunnel({ variables: { id: tunnel.id } });
        setShowDeleteDialog(false);
    };

    const handleRegenerate = async () => {
        const loadingToast = toast.loading("Regenerating security protocol...");
        try {
            const { data } = await regenerateToken({ variables: { id: tunnel.id } });
            const payload = data?.regenerateTunnelToken;
            if (payload?.error) {
                toast.error(payload.error, { id: loadingToast });
                return;
            }
            if (payload?.rawToken && onTokenRegenerated) {
                onTokenRegenerated(payload.rawToken, tunnel.alias, payload.agentCommand ?? "");
                toast.success("Security token re-issued", { id: loadingToast });
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to regenerate security token", { id: loadingToast });
        }
    };

    const isConnected = tunnel.isConnected && tunnel.isActive;

    return (
        <>
            <div className={cn(
                "flex flex-col md:flex-row md:items-center gap-6 px-8 py-5 group transition-all duration-300 relative overflow-hidden",
                tunnel.isActive ? "hover:bg-muted/40" : "opacity-60 grayscale-[0.6] bg-muted/5 cursor-not-allowed"
            )}>
                {/* Deactivated — subtle left border accent */}
                {!tunnel.isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-muted-foreground/20 rounded-full" />
                )}

                {/* Status Section */}
                <div className="flex items-center gap-4 shrink-0 relative z-10">
                    <Switch
                        checked={tunnel.isActive}
                        onCheckedChange={handleToggleActive}
                        disabled={updating}
                        className="data-[state=checked]:bg-emerald-500"
                    />
                    <div className={cn(
                        "h-2 w-2 rounded-full transition-all duration-500",
                        isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-muted-foreground/30 scale-75"
                    )} />
                </div>

                {/* Main Content: Alias & Endpoint */}
                <div className="min-w-0 flex-1 relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn(
                            "text-lg font-extrabold tracking-tight transition-colors leading-none",
                            tunnel.isActive ? "text-foreground group-hover:text-primary" : "text-muted-foreground cursor-not-allowed"
                        )}>
                            /{tunnel.alias}
                        </h3>
                        {isConnected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 select-none">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                LIVE
                            </span>
                        )}
                        {!tunnel.isActive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground select-none">
                                Disabled
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 max-w-full">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-tighter shrink-0">DST</span>
                        <p className="text-sm font-bold text-muted-foreground truncate font-mono">
                            {tunnel.publicUrl}
                        </p>
                    </div>
                </div>

                {/* Port Info */}
                <div className="hidden lg:flex flex-col items-end shrink-0 min-w-[100px] relative z-10">
                    <div className="flex items-center gap-1.5 text-foreground font-extrabold tabular-nums tracking-tighter">
                        <Terminal size={12} className="text-primary/60" />
                        :{tunnel.localPort}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Local Port</span>
                </div>

                {/* Protocol Info */}
                <div className="hidden xl:flex flex-col items-end shrink-0 min-w-[100px] relative z-10">
                    <span className="text-xs font-bold text-muted-foreground leading-none lowercase italic font-mono">
                        {tunnel.status}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Protocol</span>
                </div>

                {/* Bandwidth Info */}
                <div className="hidden xl:flex flex-col items-end shrink-0 min-w-[100px] relative z-10">
                    <div className="flex items-center gap-1.5 text-foreground font-extrabold tabular-nums tracking-tighter">
                        <Activity size={12} className="text-emerald-500/60" />
                        {formatBytes(tunnel.bandwidthBytes)}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Throughput</span>
                </div>

                {/* Command Bar */}
                <div className="flex items-center gap-1 shrink-0 bg-muted/50 p-1 rounded-xl border border-border relative z-10">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all border-border hover:border-primary/30"
                        onClick={handleCopy}
                        title="Copy to buffer"
                        disabled={!tunnel.isActive}
                    >
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all border-border hover:border-primary/30"
                        asChild
                        disabled={!tunnel.isActive}
                    >
                        <a
                            href={tunnel.isActive ? tunnel.publicUrl : "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Launch"
                            onClick={(event) => !tunnel.isActive && event.preventDefault()}
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={regenerating || deleting}
                                className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg transition-all border-border hover:border-primary/30"
                            >
                                {regenerating ? <RefreshCw className="h-4 w-4 animate-spin text-primary" /> : <MoreHorizontal className="h-4 w-4" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-[24px] border-border shadow-2xl bg-card/95 backdrop-blur-xl">
                            <DropdownMenuItem
                                onClick={handleRegenerate}
                                disabled={regenerating}
                                className="rounded-xl px-3 py-2.5 cursor-pointer focus:bg-muted font-bold text-sm"
                            >
                                <RefreshCw className={cn("mr-3 h-4 w-4 text-primary", regenerating && "animate-spin")} />
                                Regenerate Token
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1.5 mx-1" />
                            <DropdownMenuItem
                                className="rounded-xl px-3 py-2.5 cursor-pointer focus:bg-red-500/10 text-red-500 focus:text-red-600 font-bold text-sm group"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
                                Terminate Node
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Termination Dialogue */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md rounded-[32px] border-red-500/20 bg-card shadow-2xl p-0 overflow-hidden">
                    <div className="p-8 space-y-6">
                        <DialogHeader className="space-y-4">
                            <TechnicalIndicator label="Terminal Operation" icon={ShieldAlert} color="red" className="mb-0" />
                            <DialogTitle className="text-2xl font-black tracking-tighter text-foreground leading-none">
                                Terminate Node?
                            </DialogTitle>
                            <DialogDescription className="text-sm font-bold text-muted-foreground leading-relaxed mt-2">
                                Confirm decommissioning of node <span className="font-mono text-foreground font-bold bg-muted px-1.5 py-0.5 rounded">/{tunnel.alias}</span>. This will permanently sever the neural uplink and revoke all credentials.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex-col sm:flex-col gap-3">
                            <Button
                                variant="destructive"
                                className="h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] w-full shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-[0.98]"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? "Terminating..." : "Confirm Termination"}
                            </Button>
                            <Button
                                variant="outline"
                                className="h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] w-full border-border/60 bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all focus-visible:ring-0 active:scale-[0.98] shadow-sm"
                                onClick={() => setShowDeleteDialog(false)}
                                disabled={deleting}
                            >
                                Retain Node
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
