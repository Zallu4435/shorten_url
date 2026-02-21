import type { Metadata } from "next";
import { LinkDetailClient } from "./LinkDetailClient";

export const metadata: Metadata = { title: "Link Detail" };

export default async function LinkDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <LinkDetailClient id={id} />;
}
