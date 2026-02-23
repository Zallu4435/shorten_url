"use client";

import { useEffect, useRef } from "react";
import { useApolloClient } from "@apollo/client";
import { MY_TUNNELS_QUERY } from "@/lib/graphql/tunnels";
import { toast } from "sonner";

/**
 * Hook to synchronize tunnel status in real-time via WebSocket.
 * Listens for connect/disconnect events and updates the Apollo cache.
 */
export function useTunnelStatusSync(token?: string) {
    const client = useApolloClient();
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const tokenRef = useRef<string | undefined>(token);

    // Keep token ref up to date so reconnects use the latest "ticket"
    useEffect(() => {
        tokenRef.current = token;
    }, [token]);

    useEffect(() => {
        // Only attempt connection if we have a token
        if (!token) return;
        let shouldReconnect = true;

        // If a connection is already alive or in progress, we stick with it.
        // This is the "token-stable" lock that prevents 10s-interval flickering.
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql/";
        const backendHost = graphqlUrl.replace(/^http(s)?:\/\//, "").split("/")[0];
        const host = process.env.NEXT_PUBLIC_WS_URL || backendHost;

        function connect() {
            if (!shouldReconnect || !tokenRef.current) return;

            // Simple de-duplication: if a connection is already active or in progress, don't try to open another.
            if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
                return;
            }

            const wsUrl = `${protocol}//${host}/ws/tunnel-status/?token=${tokenRef.current}`;
            console.log("SYNC_UPLINK: Handshaking with matrix...");

            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("SYNC_UPLINK: Secure connection established.");
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "status_update") {
                        const { alias, status } = data;

                        if (status === "disconnected") {
                            toast.error(`Node ${alias} went offline`, {
                                description: "The agent connection was severed."
                            });
                        } else if (status === "connected") {
                            toast.success(`Node ${alias} is now live`, {
                                description: "Secure uplink established."
                            });
                        }

                        // Trigger a refetch of the tunnels list to ensure UI is in sync
                        client.refetchQueries({
                            include: [MY_TUNNELS_QUERY],
                        });
                    }
                } catch (err) {
                    console.error("SYNC_UPLINK: Failed to parse status update", err);
                }
            };

            ws.onerror = () => {
                if (shouldReconnect) {
                    console.error("SYNC_UPLINK: Connection error encountered. The status bridge is offline or rejected.");
                }
            };

            ws.onclose = (event) => {
                wsRef.current = null;
                if (shouldReconnect) {
                    console.log(`SYNC_UPLINK: Connection severed (code=${event.code}). Re-routing in 5s...`);
                    reconnectTimeoutRef.current = setTimeout(connect, 5000);
                }
            };
        }

        connect();

        return () => {
            shouldReconnect = false;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client, !!token]); // Only restart if token existence changes, not value
}
