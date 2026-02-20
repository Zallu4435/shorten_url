"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AppLoading } from "@/components/shared/AppLoading";

interface AuthGuardProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
    const { user, loading, isLoggedIn, isLoggingOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading || isLoggingOut) return;
        if (!isLoggedIn) {
            router.replace("/login");
            return;
        }
        if (requireAdmin && !user?.isAdmin) {
            router.replace("/dashboard");
        }
    }, [loading, isLoggedIn, user, requireAdmin, isLoggingOut, router]);

    // Show full-screen loader while auth resolves
    if (loading) {
        return <AppLoading message="Synchronizing..." />;
    }

    // Show loading during logout
    if (isLoggingOut) {
        return <AppLoading message="Signing out safely..." />;
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
