"use client";

import { ApolloProvider } from "@apollo/client";
import client from "@/lib/apollo";
import { AuthProvider } from "@/context/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ApolloProvider client={client}>
            <AuthProvider>{children}</AuthProvider>
        </ApolloProvider>
    );
}
