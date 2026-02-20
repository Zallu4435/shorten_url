"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLinkSchema, type CreateLinkValues } from "@/lib/validations/links";
import { useMutation, useLazyQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import {
    Loader2,
    Sparkles,
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


export function CreateLinkClient() {
    const router = useRouter();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [slugSuggestions, setSlugSuggestions] = useState<SlugSuggestion[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

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
            password: "",
            maxClicks: "",
            expiresAt: "",
            webhookUrl: "",
        },
    });

    const [createUrl, { loading: creating }] = useMutation(
        CREATE_SHORT_URL_MUTATION,
        {
            refetchQueries: [MY_URLS_QUERY],
            onCompleted: (data) => {
                toast.success("Node successfully provisioned", {
                    description: `Endpoint /${data.createShortUrl.slug} is now live.`,
                });
                router.push(`/links/${data.createShortUrl.id}`);
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
        const url = form.getValues("originalUrl");
        if (!url) {
            toast.error("Destination URL required");
            return;
        }
        setAiLoading(true);
        try {
            const [slugResult, metaResult] = await Promise.allSettled([
                getSlugs({ variables: { url, count: 5 } }),
                getMetadata({ variables: { url } }),
            ]);

            if (slugResult.status === "fulfilled" && slugResult.value.data?.suggestSlugs) {
                setSlugSuggestions(slugResult.value.data.suggestSlugs);
            }
            if (
                metaResult.status === "fulfilled" &&
                metaResult.value.data?.generateUrlMetadata
            ) {
                const meta = metaResult.value.data.generateUrlMetadata;
                if (meta.title && !form.getValues("title")) {
                    form.setValue("title", meta.title);
                }
                if (meta.description && !form.getValues("description")) {
                    form.setValue("description", meta.description);
                }
                toast.success("Intelligence data synthesized");
            }
        } catch {
            toast.error("AI node diagnostics failed");
        } finally {
            setAiLoading(false);
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
                maxClicks: isNaN(clicks) ? undefined : clicks,
                expiresAt: values.expiresAt || undefined,
                webhookUrl: values.webhookUrl || undefined,
            },
        });
    };

    return (
        <div className="max-w-2xl mx-auto py-8 animate-in fade-in duration-700">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors mb-8 group"
            >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Return to Hub
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Provision New Endpoint
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground mt-1.5 leading-relaxed">
                        Establish a new network node to route traffic and capture deep analytics.
                        Use our intelligence engine to auto-generate optimal metadata.
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Primary Config */}
                    <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
                        <CardHeader className="pb-4 bg-muted/30 border-b border-border">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                                <Link2 className="h-4 w-4 text-primary" />
                                Destination Protocol
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <FormField
                                control={form.control}
                                name="originalUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="url"
                                                placeholder="https://destination-node.com/resource"
                                                autoFocus
                                                className="h-12 bg-background border-border text-base font-medium focus-visible:ring-primary/20 rounded-xl shadow-sm"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold" />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAISuggest}
                                disabled={aiLoading}
                                className="w-full h-11 rounded-xl border-violet-500/30 bg-violet-500/[0.03] hover:bg-violet-500/10 text-violet-600 font-bold transition-all group shadow-sm"
                            >
                                {aiLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                                )}
                                {aiLoading ? "Synthesizing Metadata..." : "AI: Intelligent Suggestions"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Slug Configuration */}
                    <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
                        <CardHeader className="pb-4 bg-muted/30 border-b border-border">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Endpoint Identification</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-3 p-1 rounded-xl bg-muted/50 border border-border">
                                            <span className="text-xs font-bold text-muted-foreground pl-3 uppercase tracking-tighter">
                                                SHORTEN.URL /
                                            </span>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="unique-path"
                                                    className="h-10 bg-transparent border-none focus-visible:ring-0 font-mono text-sm font-bold"
                                                />
                                            </FormControl>
                                        </div>
                                        <FormDescription className="text-[10px] font-bold uppercase tracking-widest mt-2 text-muted-foreground pl-1">
                                            Leave empty for randomized hash generation
                                        </FormDescription>
                                        <FormMessage className="text-xs font-bold" />
                                    </FormItem>
                                )}
                            />

                            {slugSuggestions.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest flex items-center gap-1.5">
                                        <Sparkles className="h-3 w-3" />
                                        Suggested Path Models
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {slugSuggestions.map((s) => {
                                            const isSelected = form.watch("slug") === s.slug;
                                            return (
                                                <button
                                                    key={s.slug}
                                                    type="button"
                                                    onClick={() => form.setValue("slug", s.slug)}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${isSelected
                                                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground shadow-sm"
                                                        }`}
                                                >
                                                    {s.slug}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Information Hierarchy */}
                    <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
                        <CardHeader className="pb-4 bg-muted/30 border-b border-border">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Intelligence Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Internal Label</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="e.g., Q1 Marketing Pipeline"
                                                className="h-11 bg-background border-border rounded-xl font-medium shadow-sm"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contextual Brief</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Explain the purpose of this network branch..."
                                                rows={3}
                                                className="bg-background border-border rounded-xl font-medium resize-none px-4 py-3 shadow-sm"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs font-bold" />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Operational Constraints Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced((v) => !v)}
                        className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all hover:bg-muted group shadow-sm hover:border-primary/30"
                    >
                        <span className="flex items-center gap-2">
                            {showAdvanced ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
                            Advanced Security & Constraints
                        </span>
                        <Badge variant="outline" className="bg-muted/50 text-[10px] font-black border-border">{showAdvanced ? "Active" : "Closed"}</Badge>
                    </button>

                    {showAdvanced && (
                        <Card className="rounded-2xl border-border bg-card shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-300">
                            <CardContent className="p-6 space-y-6">
                                <FormField
                                    control={form.control}
                                    name="isPrivate"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between p-1">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm font-bold">Access Encryption</FormLabel>
                                                <FormDescription className="text-xs font-medium">
                                                    Require cryptographic key for resolution
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {form.watch("isPrivate") && (
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem className="animate-in fade-in duration-300">
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest">Resolution Key</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="h-11 bg-background border-border rounded-xl shadow-sm"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs font-bold" />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <Separator className="bg-border" />

                                <FormField
                                    control={form.control}
                                    name="isSingleUse"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between p-1">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm font-bold">Ghost Mode</FormLabel>
                                                <FormDescription className="text-xs font-medium">
                                                    Purge destination after first resolution
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <Separator className="bg-border" />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                    <FormField
                                        control={form.control}
                                        name="maxClicks"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest">Traffic Cap</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        min={1}
                                                        placeholder="∞"
                                                        className="h-11 bg-background border-border rounded-xl font-bold shadow-sm"
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-[10px] uppercase font-bold text-muted-foreground">Maximum hits allowed</FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="expiresAt"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest">Terminal Date</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="datetime-local"
                                                        className="h-11 bg-background border-border rounded-xl font-bold text-xs shadow-sm"
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-[10px] uppercase font-bold text-muted-foreground">Auto-purge timestamp</FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Separator className="bg-border" />

                                <FormField
                                    control={form.control}
                                    name="webhookUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest font-mono">Event Relay (Webhook)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="url"
                                                    placeholder="https://relays.server.com/callback"
                                                    className="h-11 bg-background border-border rounded-xl text-xs font-mono shadow-sm"
                                                />
                                            </FormControl>
                                            <FormDescription className="text-[10px] uppercase font-bold text-muted-foreground leading-relaxed">
                                                Relay packet details to external terminal on every resolution
                                            </FormDescription>
                                            <FormMessage className="text-xs font-bold" />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-4 border-t border-border mt-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            className="h-12 px-8 rounded-xl font-bold text-muted-foreground hover:text-foreground border-border bg-background shadow-sm hover:bg-muted"
                            disabled={creating}
                        >
                            Abort
                        </Button>
                        <Button
                            type="submit"
                            disabled={creating}
                            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all border border-primary/20"
                        >
                            {creating ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Initialising Node...
                                </div>
                            ) : (
                                "Provision Endpoint"
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
