"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
    const { user, loading, isLoggedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!isLoggedIn) {
            router.replace("/login");
            return;
        }
        if (requireAdmin && !user?.isAdmin) {
            router.replace("/dashboard");
        }
    }, [loading, isLoggedIn, user, requireAdmin, router]);

    // Show full-screen loader while auth resolves
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
                </div>
            </div>
        );
    }

    // Not logged in — render nothing while redirect fires
    if (!isLoggedIn) return null;

    // Admin guard
    if (requireAdmin && !user?.isAdmin) return null;

    return <>{children}</>;
}

// Hook version for inline use
export function useRequireAuth() {
    const { user, loading, isLoggedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isLoggedIn) {
            router.replace("/login");
        }
    }, [loading, isLoggedIn, router]);

    return { user, loading };
}
