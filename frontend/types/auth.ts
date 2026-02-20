// Auth-related types

export interface User {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthPayload {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface TokenRefreshPayload {
    accessToken: string;
    refreshToken: string;
}
