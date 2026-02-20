"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Check, X, ArrowRight } from "lucide-react";
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
    if (passed === 0) return { score: 0, color: "bg-zinc-800" };
    if (passed === 1) return { score: 25, color: "bg-red-500" };
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
            console.log("Starting registration with:", { email: values.email, username: values.username });
            await authRegister(values.email, values.username, values.password);
            toast.success("Welcome aboard! Account created successfully 🎉");
            router.replace("/dashboard");
        } catch (err) {
            console.error("Registration error:", err);
            const message = err instanceof Error ? err.message : "Could not create account. Please try again.";
            toast.error(message);
        }
    };

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tight text-white leading-tight">
                        Join the <br /> Future.
                    </h2>
                    <p className="text-base font-medium text-zinc-400">
                        Create your account in less than 30 seconds.
                    </p>
                </div>

                <div className="space-y-4 pt-2">
                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Email address</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Mail className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                                            fieldState.error ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"
                                        )} />
                                        <Input
                                            {...field}
                                            type="email"
                                            placeholder="name@example.com"
                                            disabled={isSubmitting}
                                            className={cn(
                                                "h-14 pl-12 pr-4 text-base font-medium bg-white/5 border-white/10 rounded-2xl transition-all duration-200 focus:bg-white/10 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10",
                                                fieldState.error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                                            )}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage className="text-sm font-bold text-red-400" />
                            </FormItem>
                        )}
                    />

                    {/* Username */}
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Username</label>
                                <FormControl>
                                    <div className="relative group">
                                        <User className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                                            fieldState.error ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"
                                        )} />
                                        <Input
                                            {...field}
                                            placeholder="your_handle"
                                            disabled={isSubmitting}
                                            className={cn(
                                                "h-14 pl-12 pr-4 text-base font-medium bg-white/5 border-white/10 rounded-2xl transition-all duration-200 focus:bg-white/10 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10",
                                                fieldState.error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                                            )}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage className="text-sm font-bold text-red-400" />
                            </FormItem>
                        )}
                    />

                    {/* Password */}
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Password</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Lock className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                                            fieldState.error ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"
                                        )} />
                                        <Input
                                            {...field}
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••••••"
                                            disabled={isSubmitting}
                                            className={cn(
                                                "h-14 pl-12 pr-12 text-base font-medium bg-white/5 border-white/10 rounded-2xl transition-all duration-200 focus:bg-white/10 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10",
                                                fieldState.error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </FormControl>

                                {password && (
                                    <div className="mt-2 flex gap-1 px-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className={cn(
                                                "h-1.5 flex-1 rounded-full transition-all duration-500",
                                                i * 25 <= strength.score ? strength.color : "bg-zinc-800"
                                            )} />
                                        ))}
                                    </div>
                                )}
                                <FormMessage className="text-sm font-bold text-red-400" />
                            </FormItem>
                        )}
                    />

                    {/* Confirm Password */}
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Confirm Password</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Lock className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                                            fieldState.error ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"
                                        )} />
                                        <Input
                                            {...field}
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••••••"
                                            disabled={isSubmitting}
                                            className={cn(
                                                "h-14 pl-12 pr-12 text-base font-medium bg-white/5 border-white/10 rounded-2xl transition-all duration-200 focus:bg-white/10 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10",
                                                fieldState.error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-sm font-bold text-red-400" />
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-base font-black tracking-tight text-white shadow-xl shadow-violet-600/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Generating identity...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            Create Free Account
                            <ArrowRight className="h-5 w-5" />
                        </span>
                    )}
                </Button>

                <p className="text-center text-sm font-medium text-zinc-500">
                    Already part of the network?{" "}
                    <Link
                        href="/login"
                        className="font-black text-white hover:text-violet-400 underline decoration-violet-500/30 underline-offset-4 transition-all"
                    >
                        Sign in
                    </Link>
                </p>
            </form>
        </Form>
    );
}
