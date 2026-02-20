// JWT + localStorage helpers
const ACCESS_TOKEN_KEY = "su_access_token";
const REFRESH_TOKEN_KEY = "su_refresh_token";

export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export interface JWTPayload {
    user_id: string;
    email: string;
    username: string;
    is_admin: boolean;
    exp: number;
    iat: number;
}

export function decodeToken(token: string): JWTPayload | null {
    try {
        const base64Payload = token.split(".")[1];
        if (!base64Payload) return null;
        const decoded = JSON.parse(atob(base64Payload));
        return decoded as JWTPayload;
    } catch {
        return null;
    }
}

export function isTokenExpired(token: string): boolean {
    const decoded = decodeToken(token);
    if (!decoded) return true;
    // Add 10s buffer
    return Date.now() / 1000 >= decoded.exp - 10;
}

export function isAuthenticated(): boolean {
    const token = getAccessToken();
    if (!token) return false;
    return !isTokenExpired(token);
}
