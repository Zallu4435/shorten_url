"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Link2 } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
    const { login } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (values: LoginValues) => {
        try {
            await login(values.email, values.password);
            toast.success("Welcome back!");
            router.replace("/dashboard");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Invalid email or password";
            toast.error(message);
            form.setError("email", { message: " " });
            form.setError("password", { message: "Invalid email or password" });
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
                    <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sign in to your account to continue
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
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Password</FormLabel>
                                <Link
                                    href="#"
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        {...field}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
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
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    size="default"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in…
                        </>
                    ) : (
                        "Sign in"
                    )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                    >
                        Create one
                    </Link>
                </p>
            </form>
        </Form>
    );
}
