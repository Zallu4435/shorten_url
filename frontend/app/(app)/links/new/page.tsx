import type { Metadata } from "next";
import { CreateLinkClient } from "./CreateLinkClient";

export const metadata: Metadata = { title: "New Link" };

export default function NewLinkPage() {
    return <CreateLinkClient />;
}
