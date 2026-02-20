import { z } from "zod";

// ─── Create Link ───────────────────────────────────────────
export const createLinkSchema = z.object({
    originalUrl: z.string().url("Please enter a valid URL"),
    slug: z
        .string()
        .regex(/^[a-zA-Z0-9_-]*$/, "Only letters, numbers, hyphens, underscores")
        .default(""),
    title: z.string().max(160).default(""),
    description: z.string().max(500).default(""),
    isPrivate: z.boolean().default(false),
    password: z.string().default(""),
    isSingleUse: z.boolean().default(false),
    maxClicks: z.string().default(""),
    expiresAt: z.string().default(""),
    webhookUrl: z
        .string()
        .refine((v) => !v || /^https?:\/\/./.test(v), "Enter a valid webhook URL")
        .default(""),
});

export type CreateLinkValues = z.infer<typeof createLinkSchema>;
