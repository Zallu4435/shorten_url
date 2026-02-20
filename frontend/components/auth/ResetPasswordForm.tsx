"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, ArrowRight, ShieldCheck } from "lucide-react";
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


export function ResetPasswordForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const onSubmit = async (values: ResetPasswordValues) => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setIsSuccess(true);
            toast.success("Password updated successfully!");
            setTimeout(() => router.push("/login"), 3000);
        } catch (err) {
            toast.error("Failed to reset password.");
        }
    };

    const isSubmitting = form.formState.isSubmitting;

    if (isSuccess) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-600 shadow-2xl shadow-violet-600/40">
                    <ShieldCheck className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl font-black tracking-tight text-white leading-tight">
                        Security <br /> Restored.
                    </h2>
                    <p className="text-lg font-medium text-zinc-400">
                        Your password has been changed. <br /> Redirecting you to sign in...
                    </p>
                </div>
                <div className="w-full pt-4">
                    <Button
                        asChild
                        className="w-full h-14 rounded-2xl bg-zinc-800 text-white font-black"
                    >
                        <Link href="/login">Sign in Now</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tight text-white leading-tight">
                        Reset <br /> Password
                    </h2>
                    <p className="text-base font-medium text-zinc-400 leading-relaxed">
                        Secure your account with a strong new password.
                    </p>
                </div>

                <div className="space-y-4 pt-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">New Password</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Lock className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1-2 h-5 w-5 transition-colors duration-200",
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

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Confirm New Password</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Lock className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                                            fieldState.error ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"
                                        )} />
                                        <Input
                                            {...field}
                                            type="password"
                                            placeholder="••••••••••••"
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
                </div>

                <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-base font-black tracking-tight text-white shadow-xl shadow-violet-600/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2">
                            Update Password
                            <ArrowRight className="h-5 w-5" />
                        </span>
                    )}
                </Button>
            </form>
        </Form>
    );
}
