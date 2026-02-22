import {
    ApolloClient,
    InMemoryCache,
    HttpLink,
    from,
    Observable,
    FetchResult,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { clearTokens, isAuthenticated } from "./auth";

const GRAPHQL_URL =
    process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql/";

const httpLink = new HttpLink({
    uri: GRAPHQL_URL,
    credentials: "include", // Essential for sending/receiving HttpOnly cookies
});

// ─── Token Refresh State ───────────────────────────────────────────────────
// Module-level flags so ALL concurrent 401 failures share the same refresh
// attempt. Resolvers queued here are replayed once the refresh succeeds.
let isRefreshing = false;
let pendingRequests: Array<() => void> = [];

/**
 * Queue a callback to run after the in-progress refresh completes.
 * If no refresh is happening, execute immediately.
 */
function queueRequest(callback: () => void): Promise<void> {
    return new Promise((resolve) => {
        pendingRequests.push(() => {
            callback();
            resolve();
        });
    });
}

function resolvePendingRequests() {
    pendingRequests.forEach((cb) => cb());
    pendingRequests = [];
}

function rejectPendingRequests() {
    pendingRequests = [];
}

// ─── Refresh Helper ────────────────────────────────────────────────────────
/**
 * Calls the refreshToken mutation via a plain fetch (not Apollo) to avoid
 * creating a recursive loop through the errorLink.
 * The backend reads the refresh_token HttpOnly cookie automatically and
 * sets new access_token + refresh_token cookies in the response.
 */
async function doRefreshToken(): Promise<boolean> {
    try {
        const res = await fetch(GRAPHQL_URL, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: `mutation RefreshToken { refreshToken { accessToken } }`,
            }),
        });

        const json = await res.json();

        // GraphQL errors from the refresh itself (e.g. expired refresh token)
        if (json?.errors?.length || !json?.data?.refreshToken) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

// ─── Error Link ────────────────────────────────────────────────────────────
/**
 * Intercepts GraphQL authentication errors caused by an expired access token.
 * Attempts a single token refresh, then replays all queued operations.
 * If the refresh fails, clears the session and redirects to login.
 */
const errorLink = onError(({ graphQLErrors, operation, forward }) => {
    if (!graphQLErrors) return;

    // Detect authentication errors using the reliable machine-readable `code`
    // set by the backend on every AuthenticationError → extensions.code = "UNAUTHENTICATED".
    // This is far more robust than substring-matching the human-readable message,
    // which differs across error types (AuthenticationError, TokenExpiredError, etc.).
    // We intentionally do NOT match "FORBIDDEN" (403 / PermissionDeniedError) — those
    // mean the user IS authenticated but lacks permission, so refreshing won't help.
    const hasAuthError = graphQLErrors.some((err) => {
        const code = (err.extensions?.code as string) ?? "";
        return code === "UNAUTHENTICATED";
    });

    if (!hasAuthError) return;

    // Skip if the user isn't even supposed to be logged in
    if (!isAuthenticated()) {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            window.location.href = "/login";
        }
        return;
    }

    return new Observable<FetchResult>((observer) => {
        if (isRefreshing) {
            // Another request is already doing the refresh.
            // Queue this operation to be retried once the refresh resolves.
            queueRequest(() => {
                forward(operation).subscribe(observer);
            });
            return;
        }

        isRefreshing = true;

        doRefreshToken().then((success) => {
            isRefreshing = false;

            if (success) {
                // Replay all queued operations (including this one)
                resolvePendingRequests();
                forward(operation).subscribe(observer);
            } else {
                // Refresh token is also expired or invalid — force logout
                rejectPendingRequests();
                clearTokens();
                observer.error(new Error("Session expired. Please log in again."));
                if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login";
                }
            }
        });
    });
});

// ─── Cache ─────────────────────────────────────────────────────────────────
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

// ─── Client ────────────────────────────────────────────────────────────────
const client = new ApolloClient({
    link: from([errorLink, httpLink]),
    cache,
    defaultOptions: {
        watchQuery: { fetchPolicy: "cache-first" },
        query: { fetchPolicy: "cache-first" },
        mutate: { errorPolicy: "all" },
    },
});

export default client;
