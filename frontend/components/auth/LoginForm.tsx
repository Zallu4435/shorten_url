"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Link2, Mail, Lock, ArrowRight } from "lucide-react";
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
                <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tight text-white">
                        Sign in
                    </h2>
                    <p className="text-base font-medium text-zinc-400">
                        Continue your journey with ShortenURL
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Email */}
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Mail className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                                            fieldState.error ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"
                                        )} />
                                        <Input
                                            {...field}
                                            type="email"
                                            placeholder="name@company.com"
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
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Password</label>
                                    <Link href="/forgot-password" className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors">Forgot?</Link>
                                </div>
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
                                <FormMessage className="text-sm font-bold text-red-400" />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-base font-black tracking-tight text-white shadow-xl shadow-violet-600/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2">
                            Sign in to Account
                            <ArrowRight className="h-5 w-5" />
                        </span>
                    )}
                </Button>

                {/* Footer */}
                <p className="text-center text-sm font-medium text-zinc-500">
                    New here?{" "}
                    <Link
                        href="/register"
                        className="font-black text-white hover:text-violet-400 underline decoration-violet-500/30 underline-offset-4 transition-all"
                    >
                        Create an account for free
                    </Link>
                </p>
            </form>
        </Form>
    );
}
