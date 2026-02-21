"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLinkSchema, type CreateLinkValues } from "@/lib/validations/links";
import { useMutation, useLazyQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import {
    Plus,
    Zap,
    Activity,
    Loader2,
    Scan,
    ChevronDown,
    ChevronUp,
    Link2,
    Check,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import { CREATE_SHORT_URL_MUTATION } from "@/lib/graphql/mutations";
import {
    SUGGEST_SLUGS_QUERY,
    GENERATE_URL_METADATA_QUERY,
    MY_URLS_QUERY,
} from "@/lib/graphql/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { SlugSuggestion, URLMetadata } from "@/types";

import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";

export function CreateLinkClient() {
    const router = useRouter();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [slugSuggestions, setSlugSuggestions] = useState<SlugSuggestion[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [metaAiGenerated, setMetaAiGenerated] = useState({ title: false, description: false });

    const form = useForm<CreateLinkValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(createLinkSchema) as any,
        defaultValues: {
            originalUrl: "",
            slug: "",
            title: "",
            description: "",
            isPrivate: false,
            isSingleUse: false,
            qrEnabled: false,
            password: "",
            maxClicks: "",
            expiresAt: "",
            webhookUrl: "",
        },
    });
    const isProcessing = useRef(false);

    const [isRedirecting, setIsRedirecting] = useState(false);

    const [createUrl, { loading: creating }] = useMutation(
        CREATE_SHORT_URL_MUTATION,
        {
            refetchQueries: [MY_URLS_QUERY],
            onCompleted: (data) => {
                setIsRedirecting(true);
                toast.success("Link created successfully", {
                    description: `Short link /${data.createShortUrl.slug} is now live.`,
                });
                setTimeout(() => {
                    router.push(`/links/${data.createShortUrl.id}`);
                }, 1000);
            },
            onError: (err) => toast.error(err.message),
        }
    );

    const [getSlugs] = useLazyQuery<{ suggestSlugs: SlugSuggestion[] }>(
        SUGGEST_SLUGS_QUERY
    );
    const [getMetadata] = useLazyQuery<{ generateUrlMetadata: URLMetadata }>(
        GENERATE_URL_METADATA_QUERY
    );

    const handleAISuggest = async () => {
        if (isProcessing.current || aiLoading) return;
        isProcessing.current = true;

        const url = form.getValues("originalUrl");
        if (!url) {
            toast.error("Destination URL required");
            isProcessing.current = false;
            return;
        }

        // Force validation of the URL before proceeding
        const isValid = await form.trigger("originalUrl");
        if (!isValid) {
            toast.error("Valid Destination URL required for analysis");
            isProcessing.current = false;
            return;
        }

        setAiLoading(true);
        setMetaAiGenerated({ title: false, description: false }); // reset badges before new scan
        setSlugSuggestions([]);


        try {
            const [slugResult, metaResult] = await Promise.allSettled([
                getSlugs({ variables: { url, count: 5 } }),
                getMetadata({ variables: { url } }),
            ]);

            let changesSynthesized = 0;
            let slugsFound = 0;

            if (slugResult.status === "fulfilled" && slugResult.value.data?.suggestSlugs) {
                const slugs = slugResult.value.data.suggestSlugs;
                setSlugSuggestions(slugs);
                slugsFound = slugs.length;
            }

            if (
                metaResult.status === "fulfilled" &&
                metaResult.value.data?.generateUrlMetadata
            ) {
                const meta = metaResult.value.data.generateUrlMetadata;


                // Populate if field is empty OR was previously set by AI (safe to overwrite AI-generated content)
                const currentTitle = form.getValues("title")?.trim();
                const currentDesc = form.getValues("description")?.trim();

                if (meta.title && (!currentTitle || metaAiGenerated.title)) {

                    form.setValue("title", meta.title, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true
                    });
                    setMetaAiGenerated(prev => ({ ...prev, title: true }));
                    changesSynthesized++;
                }
                if (meta.description && (!currentDesc || metaAiGenerated.description)) {

                    form.setValue("description", meta.description, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true
                    });
                    setMetaAiGenerated(prev => ({ ...prev, description: true }));
                    changesSynthesized++;
                }
            }

            if (changesSynthesized > 0 || slugsFound > 0) {
                toast.success("Link analysis complete", {
                    description: `${slugsFound} slugs and ${changesSynthesized} metadata fields generated.`
                });
            } else {
                toast.info("No suggestions found", {
                    description: "The analysis returned no additional insights for this link."
                });
            }
        } catch (error) {

            toast.error("AI node diagnostics failed");
        } finally {
            setAiLoading(false);
            isProcessing.current = false;
        }
    };

    const onSubmit = async (values: CreateLinkValues) => {
        const clicks = values.maxClicks ? parseInt(values.maxClicks) : NaN;
        await createUrl({
            variables: {
                originalUrl: values.originalUrl,
                slug: values.slug || undefined,
                title: values.title || undefined,
                description: values.description || undefined,
                isPrivate: values.isPrivate,
                password: values.password || undefined,
                isSingleUse: values.isSingleUse,
                qrEnabled: values.qrEnabled,
                maxClicks: isNaN(clicks) ? undefined : clicks,
                expiresAt: values.expiresAt || undefined,
                webhookUrl: values.webhookUrl || undefined,
            },
        });
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 py-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Page Header — unified with Dashboard */}
            <PageHeader
                title="Create New Link"
                description="Create a shortened link and track its performance in real-time."
                icon={Plus}
                stats={{
                    label: "System Status",
                    value: "v2.0",
                    unit: "SECURE"
                }}
            >
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="rounded-2xl border-border px-6 font-black uppercase tracking-widest text-[10px] h-11 hover:bg-muted transition-all bg-background shadow-sm hover:border-primary/50"
                >
                    <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                    Back to Links
                </Button>
            </PageHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                    <div className="grid lg:grid-cols-3 gap-8 items-start">
                        {/* Primary Configuration Column (Left 2/3) */}
                        <div className="lg:col-span-2 space-y-8 mt-1">
                            {/* Destination Card — Core Protocol */}
                            <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                                <CardHeader className="p-10 pb-2">
                                    <TechnicalIndicator label="Basics" icon={Link2} />
                                    <h2 className="text-3xl font-black tracking-tighter text-foreground">Destination URL</h2>
                                </CardHeader>
                                <CardContent className="p-10 pt-6 space-y-8">
                                    <FormField
                                        control={form.control}
                                        name="originalUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="https://destination-node.com/resource"
                                                        autoFocus
                                                        className="h-16 bg-muted/20 border-border text-lg font-black tracking-tighter focus-visible:ring-primary/20 rounded-2xl shadow-inner placeholder:text-muted-foreground/30 px-6"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-black uppercase tracking-widest mt-2" />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAISuggest}
                                        disabled={aiLoading}
                                        className="w-full h-14 rounded-2xl border-violet-500/20 bg-violet-500/[0.02] hover:bg-violet-500/10 text-violet-500 font-black uppercase tracking-[0.2em] text-[10px] transition-all group shadow-sm border-dashed"
                                    >
                                        {aiLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin text-violet-500" />
                                        ) : (
                                            <Scan className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 text-violet-500" />
                                        )}
                                        {aiLoading ? "Generating metadata..." : "Analyze original URL"}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Metadata Card — Registry Info */}
                            <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                                <CardHeader className="p-10 pb-2">
                                    <TechnicalIndicator label="Metadata" icon={Activity} color="violet" />
                                    <h2 className="text-3xl font-black tracking-tighter text-foreground">Link Details</h2>
                                </CardHeader>
                                <CardContent className="p-10 pt-6 space-y-8">
                                    <div className="grid gap-8">
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-3 pl-1">
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Title</FormLabel>
                                                        {metaAiGenerated.title && (
                                                            <Badge variant="outline" className="h-5 text-[8px] font-black px-2 border-violet-500/20 bg-violet-500/5 text-violet-500 animate-in fade-in duration-500">
                                                                AI REFINED
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                setMetaAiGenerated(prev => ({ ...prev, title: false }));
                                                            }}
                                                            placeholder="e.g., Q1 Multi-Channel Campaign"
                                                            className="h-14 bg-muted/20 border-border rounded-xl font-bold tracking-tight shadow-inner px-5"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px] font-black uppercase tracking-widest mt-2" />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-3 pl-1">
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Description</FormLabel>
                                                        {metaAiGenerated.description && (
                                                            <Badge variant="outline" className="h-5 text-[8px] font-black px-2 border-violet-500/20 bg-violet-500/5 text-violet-500 animate-in fade-in duration-500">
                                                                AI REFINED
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                setMetaAiGenerated(prev => ({ ...prev, description: false }));
                                                            }}
                                                            placeholder="Define the primary objective for this network node..."
                                                            rows={4}
                                                            className="bg-muted/20 border-border rounded-2xl font-bold tracking-tight resize-none px-6 py-4 shadow-inner min-h-[160px]"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-[10px] font-black uppercase tracking-widest mt-2" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Supplementary Configuration Column (Right 1/3) */}
                        <div className="lg:col-span-1 space-y-8">
                            {/* Path Config Card */}
                            <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                                <CardHeader className="p-8 pb-2">
                                    <TechnicalIndicator label="Slug" icon={Zap} color="amber" />
                                    <h2 className="text-xl font-black tracking-tighter text-foreground">Custom Path</h2>
                                </CardHeader>
                                <CardContent className="p-8 pt-6 space-y-8">
                                    <FormField
                                        control={form.control}
                                        name="slug"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex flex-col gap-3 p-5 rounded-2xl bg-muted/30 border border-border shadow-inner">
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">
                                                        shorten.url/
                                                    </span>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="unique-id"
                                                            className="h-8 bg-transparent border-none focus-visible:ring-0 font-black text-xl tracking-tighter p-0 placeholder:text-muted-foreground/20"
                                                        />
                                                    </FormControl>
                                                </div>
                                                <FormMessage className="text-[10px] font-black uppercase tracking-widest mt-2" />
                                            </FormItem>
                                        )}
                                    />

                                    {slugSuggestions.length > 0 && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-3 w-3 text-violet-500" />
                                                <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Slug Suggestions</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {slugSuggestions.map((s) => {
                                                    const isSelected = form.watch("slug") === s.slug;
                                                    return (
                                                        <button
                                                            key={s.slug}
                                                            type="button"
                                                            onClick={() => form.setValue("slug", s.slug)}
                                                            title={s.reason}
                                                            className={cn(
                                                                "px-3 py-2 rounded-xl border text-[11px] font-black tracking-tight transition-all duration-300",
                                                                isSelected
                                                                    ? "border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]"
                                                                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                                            )}
                                                        >
                                                            {s.slug}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {/* Logic to show the reason for the SELECTED slug */}
                                            {form.watch("slug") && slugSuggestions.find(s => s.slug === form.watch("slug")) && (
                                                <div className="p-4 rounded-2xl bg-violet-500/[0.03] border border-violet-500/10 animate-in fade-in slide-in-from-left-2 duration-300">
                                                    <p className="text-[9px] font-black text-violet-500/60 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                        <Activity className="h-3 w-3" />
                                                        Why this slug?
                                                    </p>
                                                    <p className="text-xs font-bold text-muted-foreground leading-relaxed italic">
                                                        "{slugSuggestions.find(s => s.slug === form.watch("slug"))?.reason}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Security Toggle Section */}
                            <div className="space-y-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced((v) => !v)}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-[30px] border px-8 py-6 transition-all group shadow-sm",
                                        showAdvanced
                                            ? "bg-muted border-primary/20"
                                            : "bg-card border-border hover:border-primary/30 hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-[15px] flex items-center justify-center transition-all",
                                            showAdvanced ? "bg-primary text-primary-foreground rotate-180" : "bg-muted text-muted-foreground"
                                        )}>
                                            <ChevronDown className="h-5 w-5 stroke-[3px]" />
                                        </div>
                                        <p className="text-xs font-black tracking-widest text-foreground uppercase">Advanced Settings</p>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "text-[9px] font-black px-3 h-7 rounded-full border-2",
                                        showAdvanced ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted/50 border-border"
                                    )}>
                                        {showAdvanced ? "ACTIVE" : "CLOSED"}
                                    </Badge>
                                </button>

                                {showAdvanced && (
                                    <Card className="rounded-[40px] border-border bg-card shadow-xl overflow-hidden animate-in slide-in-from-top-6 duration-500">
                                        <CardContent className="p-8 space-y-8">
                                            <FormField
                                                control={form.control}
                                                name="isPrivate"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center justify-between p-1">
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Password Protection</FormLabel>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            {form.watch("isPrivate") && (
                                                <FormField
                                                    control={form.control}
                                                    name="password"
                                                    render={({ field }) => (
                                                        <FormItem className="animate-in fade-in slide-in-from-left-4 duration-300">
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="password"
                                                                    placeholder="PIN"
                                                                    className="h-12 bg-muted/20 border-border rounded-xl font-black shadow-inner px-4 tracking-[0.3em] text-center"
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-[10px] font-black uppercase tracking-widest mt-2 text-center" />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}

                                            <Separator className="bg-border opacity-50" />

                                            <FormField
                                                control={form.control}
                                                name="isSingleUse"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center justify-between p-1">
                                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground">Single-Use Link</FormLabel>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <Separator className="bg-border opacity-50" />

                                            <FormField
                                                control={form.control}
                                                name="qrEnabled"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center justify-between p-1">
                                                        <div>
                                                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
                                                                <Scan className="h-3 w-3" />
                                                                Generate QR Code
                                                            </FormLabel>
                                                            <FormDescription className="text-[9px] tracking-wider mt-0.5 ml-5">
                                                                Enables <code className="font-mono">/qr/{form.watch("slug") || "<slug>"}</code>
                                                            </FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75" />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <Separator className="bg-border opacity-50" />

                                            <div className="grid gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="maxClicks"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Click Limit</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="number"
                                                                    placeholder="∞"
                                                                    className="h-12 bg-muted/20 border-border rounded-xl font-black shadow-inner text-center"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="expiresAt"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Expiration</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="datetime-local"
                                                                    className="h-12 bg-muted/20 border-border rounded-xl font-black shadow-inner text-[10px] px-3"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Fixed Action Hub at bottom of right column on large screens, or stacked on mobile */}
                            <div className="pt-4 flex flex-col items-center gap-6">
                                <Button
                                    type="submit"
                                    disabled={creating || isRedirecting}
                                    className="w-full h-20 rounded-[30px] bg-primary text-primary-foreground font-black uppercase tracking-[0.4em] text-sm shadow-[0_25px_50px_-12px_rgba(var(--primary),0.4)] hover:opacity-90 active:scale-[0.98] transition-all border border-primary/20 group overflow-hidden relative"
                                >
                                    <span className="relative z-10 flex items-center gap-4">
                                        {creating || isRedirecting ? (
                                            <>
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                {isRedirecting ? "Finalizing..." : "Creating..."}
                                            </>
                                        ) : (
                                            <>
                                                Create Link
                                                <Activity className="h-5 w-5 fill-current transition-transform group-hover:scale-125 group-hover:rotate-12" />
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                </Button>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-40">
                                    VER 2.4.0 — SECURE
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
