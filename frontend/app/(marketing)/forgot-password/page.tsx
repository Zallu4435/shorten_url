import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
    title: "Forgot Password",
    description: "Recover your Shorten URL account.",
};

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />;
}
