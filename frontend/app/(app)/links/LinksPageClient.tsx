"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Plus, Search, SlidersHorizontal, Link2 } from "lucide-react";
import Link from "next/link";

import { MY_URLS_QUERY } from "@/lib/graphql/queries";
import { LinkCard } from "@/components/links/LinkCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyTerminal } from "@/components/shared/EmptyTerminal";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import { FilterSelect } from "@/components/shared/FilterSelect";
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

    // Client-side filter + search
    const filtered = allUrls.filter((url: ShortURL) => {
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
        <div className="max-w-[1400px] mx-auto space-y-12 py-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Header */}
            <PageHeader
                title="Link Hub"
                description="Global network oversight & entry point management"
                icon={Link2}
                stats={{
                    label: "Discovered Nodes",
                    value: total,
                    unit: "NODES"
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
                    placeholder="Filter by slug, destination, or title…"
                    value={search}
                    onChange={setSearch}
                    className="flex-1"
                />
                <FilterSelect
                    value={filter}
                    onValueChange={setFilter}
                    options={[
                        { label: "All Traffic", value: "all" },
                        { label: "Active Nodes", value: "active" },
                        { label: "Offline", value: "inactive" },
                        { label: "Private", value: "private" },
                        { label: "Flagged", value: "flagged" },
                    ]}
                    className="sm:w-48"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyTerminal
                    title={search || filter !== "all" ? "No results found" : "No links discovered"}
                    description={search || filter !== "all"
                        ? "Adjust your filters or search terms to find what you're looking for."
                        : "Start building your network by creating your first shortened URL."}
                    icon={Link2}
                    actionLabel={!search && filter === "all" ? "Create Link" : undefined}
                    actionHref="/links/new"
                />
            ) : (
                <div className="grid gap-4">
                    {filtered.map((url: ShortURL) => (
                        <LinkCard key={url.id} url={url} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Node {page} <span className="text-muted-foreground mx-1">/</span> {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg font-bold hover:bg-muted border-border"
                            disabled={page <= 1}
                            onClick={() => {
                                setPage((p) => p - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg font-bold hover:bg-muted border-border"
                            disabled={page >= totalPages}
                            onClick={() => {
                                setPage((p) => p + 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
