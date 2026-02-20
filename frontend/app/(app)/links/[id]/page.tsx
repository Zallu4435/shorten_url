import type { Metadata } from "next";
import { LinkDetailClient } from "./LinkDetailClient";

export const metadata: Metadata = { title: "Link Detail" };

export default function LinkDetailPage({
    params,
}: {
    params: { id: string };
}) {
    return <LinkDetailClient id={params.id} />;
}
