"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    /** Current active page (1-indexed) */
    page: number;
    /** Total number of pages */
    totalPages: number;
    /** Total record count — shown in the status label */
    total: number;
    /** Called with the new page number when Previous / Next / a page dot is clicked */
    onPageChange: (page: number) => void;
    /** Optional extra class on the wrapper */
    className?: string;
}

/**
 * Reusable pagination bar.
 *
 * Usage:
 *   <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
 *
 * Drop-in for LinksPageClient, AdminUsersPage, AdminURLsPage, or any future list page.
 */
export function Pagination({
    page,
    totalPages,
    total,
    onPageChange,
    className,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    // Build a compact page-dot list (max 7 visible, with ellipsis)
    const getPageNumbers = (): (number | "…")[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (page <= 4) {
            return [1, 2, 3, 4, 5, "…", totalPages];
        }
        if (page >= totalPages - 3) {
            return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, "…", page - 1, page, page + 1, "…", totalPages];
    };

    const pages = getPageNumbers();

    return (
        <div
            className={cn(
                "flex flex-col sm:flex-row items-center justify-between gap-4",
                "border-t border-border/50 pt-6",
                className
            )}
        >
            {/* Left — status label */}
            <div className="flex items-center gap-3">
                {/* Pulsing dot */}
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] tabular-nums">
                    Page{" "}
                    <span className="text-foreground">{page}</span>
                    {" "}of{" "}
                    <span className="text-foreground">{totalPages}</span>
                    <span className="mx-2 text-border">·</span>
                    <span className="text-foreground">{total.toLocaleString()}</span>{" "}total
                </p>
            </div>

            {/* Right — page controls */}
            <div className="flex items-center gap-1">
                {/* Previous */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl border border-border/50 bg-muted/20 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page number dots */}
                <div className="flex items-center gap-1 mx-1">
                    {pages.map((p, idx) =>
                        p === "…" ? (
                            <span
                                key={`ellipsis-${idx}`}
                                className="w-8 text-center text-[11px] font-bold text-muted-foreground/50 select-none"
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onPageChange(p as number)}
                                className={cn(
                                    "h-9 w-9 rounded-xl text-[11px] font-black transition-all select-none",
                                    "border focus:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                                    p === page
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                                        : "bg-muted/20 text-muted-foreground border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                                )}
                                aria-label={`Page ${p}`}
                                aria-current={p === page ? "page" : undefined}
                            >
                                {p}
                            </button>
                        )
                    )}
                </div>

                {/* Next */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl border border-border/50 bg-muted/20 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all disabled:opacity-30 disabled:pointer-events-none"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
