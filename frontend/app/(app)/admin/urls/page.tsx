"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Search, Flag, FlagOff } from "lucide-react";

import { ALL_URLS_ADMIN_QUERY } from "@/lib/graphql/queries";
import {
    FLAG_URL_MUTATION,
    UNFLAG_URL_MUTATION,
    ADMIN_DELETE_URL_MUTATION,
} from "@/lib/graphql/mutations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, timeAgo, truncateUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { ShortURL, PaginatedAdminURLs } from "@/types";

export default function AdminUrlsPage() {
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all");
    const [page, setPage] = useState(1);

    const { data, loading, refetch } = useQuery<{ allUrls: PaginatedAdminURLs }>(
        ALL_URLS_ADMIN_QUERY,
        {
            variables: {
                page,
                limit: 20,
                search: search || undefined,
                flaggedOnly: tab === "flagged",
            },
        }
    );

    const [flagUrl] = useMutation(FLAG_URL_MUTATION, {
        onCompleted: () => { toast.success("URL flagged"); refetch(); },
    });
    const [unflagUrl] = useMutation(UNFLAG_URL_MUTATION, {
        onCompleted: () => { toast.success("URL unflagged"); refetch(); },
    });
    const [deleteUrl] = useMutation(ADMIN_DELETE_URL_MUTATION, {
        onCompleted: () => { toast.success("URL deleted"); refetch(); },
    });

    const urls = data?.allUrls?.urls ?? [];
    const total = data?.allUrls?.total ?? 0;

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">URLs</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {loading ? "Loading…" : `${total} URLs`}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="flagged">Flagged</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search by slug or URL…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="pl-9 bg-background"
                    />
                </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Slug</TableHead>
                            <TableHead className="hidden md:table-cell">Owner</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead className="hidden lg:table-cell">Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading
                            ? Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6}>
                                        <Skeleton className="h-8 w-full" />
                                    </TableCell>
                                </TableRow>
                            ))
                            : urls.map((url: ShortURL) => (
                                <TableRow
                                    key={url.id}
                                    className={`row-hover ${url.isFlagged ? "bg-destructive/5" : ""}`}
                                >
                                    <TableCell>
                                        <div>
                                            <p className="text-sm font-mono font-medium">/{url.slug}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                {truncateUrl(url.originalUrl, 40)}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <p className="text-xs text-muted-foreground">
                                            {url.user?.username ?? "—"}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {url.isActive ? (
                                                <Badge variant="secondary" className="text-xs">Active</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                                            )}
                                            {url.isFlagged && (
                                                <Badge variant="destructive" className="text-xs">
                                                    Flagged
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium tabular-nums text-sm">
                                        {formatNumber(url.clickCount)}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                                        {timeAgo(url.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {url.isFlagged ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs h-7"
                                                    onClick={() =>
                                                        unflagUrl({ variables: { urlId: url.id } })
                                                    }
                                                >
                                                    <FlagOff className="mr-1 h-3.5 w-3.5" />
                                                    Unflag
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs h-7 text-amber-500 hover:text-amber-600"
                                                    onClick={() =>
                                                        flagUrl({
                                                            variables: {
                                                                urlId: url.id,
                                                                reason: "Manual admin flag",
                                                            },
                                                        })
                                                    }
                                                >
                                                    <Flag className="mr-1 h-3.5 w-3.5" />
                                                    Flag
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs h-7 text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    deleteUrl({ variables: { urlId: url.id } })
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>

            {Math.ceil(total / 20) > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Page {page} of {Math.ceil(total / 20)}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                        <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
