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
    clearTokens,
    isAuthenticated,
} from "./auth";
import { REFRESH_TOKEN_MUTATION } from "./graphql/mutations";

const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql/",
    credentials: "include", // Essential for sending/receiving cookies
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
            // If we're not even supposed to be logged in, don't try to refresh
            if (!isAuthenticated()) {
                if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
                    // window.location.href = "/login"; // Optional: only redirect if access is strictly required
                }
                return;
            }

            // Prevent multiple simultaneous refresh attempts for the same request
            if (operation.getContext()._isRefreshing) return;
            operation.setContext({ _isRefreshing: true });

            // ... (rest of the logic)

            return new Observable<FetchResult>((observer) => {
                const client = new ApolloClient({ link: httpLink, cache: new InMemoryCache() });
                client
                    .mutate<{ refreshToken: { accessToken: string; refreshToken: string } }>({
                        mutation: REFRESH_TOKEN_MUTATION,
                    })
                    .then(({ data }) => {
                        if (!data?.refreshToken) {
                            throw new Error("No refresh token data");
                        }
                        // Retry original operation
                        forward(operation).subscribe(observer);
                    })
                    .catch(() => {
                        // If refresh fails, clear everything and go to login
                        clearTokens();
                        if (typeof window !== "undefined") {
                            // Only redirect if we're not already on the login page
                            if (!window.location.pathname.startsWith("/login")) {
                                window.location.href = "/login";
                            }
                        }
                        observer.complete();
                    });
            });
        }
    }
});

const cache = new InMemoryCache({
    // ... (rest of cache config remains same)
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
    link: from([errorLink, httpLink]), // AuthLink removed — cookies handled automatically
    cache,
    defaultOptions: {
        watchQuery: { fetchPolicy: "cache-first" },
        query: { fetchPolicy: "cache-first" },
        mutate: { errorPolicy: "all" },
    },
});

export default client;
