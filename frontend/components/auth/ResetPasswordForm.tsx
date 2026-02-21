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

    const onSubmit = async () => {
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setIsSuccess(true);
            toast.success("Password updated successfully!");
            setTimeout(() => router.push("/login"), 3000);
        } catch {
            toast.error("Failed to reset password.");
        }
    };

    const isSubmitting = form.formState.isSubmitting;

    if (isSuccess) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-2xl shadow-primary/30">
                    <ShieldCheck className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                        Security Restored.
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                        Your password has been changed.<br />Redirecting you to sign in...
                    </p>
                </div>
                <Button
                    asChild
                    className="w-full h-12 rounded-xl bg-muted text-foreground font-black hover:bg-muted/70 transition-all"
                >
                    <Link href="/login">Sign in Now</Link>
                </Button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-1.5">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                        Reset password
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                        Secure your account with a strong new password.
                    </p>
                </div>

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
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

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Lock className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                                            fieldState.error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
                                        )} />
                                        <Input
                                            {...field}
                                            type="password"
                                            placeholder="••••••••••••"
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
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm tracking-tight shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2">
                            Update Password
                            <ArrowRight className="h-4 w-4" />
                        </span>
                    )}
                </Button>
            </form>
        </Form>
    );
}
