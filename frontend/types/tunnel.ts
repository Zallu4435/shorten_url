// Tunnel-related TypeScript types

export type TunnelStatus = "connected" | "disconnected" | "error";

export interface Tunnel {
    id: string;
    alias: string;
    status: TunnelStatus;
    localPort?: number;
    isActive: boolean;
    publicUrl: string;
    isConnected: boolean;
    bandwidthBytes: number;
    lastConnectedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTunnelPayload {
    tunnel?: Tunnel;
    rawToken?: string;
    tokenHint?: string;
    agentCommand?: string;
    error?: string;
}

export interface RegenerateTokenPayload {
    rawToken?: string;
    tokenHint?: string;
    agentCommand?: string;
    error?: string;
}

export interface CreateTunnelInput {
    alias: string;
    localPort?: number;
}
