import { z } from "zod";
import { usernameRules, passwordComplexityRules } from "./rules";

// ─── Login ─────────────────────────────────────────────────
export const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

export type LoginValues = z.infer<typeof loginSchema>;

// ─── Register ──────────────────────────────────────────────
export const registerSchema = z
    .object({
        email: z.string().email("Please enter a valid email address"),
        username: usernameRules,
        password: passwordComplexityRules,
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export type RegisterValues = z.infer<typeof registerSchema>;

// ─── Forgot Password ───────────────────────────────────────
export const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

// ─── Reset Password ────────────────────────────────────────
export const resetPasswordSchema = z
    .object({
        password: passwordComplexityRules,
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
