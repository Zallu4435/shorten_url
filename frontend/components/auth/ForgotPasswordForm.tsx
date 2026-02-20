"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations/auth";
import Link from "next/link";
import { Loader2, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
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


export function ForgotPasswordForm() {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: "" },
    });

    const onSubmit = async (values: ForgotPasswordValues) => {
        try {
            // Simulated API call
            await new Promise((resolve) => setTimeout(resolve, 1500));
            console.log("Reset link sent to:", values.email);
            setIsSubmitted(true);
            toast.success("Reset link sent!");
        } catch (err) {
            toast.error("Something went wrong. Please try again.");
        }
    };

    const isSubmitting = form.formState.isSubmitting;

    if (isSubmitted) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl font-black tracking-tight text-white leading-tight">
                        Check your <br /> inbox.
                    </h2>
                    <p className="text-lg font-medium text-zinc-400 leading-relaxed">
                        We've sent a password reset link to <span className="text-white font-bold">{form.getValues("email")}</span>. It will expire in 1 hour.
                    </p>
                </div>
                <div className="pt-4">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-base font-black text-white hover:text-violet-400 transition-all group"
                    >
                        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                        Back to Sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-3">
                    <h2 className="text-4xl font-black tracking-tight text-white">
                        Lost access?
                    </h2>
                    <p className="text-base font-medium text-zinc-400">
                        Enter your email and we'll send you a recovery link.
                    </p>
                </div>

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Registered Email</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Mail className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                                            fieldState.error ? "text-red-400" : "text-zinc-500 group-focus-within:text-violet-400"
                                        )} />
                                        <Input
                                            {...field}
                                            type="email"
                                            placeholder="you@example.com"
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
                            Send Reset Link
                            <ArrowRight className="h-5 w-5" />
                        </span>
                    )}
                </Button>

                <div className="text-center pt-2">
                    <Link
                        href="/login"
                        className="text-sm font-black text-zinc-500 hover:text-white transition-all group inline-flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Remember your password?
                    </Link>
                </div>
            </form>
        </Form>
    );
}
