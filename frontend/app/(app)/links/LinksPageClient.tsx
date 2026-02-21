"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { Plus, Link as LinkIcon, ArrowUpDown } from "lucide-react";
import Link from "next/link";

import { MY_URLS_QUERY } from "@/lib/graphql/queries";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { LinkCard } from "@/components/links/LinkCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyTerminal } from "@/components/shared/EmptyTerminal";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { PageLoading } from "@/components/shared/PageLoading";
import { PAGE_SIZE, LINK_FILTER_OPTIONS, LINK_SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ShortURL } from "@/types";


/** Maps the filter dropdown value to GraphQL boolean variables */
function filterToVars(filter: string) {
    switch (filter) {
        case "active": return { isActive: true };
        case "inactive": return { isActive: false };
        case "private": return { isPrivate: true };
        case "flagged": return { isFlagged: true };
        default: return {};
    }
}

export function LinksPageClient() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    // ─── Debounce search — only fires query 400ms after user stops typing ───
    const debouncedSearch = useDebounce(search, 400);

    const variables = useMemo(() => ({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        orderBy: sort,
        ...filterToVars(filter),
    }), [page, debouncedSearch, sort, filter]);

    const { data, loading } = useQuery<{
        myUrls: { urls: ShortURL[]; total: number };
    }>(MY_URLS_QUERY, { variables });

    const urls = data?.myUrls?.urls ?? [];
    const total = data?.myUrls?.total ?? 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const handleSearch = (v: string) => { setSearch(v); setPage(1); };
    const handleFilter = (v: string) => { setFilter(v); setPage(1); };
    const handleSort = (v: string) => { setSort(v); setPage(1); };

    // Bold initial load
    if (loading && !data) {
        return <PageLoading message="RETRIEVING NETWORK REGISTRY..." className="min-h-[600px]" />;
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 py-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Header */}
            <PageHeader
                title="My Links"
                description="Manage and track your shortened URLs"
                icon={LinkIcon}
                stats={{
                    label: "Total Links",
                    value: total,
                    unit: "LINKS"
                }}
            >
                <Button asChild className="rounded-xl h-11 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[11px] transition-all hover:opacity-90 shadow-lg shadow-primary/20 border border-primary/20 active:scale-95">
                    <Link href="/links/new">
                        <Plus className="mr-2 h-4 w-4 stroke-[3px]" />
                        Create New Link
                    </Link>
                </Button>
            </PageHeader>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <SearchInput
                    placeholder="Search by slug, destination URL, or title…"
                    value={search}
                    onChange={handleSearch}
                    className="flex-1"
                />
                <FilterSelect
                    value={filter}
                    onValueChange={handleFilter}
                    options={LINK_FILTER_OPTIONS}
                    className="sm:w-44"
                />
                <FilterSelect
                    value={sort}
                    onValueChange={handleSort}
                    options={LINK_SORT_OPTIONS}
                    className="sm:w-44"
                />
            </div>

            {/* Results info */}
            {!loading && debouncedSearch && (
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {total} result{total !== 1 ? "s" : ""} for &quot;{debouncedSearch}&quot;
                </p>
            )}

            {/* Link Table */}
            <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden">
                <div className={cn("divide-y divide-border transition-all duration-300", loading && data ? "opacity-50 pointer-events-none" : "opacity-100")}>
                    {loading && !data ? (
                        // Initial load skeletons
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-[80px] w-full bg-muted animate-pulse" />
                        ))
                    ) : urls.length === 0 ? (
                        <div className="p-16">
                            <EmptyTerminal
                                title={debouncedSearch || filter !== "all" ? "No results found" : "No links discovered"}
                                description={
                                    debouncedSearch || filter !== "all"
                                        ? "Try adjusting your search or filters."
                                        : "Start building your network by creating your first shortened URL."
                                }
                                icon={LinkIcon}
                                actionLabel={!debouncedSearch && filter === "all" ? "Create Link" : undefined}
                                actionHref="/links/new"
                            />
                        </div>
                    ) : (
                        urls.map((url: ShortURL) => (
                            <LinkCard key={url.id} url={url} />
                        ))
                    )}
                </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Page {page} / {totalPages} &mdash; {total} total
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg font-bold hover:bg-muted border-border"
                            disabled={page <= 1}
                            onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg font-bold hover:bg-muted border-border"
                            disabled={page >= totalPages}
                            onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
