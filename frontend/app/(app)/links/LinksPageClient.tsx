"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { Plus, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

import { MY_URLS_QUERY } from "@/lib/graphql/queries";
import { useDebounce } from "@/hooks/useDebounce";
import { LinkCard } from "@/components/links/LinkCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyTerminal } from "@/components/shared/EmptyTerminal";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { PageLoading } from "@/components/shared/PageLoading";
import { Pagination } from "@/components/shared/Pagination";
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

    const { data, previousData, loading } = useQuery<{
        myUrls: { urls: ShortURL[]; total: number };
    }>(MY_URLS_QUERY, { variables });

    // previousData keeps old rows visible while new data loads — no full-page flicker
    const displayData = data ?? previousData;
    const urls = displayData?.myUrls?.urls ?? [];
    const total = displayData?.myUrls?.total ?? 0;
    const isFirstLoad = loading && !previousData && !data;
    const isRefetching = loading && !!displayData;

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const handleSearch = (v: string) => { setSearch(v); setPage(1); };
    const handleFilter = (v: string) => { setFilter(v); setPage(1); };
    const handleSort = (v: string) => { setSort(v); setPage(1); };
    const handlePageChange = (p: number) => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ── Full-page spinner only on the very first load (no data at all yet) ──
    if (isFirstLoad) {
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
                {/* Thin loading bar at top of card — only during refetch, not initial load */}
                {isRefetching && (
                    <div className="h-0.5 w-full bg-border overflow-hidden">
                        <div className="h-full bg-primary animate-[loading-bar_1s_ease-in-out_infinite]" style={{ animation: "slide 1.2s ease-in-out infinite" }} />
                    </div>
                )}
                <div className="divide-y divide-border">
                    {urls.length === 0 && !isRefetching ? (
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
            <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={handlePageChange}
            />
        </div>
    );
}
