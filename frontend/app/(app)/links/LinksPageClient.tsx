"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { MY_URLS_QUERY } from "@/lib/graphql/queries";
import { LinkCard } from "@/components/links/LinkCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { ShortURL } from "@/types";

const PAGE_SIZE = 20;

export function LinksPageClient() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);

    const { data, loading } = useQuery<{
        myUrls: { urls: ShortURL[]; total: number };
    }>(MY_URLS_QUERY, {
        variables: { page, limit: PAGE_SIZE },
    });

    const allUrls = data?.myUrls?.urls ?? [];
    const total = data?.myUrls?.total ?? 0;

    // Client-side filter + search (data already paginated server-side)
    const filtered = allUrls.filter((url) => {
        const matchSearch =
            !search ||
            url.slug.toLowerCase().includes(search.toLowerCase()) ||
            url.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
            url.title?.toLowerCase().includes(search.toLowerCase());

        const matchFilter =
            filter === "all" ||
            (filter === "active" && url.isActive) ||
            (filter === "inactive" && !url.isActive) ||
            (filter === "private" && url.isPrivate) ||
            (filter === "flagged" && url.isFlagged);

        return matchSearch && matchFilter;
    });

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">My Links</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {loading ? "Loading…" : `${total} link${total !== 1 ? "s" : ""} total`}
                    </p>
                </div>
                <Button asChild size="sm">
                    <Link href="/links/new">
                        <Plus className="mr-1.5 h-4 w-4" />
                        New link
                    </Link>
                </Button>
            </div>

            {/* Search + Filter bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search by slug, URL, or title…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-background"
                    />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-36 bg-background">
                        <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All links</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Link list */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border py-16 text-center">
                    <p className="text-muted-foreground text-sm">
                        {search || filter !== "all"
                            ? "No links match your search."
                            : "No links yet."}
                    </p>
                    {!search && filter === "all" && (
                        <Button asChild variant="outline" size="sm" className="mt-3">
                            <Link href="/links/new">Create your first link</Link>
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((url) => (
                        <LinkCard key={url.id} url={url} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
