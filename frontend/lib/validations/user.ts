import { z } from "zod";
import { usernameRules, passwordComplexityRules } from "./rules";

export const updateProfileSchema = z.object({
    username: usernameRules.optional().or(z.literal("")),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordComplexityRules,
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const deleteAccountSchema = z.object({
    confirmText: z.string().min(1, 'Please type "DELETE" to confirm'),
}).refine((data) => data.confirmText === "DELETE", {
    message: 'Please type "DELETE" to confirm',
    path: ["confirmText"],
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;
