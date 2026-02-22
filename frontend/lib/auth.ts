// Auth helpers using cookies
// Note: access_token and refresh_token are HttpOnly — the browser sends them
// automatically and they can only be fully cleared by the backend (via Set-Cookie
// with Max-Age=0 in the logout response). JS can clear all other visible cookies.

export function isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    // We check for a lightweight marker cookie that JS CAN see.
    // The backend sets this alongside the HttpOnly tokens on login.
    return document.cookie.includes("is_logged_in=true");
}

/** Expire a single cookie by name across root and common sub-paths. */
function expireCookie(name: string): void {
    const past = "Thu, 01 Jan 1970 00:00:01 GMT";
    // Try both with and without explicit domain to cover all cases
    for (const path of ["/", ""]) {
        document.cookie = `${name}=; path=${path}; expires=${past}; SameSite=Lax`;
        document.cookie = `${name}=; path=${path}; expires=${past}; SameSite=None; Secure`;
    }
}

/**
 * Clear all JS-visible session cookies.
 * HttpOnly cookies (access_token, refresh_token) are also attempted here
 * — the browser will silently ignore these attempts, but the backend will
 * clear them properly when the /login redirect triggers a new session.
 */
export function clearTokens(): void {
    if (typeof window === "undefined") return;
    expireCookie("is_logged_in");
    expireCookie("csrftoken");
    // These are HttpOnly — JS cannot clear them, but we attempt anyway
    // so that on non-HttpOnly dev setups they are removed too.
    expireCookie("access_token");
    expireCookie("refresh_token");
}

