"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

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
            const message = err instanceof Error ? err.message : "Invalid credentials";
            toast.error(message);
            form.setError("email", { message: " " });
            form.setError("password", { message: "Invalid email or password" });
        }
    };

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Header */}
                <div className="space-y-1.5">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                        Sign in
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">
                        Manage your shortened links effectively
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Mail className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                                            fieldState.error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
                                        )} />
                                        <Input
                                            {...field}
                                            type="email"
                                            placeholder="name@company.com"
                                            disabled={isSubmitting}
                                            className={cn(
                                                "h-12 pl-11 pr-4 bg-background border-border rounded-xl transition-all duration-200 focus-visible:ring-primary/20",
                                                fieldState.error && "border-destructive focus-visible:ring-destructive/20"
                                            )}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage className="text-xs font-bold text-destructive" />
                            </FormItem>
                        )}
                    />

                    {/* Password */}
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Password</label>
                                    <Link href="/forgot-password" className="text-xs font-bold text-primary hover:opacity-80 transition-opacity">Forgot?</Link>
                                </div>
                                <FormControl>
                                    <div className="relative group">
                                        <Lock className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                                            fieldState.error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
                                        )} />
                                        <Input
                                            {...field}
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••••••"
                                            disabled={isSubmitting}
                                            className={cn(
                                                "h-12 pl-11 pr-12 bg-background border-border rounded-xl transition-all duration-200 focus-visible:ring-primary/20",
                                                fieldState.error && "border-destructive focus-visible:ring-destructive/20"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-xs font-bold text-destructive" />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm tracking-tight shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2">
                            Sign in to your account
                            <ArrowRight className="h-4 w-4" />
                        </span>
                    )}
                </Button>

                {/* Footer */}
                <p className="text-center text-sm font-medium text-muted-foreground">
                    New here?{" "}
                    <Link
                        href="/register"
                        className="font-black text-foreground hover:text-primary underline underline-offset-4 transition-all"
                    >
                        Create a free account
                    </Link>
                </p>
            </form>
        </Form>
    );
}
