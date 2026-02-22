// ─── Pagination ───────────────────────────────────────────────────────
export const PAGE_SIZE = 10;

// ─── Filter dropdown options (Links page) ─────────────────────────────
export const LINK_FILTER_OPTIONS = [
    { label: "All Links", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Private", value: "private" },
    { label: "Flagged", value: "flagged" },
];

// ─── Sort dropdown options (Links page) ───────────────────────────────
export const LINK_SORT_OPTIONS = [
    { label: "Newest First", value: "newest" },
    { label: "Oldest First", value: "oldest" },
    { label: "Most Clicks", value: "clicks_desc" },
    { label: "A → Z (slug)", value: "slug_asc" },
];
