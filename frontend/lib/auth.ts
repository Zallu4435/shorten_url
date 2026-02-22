// Auth helpers using cookies
// Note: Actual JWTs are HttpOnly and managed by the browser.

export function isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    // We check for a lightweight marker cookie that JS CAN see.
    // The backend should set this alongside the HttpOnly tokens.
    // Fallback: This will return true if we have any indicator of login.
    return document.cookie.includes("is_logged_in=true");
}

export function clearTokens(): void {
    // This helper is now mostly a no-op as the backend clears cookies.
    // But we clear the JS marker if it exists.
    if (typeof window !== "undefined") {
        document.cookie = "is_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }
}
