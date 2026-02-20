"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useLazyQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import {
    Loader2,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Link2,
    Check,
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

const createSchema = z.object({
    originalUrl: z.string().url("Please enter a valid URL"),
    slug: z
        .string()
        .regex(/^[a-zA-Z0-9_-]*$/, "Only letters, numbers, hyphens, underscores")
        .default(""),
    title: z.string().max(160).default(""),
    description: z.string().max(500).default(""),
    isPrivate: z.boolean().default(false),
    password: z.string().default(""),
    isSingleUse: z.boolean().default(false),
    maxClicks: z.string().default(""),
    expiresAt: z.string().default(""),
    webhookUrl: z
        .string()
        .refine((v) => !v || /^https?:\/\/./.test(v), "Enter a valid webhook URL")
        .default(""),
});

type CreateValues = z.infer<typeof createSchema>;

export function CreateLinkClient() {
    const router = useRouter();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [slugSuggestions, setSlugSuggestions] = useState<SlugSuggestion[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

    const form = useForm<CreateValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(createSchema) as any,
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
                toast.success("Link created!", {
                    description: `/${data.createShortUrl.slug} is ready to share`,
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
            toast.error("Enter a URL first");
            return;
        }
        setAiLoading(true);
        try {
            // Run both in parallel
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
                toast.success("AI metadata filled in");
            }
        } catch {
            toast.error("AI suggestions unavailable");
        } finally {
            setAiLoading(false);
        }
    };

    const onSubmit = async (values: CreateValues) => {
        await createUrl({
            variables: {
                originalUrl: values.originalUrl,
                slug: values.slug || undefined,
                title: values.title || undefined,
                description: values.description || undefined,
                isPrivate: values.isPrivate,
                password: values.password || undefined,
                isSingleUse: values.isSingleUse,
                maxClicks: values.maxClicks ? parseInt(values.maxClicks) : undefined,
                expiresAt: values.expiresAt || undefined,
                webhookUrl: values.webhookUrl || undefined,
            },
        });
    };

    return (
        <div className="max-w-2xl space-y-5">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">New link</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Shorten a URL and track its performance
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* URL input */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Link2 className="h-4 w-4 text-primary" />
                                Destination URL
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="originalUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="url"
                                                placeholder="https://example.com/very-long-url-here"
                                                autoFocus
                                                className="bg-background"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* AI suggestions button */}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAISuggest}
                                disabled={aiLoading}
                                className="gap-2"
                            >
                                {aiLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                                )}
                                {aiLoading ? "Generating…" : "AI: suggest slug & metadata"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Slug */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Custom slug</CardTitle>
                            <CardDescription>
                                Leave blank to auto-generate a random slug
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground shrink-0">
                                                {process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}
                                                /
                                            </span>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="my-slug"
                                                    className="bg-background font-mono"
                                                />
                                            </FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* AI slug chips */}
                            {slugSuggestions.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Sparkles className="h-3 w-3 text-violet-500" />
                                        AI suggestions — click to use
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {slugSuggestions.map((s) => {
                                            const isSelected = form.watch("slug") === s.slug;
                                            return (
                                                <button
                                                    key={s.slug}
                                                    type="button"
                                                    onClick={() => form.setValue("slug", s.slug)}
                                                    title={s.reason}
                                                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono transition-colors ${isSelected
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                                        }`}
                                                >
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                    {s.slug}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Title + Description */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Details</CardTitle>
                            <CardDescription>
                                Optional metadata to identify this link in your dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Product launch page"
                                                className="bg-background"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="A short description of the link…"
                                                rows={2}
                                                className="bg-background resize-none"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* Advanced options toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced((v) => !v)}
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                        Advanced options
                        {showAdvanced ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                    </button>

                    {showAdvanced && (
                        <Card>
                            <CardContent className="pt-5 space-y-5">
                                {/* Private + Password */}
                                <FormField
                                    control={form.control}
                                    name="isPrivate"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between">
                                            <div>
                                                <FormLabel>Private link</FormLabel>
                                                <FormDescription className="text-xs">
                                                    Require a password to access
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
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="bg-background"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <Separator />

                                {/* Single use */}
                                <FormField
                                    control={form.control}
                                    name="isSingleUse"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between">
                                            <div>
                                                <FormLabel>Single-use</FormLabel>
                                                <FormDescription className="text-xs">
                                                    Deactivate after the first click
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

                                <Separator />

                                {/* Click limit */}
                                <FormField
                                    control={form.control}
                                    name="maxClicks"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Click limit</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="number"
                                                    min={1}
                                                    placeholder="Unlimited"
                                                    className="bg-background"
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Deactivate after N clicks
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />

                                {/* Expiry date */}
                                <FormField
                                    control={form.control}
                                    name="expiresAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expires at</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="datetime-local"
                                                    className="bg-background"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {/* Webhook */}
                                <FormField
                                    control={form.control}
                                    name="webhookUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Webhook URL</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="url"
                                                    placeholder="https://hooks.example.com/click"
                                                    className="bg-background"
                                                />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                POST request sent on every click
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Submit */}
                    <div className="flex gap-3 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={creating}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={creating} className="flex-1">
                            {creating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating…
                                </>
                            ) : (
                                "Create link"
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
