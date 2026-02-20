"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import {
    useMutation,
    useApolloClient,
    ApolloQueryResult,
} from "@apollo/client";
import { ME_QUERY } from "@/lib/graphql/queries";
import {
    LOGIN_MUTATION,
    REGISTER_MUTATION,
    LOGOUT_MUTATION,
} from "@/lib/graphql/mutations";
import {
    setTokens,
    clearTokens,
    getRefreshToken,
    isAuthenticated,
} from "@/lib/auth";
import type { User } from "@/types";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isLoggedIn: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoggingOut: boolean;
    refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const apolloClient = useApolloClient();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const [loginMutation] = useMutation(LOGIN_MUTATION);
    const [registerMutation] = useMutation(REGISTER_MUTATION);
    const [logoutMutation] = useMutation(LOGOUT_MUTATION);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const result: ApolloQueryResult<{ me: User }> = await apolloClient.query({
                query: ME_QUERY,
                fetchPolicy: "network-only",
            });
            if (result.data?.me) setUser(result.data.me);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [apolloClient]);

    // On mount: restore session if token is still valid
    useEffect(() => {
        if (isAuthenticated()) {
            fetchCurrentUser();
        } else {
            setLoading(false);
        }
    }, [fetchCurrentUser]);

    const login = useCallback(
        async (email: string, password: string) => {
            const { data, errors } = await loginMutation({
                variables: { email, password },
            });
            if (errors?.length) throw new Error(errors[0].message);
            if (!data?.login) throw new Error("Login failed");
            const { accessToken, refreshToken, user: loggedInUser } = data.login;
            setTokens(accessToken, refreshToken);
            setUser(loggedInUser);
        },
        [loginMutation]
    );

    const register = useCallback(
        async (email: string, username: string, password: string) => {
            const { data, errors } = await registerMutation({
                variables: { email, username, password },
            });
            if (errors?.length) throw new Error(errors[0].message);
            if (!data?.register) throw new Error("Registration failed");
            const { accessToken, refreshToken, user: newUser } = data.register;
            setTokens(accessToken, refreshToken);
            setUser(newUser);
        },
        [registerMutation]
    );

    const logout = useCallback(async () => {
        setIsLoggingOut(true);
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            try {
                await logoutMutation({ variables: { refreshToken } });
            } catch {
                // Always clear locally even if server call fails
            }
        }
        clearTokens();
        setUser(null);
        await apolloClient.clearStore();
        setIsLoggingOut(false);
    }, [logoutMutation, apolloClient]);

    const refetchUser = useCallback(() => {
        if (isAuthenticated()) fetchCurrentUser();
    }, [fetchCurrentUser]);

    return (
        <AuthContext.Provider
            value={{ user, loading, isLoggedIn: !!user, login, register, logout, isLoggingOut, refetchUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
