"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Flag, FlagOff, Link, Globe, AlertCircle, MousePointer2, Calendar, Trash2, Loader2 } from "lucide-react";

import { ALL_URLS_ADMIN_QUERY } from "@/lib/graphql/queries";
import {
    FLAG_URL_MUTATION,
    UNFLAG_URL_MUTATION,
    ADMIN_DELETE_URL_MUTATION,
} from "@/lib/graphql/mutations";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyTerminal } from "@/components/shared/EmptyTerminal";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { useDebounce } from "@/hooks/useDebounce";
import { ADMIN_PAGE_SIZE, URL_STATUS_OPTIONS, URL_SORT_OPTIONS } from "@/lib/constants";
import { toast } from "sonner";
import { formatNumber, timeAgo, truncateUrl, cn } from "@/lib/utils";
import type { ShortURL, PaginatedAdminURLs } from "@/types";

export default function AdminUrlsPage() {
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    // Debounce: fires GraphQL only 400ms after the user stops typing
    const debouncedSearch = useDebounce(search, 400);

    const variables = useMemo(() => ({
        page,
        limit: ADMIN_PAGE_SIZE,
        search: debouncedSearch || undefined,
        flaggedOnly: tab === "flagged",
        orderBy: sort,
    }), [page, debouncedSearch, tab, sort]);

    const { data, loading, refetch } = useQuery<{ allUrls: PaginatedAdminURLs }>(
        ALL_URLS_ADMIN_QUERY,
        { variables }
    );

    const [flagUrl, { loading: flagging }] = useMutation(FLAG_URL_MUTATION, {
        onCompleted: () => { toast.success("URL flagged"); refetch(); },
        onError: (err) => toast.error(err.message),
    });
    const [unflagUrl, { loading: unflagging }] = useMutation(UNFLAG_URL_MUTATION, {
        onCompleted: () => { toast.success("URL unflagged"); refetch(); },
        onError: (err) => toast.error(err.message),
    });
    const [deleteUrl, { loading: purging }] = useMutation(ADMIN_DELETE_URL_MUTATION, {
        onCompleted: () => { toast.success("URL deleted"); refetch(); },
        onError: (err) => toast.error(err.message),
    });

    const urls = data?.allUrls?.urls ?? [];
    const total = data?.allUrls?.total ?? 0;
    const totalPages = Math.ceil(total / ADMIN_PAGE_SIZE);

    const handleSearch = (v: string) => { setSearch(v); setPage(1); };
    const handleTab = (v: string) => { setTab(v); setPage(1); };
    const handleSort = (v: string) => { setSort(v); setPage(1); };


    return (
        <div className="space-y-12 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            <PageHeader
                title="Link Management"
                description="Monitor and manage all shortened URLs"
                icon={Link}
                stats={{ label: "Total Links", value: total, unit: "Links" }}
            />

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <SearchInput
                    placeholder="Search slug or destination URL…"
                    value={search}
                    onChange={handleSearch}
                    className="flex-1"
                />
                <FilterSelect
                    value={tab}
                    onValueChange={handleTab}
                    options={URL_STATUS_OPTIONS}
                    className="sm:w-44"
                />
                <FilterSelect
                    value={sort}
                    onValueChange={handleSort}
                    options={URL_SORT_OPTIONS}
                    className="sm:w-44"
                />
            </div>

            {!loading && debouncedSearch && (
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {total} link{total !== 1 ? "s" : ""} matched &quot;{debouncedSearch}&quot;
                </p>
            )}

            <div className="space-y-4">
                <TechnicalIndicator label="Link Directory" icon={Globe} />
                <div className="rounded-[32px] border border-border bg-card shadow-sm overflow-hidden backdrop-blur-sm">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-b border-border">
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Shortened URL</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hidden md:table-cell">Created By</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Clicks</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hidden lg:table-cell">Created</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className={cn("transition-opacity", loading && "opacity-40 pointer-events-none")}>
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                                : urls.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-20">
                                            <EmptyTerminal
                                                title="No Links Found"
                                                description="No links matched your search or filter parameters."
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : urls.map((url: ShortURL) => (
                                    <TableRow
                                        key={url.id}
                                        className={cn(
                                            "group hover:bg-muted/30 border-b border-border/50 transition-colors",
                                            url.isFlagged && "bg-red-500/[0.02]"
                                        )}
                                    >
                                        <TableCell className="py-5 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center group-hover:border-primary/30 transition-all">
                                                    <Globe className={`h-5 w-5 ${url.isFlagged ? "text-red-500" : "text-primary/70"}`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-foreground tracking-tight font-mono">/{url.slug}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground truncate max-w-[200px] mt-0.5">
                                                        {truncateUrl(url.originalUrl, 50)}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-8 hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-black text-muted-foreground uppercase">
                                                    {url.user?.username?.slice(0, 1) ?? "?"}
                                                </div>
                                                <p className="text-[11px] font-bold text-muted-foreground tracking-tight">
                                                    {url.user?.username ?? "System"}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-8">
                                            <div className="flex flex-wrap gap-2">
                                                {url.isActive ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 h-6 rounded-lg">Active</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-muted text-muted-foreground border border-border text-[10px] font-black uppercase tracking-widest px-3 h-6 rounded-lg">Inactive</Badge>
                                                )}
                                                {url.isFlagged && (
                                                    <Badge variant="destructive" className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest px-3 h-6 rounded-lg shadow-sm">
                                                        <AlertCircle className="mr-1.5 h-3 w-3" />Flagged
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-8">
                                            <div className="flex items-center gap-2 font-black tabular-nums text-sm text-foreground tracking-tighter">
                                                <MousePointer2 className="h-4 w-4 text-muted-foreground" />
                                                {formatNumber(url.clickCount)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-8 hidden lg:table-cell text-[11px] font-bold text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {timeAgo(url.createdAt)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-8 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {url.isFlagged ? (
                                                    <Button variant="ghost" size="sm"
                                                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-emerald-500/10 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-500/20"
                                                        onClick={() => unflagUrl({ variables: { urlId: url.id } })}
                                                        disabled={unflagging}
                                                    >
                                                        {unflagging ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FlagOff className="h-4 w-4" />Unflag</>}
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="sm"
                                                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 text-amber-500 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20"
                                                        onClick={() => flagUrl({ variables: { urlId: url.id, reason: "Manual admin flag" } })}
                                                        disabled={flagging}
                                                    >
                                                        {flagging ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Flag className="h-4 w-4" />Flag</>}
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm"
                                                    className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 group"
                                                    onClick={() => deleteUrl({ variables: { urlId: url.id } })}
                                                    disabled={purging}
                                                >
                                                    {purging ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />Delete</>}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-muted/20 border border-border p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        Page {page} of {totalPages} — {total} total
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold border-border"
                            disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                        >Previous</Button>
                        <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold border-border"
                            disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                        >Next</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
