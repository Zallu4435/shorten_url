import {
    ApolloClient,
    InMemoryCache,
    HttpLink,
    ApolloLink,
    from,
    Observable,
    FetchResult,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import {
    getAccessToken,
    getRefreshToken,
    setTokens,
    clearTokens,
} from "./auth";
import { REFRESH_TOKEN_MUTATION } from "./graphql/mutations";

const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql/",
});

// Attach JWT access token to every request
const authLink = new ApolloLink((operation, forward) => {
    const token = getAccessToken();
    operation.setContext(({ headers = {} }: { headers: Record<string, string> }) => ({
        headers: {
            ...headers,
            ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
    }));
    return forward(operation);
});

// Handle token expiry — auto-refresh and retry once
const errorLink = onError(({ graphQLErrors, operation, forward }) => {
    if (!graphQLErrors) return;

    for (const err of graphQLErrors) {
        const msg = err.message?.toLowerCase() ?? "";
        const isAuthError =
            msg.includes("not authenticated") ||
            msg.includes("token") ||
            msg.includes("authentication");

        if (isAuthError) {
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                clearTokens();
                if (typeof window !== "undefined") window.location.href = "/login";
                return;
            }

            return new Observable<FetchResult>((observer) => {
                // Use client directly to refresh — no circular import needed here
                const client = new ApolloClient({ link: httpLink, cache: new InMemoryCache() });
                client
                    .mutate<{ refreshToken: { accessToken: string; refreshToken: string } }>({
                        mutation: REFRESH_TOKEN_MUTATION,
                        variables: { refreshToken },
                    })
                    .then(({ data }) => {
                        const tokens = data?.refreshToken;
                        if (!tokens) {
                            clearTokens();
                            if (typeof window !== "undefined") window.location.href = "/login";
                            observer.complete();
                            return;
                        }
                        setTokens(tokens.accessToken, tokens.refreshToken);
                        operation.setContext(({ headers = {} }: { headers: Record<string, string> }) => ({
                            headers: {
                                ...headers,
                                authorization: `Bearer ${tokens.accessToken}`,
                            },
                        }));
                        forward(operation).subscribe(observer);
                    })
                    .catch(() => {
                        clearTokens();
                        if (typeof window !== "undefined") window.location.href = "/login";
                        observer.complete();
                    });
            });
        }
    }
});

const cache = new InMemoryCache({
    typePolicies: {
        Query: {
            fields: {
                myUrls: {
                    keyArgs: ["search", "page", "limit", "orderBy", "isActive", "isPrivate", "isFlagged"],
                    merge(_existing, incoming) {
                        return incoming;
                    },
                },
                allUsers: {
                    keyArgs: ["search", "page", "limit", "orderBy", "isActive", "isAdmin"],
                    merge(_existing, incoming) {
                        return incoming;
                    },
                },
            },
        },
    },
});

const client = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache,
    defaultOptions: {
        watchQuery: { fetchPolicy: "cache-first" },
        query: { fetchPolicy: "cache-first" },
        mutate: { errorPolicy: "all" },
    },
});

export default client;
