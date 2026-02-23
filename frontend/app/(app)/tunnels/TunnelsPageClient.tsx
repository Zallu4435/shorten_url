"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { Plus, Plug, Server, SlidersHorizontal, Power, PlugZap } from "lucide-react";
import { MY_TUNNELS_QUERY } from "@/lib/graphql/tunnels";
import { TunnelCard } from "@/components/tunnels/TunnelCard";
import { CreateTunnelModal } from "@/components/tunnels/CreateTunnelModal";
import type { Tunnel } from "@/types/tunnel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageLoading } from "@/components/shared/PageLoading";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyTerminal } from "@/components/shared/EmptyTerminal";
import { SearchInput } from "@/components/shared/SearchInput";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { TokenRevealModal } from "@/components/tunnels/TokenRevealModal";
import { useDebounce } from "@/hooks/useDebounce";
import { useTunnelStatusSync } from "@/hooks/useTunnelStatusSync"; // Import hook
import { cn } from "@/lib/utils";

interface RegeneratedToken {
    rawToken: string;
    alias: string;
    agentCommand: string;
}

const FILTER_OPTIONS = [
    { label: "All Nodes", value: "all" },
    { label: "Live Uplinks", value: "live" },
    { label: "Offline Nodes", value: "offline" },
];

export function TunnelsPageClient() {
    const [showCreate, setShowCreate] = useState(false);
    const [regeneratedToken, setRegeneratedToken] = useState<RegeneratedToken | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const debouncedSearch = useDebounce(searchQuery, 400);

    const variables = useMemo(() => ({
        search: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
    }), [debouncedSearch, statusFilter]);

    const { data, previousData, loading, error } = useQuery(MY_TUNNELS_QUERY, {
        variables,
        pollInterval: 30000,
        fetchPolicy: "cache-and-network",
    });

    const displayData = data ?? previousData;
    const tunnels: Tunnel[] = displayData?.myTunnels ?? [];
    const wsToken = displayData?.websocketToken;
    const connectedCount = tunnels.filter((t) => t.isConnected).length;

    // Initialize real-time status listener with ticket-based auth
    useTunnelStatusSync(wsToken);

    const isFirstLoad = loading && !previousData && !data;
    const isRefetching = loading && !!displayData;

    const handleTokenRegenerated = (rawToken: string, alias: string, agentCommand: string) => {
        setRegeneratedToken({ rawToken, alias, agentCommand });
    };

    if (isFirstLoad) {
        return <PageLoading message="RETRIEVING NETWORK REGISTRY..." className="min-h-[600px]" />;
    }

    return (
        <div className="w-full max-w-[1400px] mx-auto space-y-12 py-6 px-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* ── Header ── */}
            <PageHeader
                title="My Tunnels"
                description="Manage and track your private network nodes."
                icon={Server}
                stats={{
                    label: "Active Uplinks",
                    value: connectedCount,
                    unit: "NODES"
                }}
            >
                <Button
                    onClick={() => setShowCreate(true)}
                    className="rounded-xl h-11 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[11px] hover:opacity-90 transition-all shadow-lg shadow-primary/20 border border-primary/20 active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4 stroke-[3px]" />
                    Initialize Node
                </Button>
            </PageHeader>

            {/* ── Toolbar Area ── */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <SearchInput
                    placeholder="Search nodes by alias…"
                    value={searchQuery}
                    onChange={setSearchQuery}
                    className="flex-1"
                />
                <FilterSelect
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    options={FILTER_OPTIONS}
                    icon={statusFilter === "live" ? PlugZap : statusFilter === "offline" ? Power : SlidersHorizontal}
                    className="w-full md:w-52"
                />
            </div>

            {/* ── Modals & Revelation ── */}
            {regeneratedToken && (
                <TokenRevealModal
                    title="Credentials Re-Issued"
                    description="Your node security protocol has been reconfigured. Update your local agent with the new master key."
                    rawToken={regeneratedToken.rawToken}
                    alias={regeneratedToken.alias}
                    onClose={() => setRegeneratedToken(null)}
                />
            )}

            {/* ── Content Area ── */}
            <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden relative">
                {/* Thin loading bar at top of card — only during refetch, not initial load */}
                {isRefetching && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-border overflow-hidden z-20">
                        <div className="h-full bg-primary animate-[loading-bar_1s_ease-in-out_infinite]" style={{ width: '40%', animation: "slide 1.2s ease-in-out infinite" }} />
                    </div>
                )}

                {error && (
                    <div className="p-20 text-center">
                        <h3 className="text-xl font-black text-destructive tracking-tighter mb-2 font-mono uppercase">Sync Collision</h3>
                        <p className="text-sm font-bold text-muted-foreground/60 mb-6 font-mono">Failed to retrieve tunnels from network grid.</p>
                        <Button variant="outline" onClick={() => window.location.reload()} className="rounded-xl font-black uppercase tracking-widest text-[10px] h-11 px-6 border-destructive/20 hover:bg-destructive/10">
                            Retry
                        </Button>
                    </div>
                )}

                <div className={cn(
                    "divide-y divide-border transition-opacity duration-300",
                    isFirstLoad && "opacity-60 pointer-events-none"
                )}>
                    {tunnels.length === 0 && !loading && !error ? (
                        <div className="p-16 text-center">
                            <EmptyTerminal
                                title={debouncedSearch || statusFilter !== "all" ? "No Result Discovered" : "No Nodes Active"}
                                description={debouncedSearch || statusFilter !== "all"
                                    ? "Try adjusting your search or filters to locate entry points."
                                    : "Initialize your first uplink node to bridge traffic to the matrix."}
                                icon={Plug}
                                actionLabel={!debouncedSearch && statusFilter === "all" ? "Initialize Node" : undefined}
                                onClick={!debouncedSearch && statusFilter === "all" ? () => setShowCreate(true) : undefined}
                            />
                        </div>
                    ) : (
                        tunnels.map((tunnel) => (
                            <TunnelCard
                                key={tunnel.id}
                                tunnel={tunnel}
                                onTokenRegenerated={(rawToken, alias, agentCommand) =>
                                    handleTokenRegenerated(rawToken, alias, agentCommand)
                                }
                            />
                        ))
                    )}
                </div>
            </Card>

            {/* Protocol Branding */}
            <div className="pt-20 pb-10 flex flex-col items-center gap-4 opacity-5">
                <div className="flex items-center gap-3">
                    <div className="h-px w-6 bg-border" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground font-mono">
                        Shorten URL Matrix Architecture
                    </span>
                    <div className="h-px w-6 bg-border" />
                </div>
            </div>

            {showCreate && <CreateTunnelModal onClose={() => setShowCreate(false)} />}
        </div>
    );
}
