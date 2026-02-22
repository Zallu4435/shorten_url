// ─── Pagination ───────────────────────────────────────────────────────
export const ADMIN_PAGE_SIZE = 10;

// ─── Admin Users: filter options ──────────────────────────────────────
export const USER_ROLE_OPTIONS = [
    { label: "All Identities", value: "all" },
    { label: "Commanders (Admin)", value: "admin" },
    { label: "Observers (User)", value: "user" },
];

// ─── Admin Users: sort options ────────────────────────────────────────
export const USER_SORT_OPTIONS = [
    { label: "Newest First", value: "newest" },
    { label: "Oldest First", value: "oldest" },
    { label: "A → Z (username)", value: "username_asc" },
];

// ─── Admin URLs: status filter options ────────────────────────────────
export const URL_STATUS_OPTIONS = [
    { label: "All Nodes", value: "all" },
    { label: "Flagged Only", value: "flagged" },
];

// ─── Admin URLs: sort options ─────────────────────────────────────────
export const URL_SORT_OPTIONS = [
    { label: "Newest First", value: "newest" },
    { label: "Oldest First", value: "oldest" },
    { label: "Most Clicks", value: "clicks_desc" },
    { label: "A → Z (slug)", value: "slug_asc" },
];
