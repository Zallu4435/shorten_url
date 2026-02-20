import type { Metadata } from "next";
import { LinksPageClient } from "./LinksPageClient";

export const metadata: Metadata = { title: "My Links" };

export default function LinksPage() {
    return <LinksPageClient />;
}
