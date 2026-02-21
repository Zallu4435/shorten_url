"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
    ArrowLeft,
    Save,
    Link2,
    Lock,
    Zap,
    Settings,
    QrCode,
    Download,
    Loader2,
    Globe,
    Activity,
    Webhook,
    RefreshCw,
    LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { GET_URL_QUERY } from "@/lib/graphql/queries";
import { UPDATE_SHORT_URL_MUTATION } from "@/lib/graphql/mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import { PageLoading } from "@/components/shared/PageLoading";
import { cn } from "@/lib/utils";
import type { ShortURL } from "@/types";

import { PageHeader } from "@/components/shared/PageHeader";

interface LinkSettingsClientProps {
    id: string;
}

/* ─── Premium Setting Row ─────────────────────────────────────── */
function SettingRow({
    label,
    description,
    children,
    icon: Icon,
}: {
    label: string;
    description?: string;
    children: React.ReactNode;
    icon?: LucideIcon;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-8 border-b border-border/60 last:border-0 first:pt-0 group hover:bg-muted/5 transition-colors px-2 -mx-2 rounded-2xl">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                    {Icon && <Icon className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />}
                    <p className="text-base font-black tracking-tight text-foreground">{label}</p>
                </div>
                {description && (
                    <p className="text-sm font-medium text-muted-foreground/70 leading-relaxed max-w-xl">{description}</p>
                )}
            </div>
            <div className="shrink-0 flex items-center justify-start sm:justify-end">{children}</div>
        </div>
    );
}

export function LinkSettingsClient({ id }: LinkSettingsClientProps) {
    const router = useRouter();
    const { data, loading: urlLoading } = useQuery<{ getUrl: ShortURL }>(
        GET_URL_QUERY,
        { variables: { id } }
    );

    const [updateUrl, { loading: saving }] = useMutation(UPDATE_SHORT_URL_MUTATION, {
        refetchQueries: [{ query: GET_URL_QUERY, variables: { id } }],
    });

    const url = data?.getUrl;

    /* ─── form state ──────────────────────────────────────── */
    const [originalUrl, setOriginalUrl] = useState("");
    const [slug, setSlug] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState("");
    const [maxClicks, setMaxClicks] = useState<string>("");
    const [expiresAt, setExpiresAt] = useState<string>("");
    const [webhookUrl, setWebhookUrl] = useState("");
    const [qrEnabled, setQrEnabled] = useState(false);
    const [qrDownloading, setQrDownloading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const initialized = useRef(false);

    useEffect(() => {
        if (url && !initialized.current) {
            setOriginalUrl(url.originalUrl);
            setSlug(url.slug);
            setTitle(url.title ?? "");
            setDescription(url.description ?? "");
            setIsActive(url.isActive);
            setIsPrivate(url.isPrivate);
            setMaxClicks(url.maxClicks ? String(url.maxClicks) : "");
            setExpiresAt(
                url.expiresAt ? new Date(url.expiresAt).toISOString().slice(0, 16) : ""
            );
            setWebhookUrl(url.webhookUrl ?? "");
            setQrEnabled(url.qrEnabled ?? false);
            initialized.current = true;
        }
    }, [url]);

    const handleSave = async () => {
        // Expiration validation
        if (expiresAt && new Date(expiresAt) <= new Date()) {
            toast.error("Invalid Expiration", {
                description: "The expiration date must be in the future."
            });
            return;
        }

        // Password validation
        if (isPrivate && password && password.length < 4) {
            toast.error("Weak Password", {
                description: "Security protocol requires at least 4 characters."
            });
            return;
        }

        try {
            await updateUrl({
                variables: {
                    id,
                    originalUrl,
                    slug: slug.toLowerCase().trim(),
                    title: title || undefined,
                    description: description || undefined,
                    isActive,
                    isPrivate,
                    password: password || undefined,
                    maxClicks: maxClicks ? parseInt(maxClicks, 10) : null,
                    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
                    webhookUrl: webhookUrl || undefined,
                    qrEnabled,
                },
            });

            setIsRedirecting(true);
            toast.success("Settings saved successfully", {
                description: "All link protocols updated and synchronized."
            });

            setPassword("");

            // Redirect back to detail page after a short delay to let toast be seen
            setTimeout(() => {
                router.push(`/links/${id}`);
            }, 1000);

        } catch (err: unknown) {
            toast.error((err as Error).message ?? "Failed to save settings");
        }
    };

    const handleQrDownload = async () => {
        if (!url?.qrCodeUrl && !qrEnabled) return;
        const qrUrl = url?.qrCodeUrl ?? `/qr/${url?.slug}`;
        setQrDownloading(true);
        try {
            const res = await fetch(qrUrl);
            const blob = await res.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `qr-${url?.slug ?? "link"}.png`;
            link.click();
        } catch {
            toast.error("Failed to download QR code");
        } finally {
            setQrDownloading(false);
        }
    };

    if (urlLoading && !data) return <PageLoading message="Loading settings state…" />;

    if (!url) {
        return (
            <div className="max-w-[1200px] mx-auto py-20 text-center">
                <p className="text-muted-foreground font-black text-xl">LINK NOT FOUND</p>
                <Button asChild variant="outline" className="mt-6 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs">
                    <Link href="/links">← RETURN TO SYSTEM</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 py-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Page Header — unified with Dashboard */}
            <PageHeader
                title="Settings"
                description={`Modify and harden link protocols for /${url.slug}`}
                icon={Settings}
                stats={{
                    label: "Link ID",
                    value: url.id.slice(0, 8),
                    unit: "ACTIVE"
                }}
            >
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="rounded-2xl border-border px-6 font-black uppercase tracking-widest text-[10px] h-11 hover:bg-muted transition-all bg-background shadow-sm hover:border-primary/50"
                >
                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                    Discard Changes
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving || isRedirecting}
                    className="h-11 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:opacity-90 border border-primary/20 active:scale-95 transition-all"
                >
                    {saving || isRedirecting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isRedirecting ? "Finalizing…" : "Syncing…"}</>
                    ) : (
                        <><Save className="mr-2 h-4 w-4" />Save Protocol</>
                    )}
                </Button>
            </PageHeader>

            <div className="grid lg:grid-cols-3 gap-10 items-start">
                {/* Core Logic Column */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Destination Card */}
                    <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                        <CardHeader className="p-10 pb-2">
                            <TechnicalIndicator label="Basics" icon={Link2} />
                            <h2 className="text-2xl font-black tracking-tighter text-foreground">Core Protocol</h2>
                        </CardHeader>
                        <CardContent className="p-10 pt-6 space-y-8">
                            <div className="space-y-3">
                                <Label htmlFor="originalUrl" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                    Destination Node URL
                                </Label>
                                <Input
                                    id="originalUrl"
                                    value={originalUrl}
                                    onChange={(e) => setOriginalUrl(e.target.value)}
                                    placeholder="https://destination-node.com/resource"
                                    className="h-16 bg-muted/20 border-border text-base font-black tracking-tighter focus-visible:ring-primary/20 rounded-2xl shadow-inner placeholder:text-muted-foreground/30 px-6"
                                />
                            </div>
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="slug" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        Custom Alias (Slug)
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-lg">
                                            /
                                        </span>
                                        <Input
                                            id="slug"
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                                            placeholder="my-alias"
                                            className="h-16 pl-10 bg-muted/20 border-border text-lg font-black tracking-tighter focus-visible:ring-primary/20 rounded-2xl shadow-inner placeholder:text-muted-foreground/30 px-6"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        Admin Identifier
                                    </Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Internal Label"
                                        className="h-16 bg-muted/20 border-border text-base font-black tracking-tighter focus-visible:ring-primary/20 rounded-2xl shadow-inner placeholder:text-muted-foreground/30 px-6"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                    Extended Decription
                                </Label>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional notes or context for this link..."
                                    className="h-16 bg-muted/20 border-border text-base font-black tracking-tighter focus-visible:ring-primary/20 rounded-2xl shadow-inner placeholder:text-muted-foreground/30 px-6"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Operational Settings */}
                    <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                        <CardHeader className="p-10 pb-2">
                            <TechnicalIndicator label="Harden" icon={Globe} />
                            <h2 className="text-2xl font-black tracking-tighter text-foreground">Policy & Visibility</h2>
                        </CardHeader>
                        <CardContent className="p-10 pt-6">
                            <SettingRow
                                label="Protocol Status"
                                description="When inactive, this endpoint returns a 404 block and denies all incoming traffic."
                                icon={Activity}
                            >
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                            </SettingRow>
                            <SettingRow
                                label="Stealth Mode"
                                description="Require authentication via password to access the destination node."
                                icon={Lock}
                            >
                                <Switch
                                    checked={isPrivate}
                                    onCheckedChange={setIsPrivate}
                                />
                            </SettingRow>
                            {isPrivate && (
                                <div className="py-6 animate-in slide-in-from-top-2 duration-300">
                                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        Node Access Key (Password)
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Leave blank to maintain current"
                                        className={cn(
                                            "mt-3 h-14 bg-muted/20 border-border text-lg font-black tracking-tighter focus-visible:ring-primary/20 rounded-2xl shadow-inner placeholder:text-muted-foreground/30 px-6",
                                            isPrivate && password && password.length < 4 && "border-red-500/50 focus-visible:ring-red-500/20"
                                        )}
                                    />
                                    {isPrivate && password && password.length < 4 && (
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2 ml-1 animate-in fade-in slide-in-from-top-1">
                                            Minimum 4 characters required
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* QR Node Card */}
                    <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                        <CardHeader className="p-10 pb-2 flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <TechnicalIndicator label="Node" icon={QrCode} color="violet" />
                                <h2 className="text-2xl font-black tracking-tighter text-foreground">QR Core</h2>
                            </div>
                            <Switch
                                checked={qrEnabled}
                                onCheckedChange={setQrEnabled}
                                className="data-[state=checked]:bg-violet-500 scale-125"
                            />
                        </CardHeader>
                        <CardContent className="p-10 pt-6">
                            {qrEnabled && url.qrCodeUrl && (
                                <div className="flex flex-col md:flex-row items-center gap-10 bg-muted/10 rounded-[32px] p-8 border border-border/40 border-dashed">
                                    <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-primary/10 border border-border shrink-0 hover:scale-105 transition-transform duration-500">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url.qrCodeUrl} alt="QR Code" className="h-32 w-32" />
                                    </div>
                                    <div className="space-y-4 flex-1 text-center md:text-left">
                                        <div>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">
                                                Active Endpoint
                                            </p>
                                            <p className="text-sm font-black text-foreground font-mono break-all line-clamp-2">
                                                {url.qrCodeUrl}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="h-11 px-8 rounded-2xl border-border font-black text-[10px] uppercase tracking-widest hover:bg-muted hover:border-primary/50 transition-all bg-background shadow-sm"
                                            onClick={handleQrDownload}
                                            disabled={qrDownloading}
                                        >
                                            {qrDownloading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Download className="mr-2 h-4 w-4" />
                                            )}
                                            Download Asset
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {qrEnabled && !url.qrCodeUrl && (
                                <div className="flex items-center gap-4 text-xs font-black text-amber-500 bg-amber-500/5 border border-amber-500/20 rounded-[28px] px-8 py-6">
                                    <RefreshCw className="h-5 w-5 shrink-0 animate-spin" />
                                    SYNC REQUIRED: Save changes to initialize QR node.
                                </div>
                            )}
                            {!qrEnabled && (
                                <p className="text-sm font-medium text-muted-foreground/60 text-center py-4 italic">
                                    QR code generation is currently offline for this node.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Constraints & Webhooks Column */}
                <div className="space-y-10 lg:sticky lg:top-6">
                    {/* Constraints Card */}
                    <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                        <CardHeader className="p-10 pb-2">
                            <TechnicalIndicator label="Limits" icon={Zap} color="amber" />
                            <h2 className="text-2xl font-black tracking-tighter text-foreground">Constraints</h2>
                        </CardHeader>
                        <CardContent className="p-10 space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                        Max Capacity
                                    </Label>
                                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">THROTTLE</span>
                                </div>
                                <Input
                                    type="number"
                                    value={maxClicks}
                                    onChange={(e) => setMaxClicks(e.target.value)}
                                    placeholder="INFINITY"
                                    min={1}
                                    className="h-14 bg-muted/20 border-border text-base font-black tracking-tighter rounded-2xl shadow-inner px-5"
                                />
                                <p className="text-[10px] font-medium text-muted-foreground leading-tight px-1">
                                    Automatically deactivate node after reaching click limit.
                                </p>
                            </div>
                            <div className="space-y-3 pt-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Self-Destruct
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    className={cn(
                                        "h-14 bg-muted/20 border-border text-sm font-bold tracking-tight rounded-2xl shadow-inner px-5",
                                        expiresAt && new Date(expiresAt) <= new Date() && "border-red-500/50 text-red-500"
                                    )}
                                />
                                {expiresAt && new Date(expiresAt) <= new Date() && (
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2 ml-1 animate-in fade-in slide-in-from-top-1">
                                        Date must be in the future
                                    </p>
                                )}
                                <p className="text-[10px] font-medium text-muted-foreground leading-tight px-1">
                                    Pre-scheduled termination of this redirect protocol.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Webhook Card */}
                    <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                        <CardHeader className="p-10 pb-2">
                            <TechnicalIndicator label="Events" icon={Webhook} />
                            <h2 className="text-2xl font-black tracking-tighter text-foreground">Propagation</h2>
                        </CardHeader>
                        <CardContent className="p-10 space-y-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Webhook Endpoint
                                </Label>
                                <Input
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    placeholder="https://events.example.com/hook"
                                    className="h-14 bg-muted/20 border-border text-sm font-bold tracking-tight rounded-2xl shadow-inner px-5"
                                />
                                <p className="text-[10px] font-medium text-muted-foreground leading-tight px-1">
                                    External POST request on every click event.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Footer Shortcut */}
                    <div className="p-1">
                        <Button
                            onClick={handleSave}
                            disabled={saving || isRedirecting}
                            className="w-full h-16 rounded-[28px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 hover:opacity-90 border border-primary/20 active:scale-95 transition-all flex flex-col items-center justify-center gap-0.5"
                        >
                            {saving || isRedirecting ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /><span className="mt-1">{isRedirecting ? "Finalizing" : "Synchronizing"}</span></>
                            ) : (
                                <><Save className="h-5 w-5" /><span className="mt-1">Commit Changes</span></>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
