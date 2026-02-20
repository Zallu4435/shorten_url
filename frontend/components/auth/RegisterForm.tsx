"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const passwordRules = [
    { label: "8+ characters", test: (p: string) => p.length >= 8 },
    { label: "Upper case", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Lower case", test: (p: string) => /[a-z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

function getPasswordStrength(password: string): { score: number; color: string } {
    const passed = passwordRules.filter((r) => r.test(password)).length;
    if (passed === 0) return { score: 0, color: "bg-muted" };
    if (passed === 1) return { score: 25, color: "bg-destructive" };
    if (passed === 2) return { score: 50, color: "bg-orange-500" };
    if (passed === 3) return { score: 75, color: "bg-amber-500" };
    return { score: 100, color: "bg-emerald-500" };
}

export function RegisterForm() {
    const { register: authRegister } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { email: "", username: "", password: "", confirmPassword: "" },
        mode: "onChange",
    });

    const password = form.watch("password");
    const strength = getPasswordStrength(password);

    const onSubmit = async (values: RegisterValues) => {
        try {
            await authRegister(values.email, values.username, values.password);
            toast.success("Welcome aboard! Account created successfully 🎉");
            router.replace("/dashboard");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Could not create account. Please try again.";
            toast.error(message);
        }
    };

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                        Create account
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">
                        Create your free account to start shortening links.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email address</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Mail className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                                            fieldState.error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
                                        )} />
                                        <Input
                                            {...field}
                                            type="email"
                                            placeholder="name@example.com"
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

                    {/* Username */}
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Username</label>
                                <FormControl>
                                    <div className="relative group">
                                        <User className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                                            fieldState.error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
                                        )} />
                                        <Input
                                            {...field}
                                            placeholder="your_handle"
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
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
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

                                {password && (
                                    <div className="mt-2 flex gap-1 px-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className={cn(
                                                "h-1 flex-1 rounded-full transition-all duration-500",
                                                i * 25 <= strength.score ? strength.color : "bg-muted"
                                            )} />
                                        ))}
                                    </div>
                                )}
                                <FormMessage className="text-xs font-bold text-destructive" />
                            </FormItem>
                        )}
                    />

                    {/* Confirm Password */}
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Lock className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                                            fieldState.error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
                                        )} />
                                        <Input
                                            {...field}
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••••••"
                                            disabled={isSubmitting}
                                            className={cn(
                                                "h-12 pl-11 pr-12 bg-background border-border rounded-xl transition-all duration-200 focus-visible:ring-primary/20",
                                                fieldState.error && "border-destructive focus-visible:ring-destructive/20"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-xs font-bold text-destructive" />
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm tracking-tight shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating your account...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            Create Free Account
                            <ArrowRight className="h-4 w-4" />
                        </span>
                    )}
                </Button>

                <p className="text-center text-sm font-medium text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-black text-foreground hover:text-primary underline underline-offset-4 transition-all"
                    >
                        Sign in
                    </Link>
                </p>
            </form>
        </Form>
    );
}
