"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Link2, Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const registerSchema = z
    .object({
        email: z.string().email("Please enter a valid email address"),
        username: z
            .string()
            .min(3, "Username must be at least 3 characters")
            .max(30, "Username must be at most 30 characters")
            .regex(
                /^[a-zA-Z0-9_]+$/,
                "Only letters, numbers, and underscores allowed"
            ),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[0-9]/, "Must contain at least one number"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type RegisterValues = z.infer<typeof registerSchema>;

// Password strength indicators
const passwordRules = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export function RegisterForm() {
    const { register } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            username: "",
            password: "",
            confirmPassword: "",
        },
        mode: "onChange",
    });

    const password = form.watch("password");
    const onSubmit = async (values: RegisterValues) => {
        try {
            await register(values.email, values.username, values.password);
            toast.success("Account created! Welcome aboard 🎉");
            router.replace("/dashboard");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Could not create account";
            toast.error(message);
        }
    };

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Brand mark */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                        <Link2 className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight">
                        Shorten URL
                    </span>
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Start shortening links in seconds — no credit card required
                    </p>
                </div>

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    autoFocus
                                    disabled={isSubmitting}
                                    className="bg-background"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    type="text"
                                    placeholder="alice_dev"
                                    autoComplete="username"
                                    disabled={isSubmitting}
                                    className="bg-background"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        {...field}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        disabled={isSubmitting}
                                        className="bg-background pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </FormControl>

                            {/* Password strength indicator */}
                            {password.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {passwordRules.map((rule) => {
                                        const passed = rule.test(password);
                                        return (
                                            <div
                                                key={rule.label}
                                                className={cn(
                                                    "flex items-center gap-1.5 text-xs transition-colors",
                                                    passed ? "text-emerald-500" : "text-muted-foreground"
                                                )}
                                            >
                                                {passed ? (
                                                    <Check className="h-3 w-3" />
                                                ) : (
                                                    <X className="h-3 w-3" />
                                                )}
                                                {rule.label}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm password</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        {...field}
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        disabled={isSubmitting}
                                        className="bg-background pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                        aria-label={showConfirm ? "Hide" : "Show"}
                                    >
                                        {showConfirm ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account…
                        </>
                    ) : (
                        "Create account"
                    )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </form>
        </Form>
    );
}
