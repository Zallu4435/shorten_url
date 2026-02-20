import Link from "next/link";
import { AlertTriangle, Clock, Hash, Link2Off, Lock, ShieldAlert, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const ERROR_CONFIG: Record<
    string,
    { icon: React.ElementType; title: string; description: string; iconColor: string }
> = {
    "not-found": {
        icon: Link2Off,
        title: "Link not found",
        description: "This short link doesn't exist or may have been removed.",
        iconColor: "text-muted-foreground",
    },
    expired: {
        icon: Clock,
        title: "Link expired",
        description: "This link has passed its expiry date and is no longer active.",
        iconColor: "text-amber-500",
    },
    inactive: {
        icon: ShieldAlert,
        title: "Link inactive",
        description: "This link has been deactivated by its owner.",
        iconColor: "text-muted-foreground",
    },
    "not-yet-active": {
        icon: Zap,
        title: "Not yet active",
        description: "This link isn't available yet. Try again later.",
        iconColor: "text-blue-500",
    },
    "limit-reached": {
        icon: Hash,
        title: "Click limit reached",
        description: "This link reached its maximum number of clicks.",
        iconColor: "text-amber-500",
    },
    used: {
        icon: Lock,
        title: "Link already used",
        description: "This was a single-use link and has already been accessed.",
        iconColor: "text-muted-foreground",
    },
    error: {
        icon: AlertTriangle,
        title: "Something went wrong",
        description: "An unexpected error occurred while processing this link.",
        iconColor: "text-destructive",
    },
};

export default function LinkErrorPage({
    params,
}: {
    params: { type: string };
}) {
    const config = ERROR_CONFIG[params.type] ?? ERROR_CONFIG["error"];
    const Icon = config.icon;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
            <div className="max-w-sm space-y-5">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                        <Icon className={`h-8 w-8 ${config.iconColor}`} />
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h1 className="text-xl font-semibold tracking-tight">{config.title}</h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {config.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <Button asChild>
                        <Link href="/">Go home</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/links/new">Create your own link</Link>
                    </Button>
                </div>

                {/* Branding */}
                <p className="text-xs text-muted-foreground">
                    Powered by{" "}
                    <Link href="/" className="text-primary hover:underline">
                        Shorten URL
                    </Link>
                </p>
            </div>
        </div>
    );
}
