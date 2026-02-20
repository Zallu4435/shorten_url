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
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setIsSubmitted(true);
            toast.success("Reset link sent!");
        } catch {
            toast.error("Something went wrong. Please try again.");
        }
    };

    const isSubmitting = form.formState.isSubmitting;

    if (isSubmitted) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                        Check your inbox.
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                        We sent a reset link to{" "}
                        <span className="text-foreground font-bold">{form.getValues("email")}</span>.
                        It expires in 1 hour.
                    </p>
                </div>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-black text-foreground hover:text-primary transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Sign in
                </Link>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-1.5">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">
                        Forgot password?
                    </h2>
                    <p className="text-sm font-medium text-muted-foreground">
                        Enter your email and we'll send you a recovery link.
                    </p>
                </div>

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field, fieldState }) => (
                            <FormItem className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Registered Email</label>
                                <FormControl>
                                    <div className="relative group">
                                        <Mail className={cn(
                                            "absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                                            fieldState.error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
                                        )} />
                                        <Input
                                            {...field}
                                            type="email"
                                            placeholder="you@example.com"
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
                            Send Reset Link
                            <ArrowRight className="h-4 w-4" />
                        </span>
                    )}
                </Button>

                <div className="text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Remember your password?
                    </Link>
                </div>
            </form>
        </Form>
    );
}
