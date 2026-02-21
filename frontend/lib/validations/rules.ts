import { z } from "zod";

/**
 * Technical Architecture: Shared Validation Rules
 * Source of Truth: backend/apps/users/services.py
 * 
 * Rules:
 * - Username: 3-50 chars, alphanumeric + underscores + hyphens, cannot start/end with delimiter.
 * - Password: Min 8 chars, 1 Upper, 1 Lower, 1 Number.
 */

export const usernameRules = z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(
        /^[a-zA-Z0-9][a-zA-Z0-9_\-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/,
        "Username can only contain letters, numbers, underscores, and hyphens, and cannot start or end with a symbol"
    );

export const passwordComplexityRules = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number");
