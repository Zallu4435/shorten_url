import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format large numbers: 12345 → "12.3k"
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

// Format ISO date string → "Feb 20, 2026"
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format ISO date string → "Feb 20, 2026 at 3:22 PM"
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Relative time: "2 hours ago", "3 days ago"
export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) return `${count} ${label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

// Truncate long URLs for display
export function truncateUrl(url: string, maxLength = 50): string {
  if (url.length <= maxLength) return url;
  return url.slice(0, maxLength) + "…";
}

// Extract domain from URL: "https://github.com/foo" → "github.com"
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Generate a consistent colour from a string (for avatar placeholders etc.)
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
}

// Get initials from name: "John Doe" → "JD"
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Build the full short URL from just a slug
export function buildShortUrl(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  return `${base}/${slug}`;
}
