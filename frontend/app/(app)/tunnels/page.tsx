import type { Metadata } from "next";
import { TunnelsPageClient } from "./TunnelsPageClient";

export const metadata: Metadata = {
    title: "Matrix Tunnels | Shorten URL Matrix",
    description: "Manage and monitor your private network nodes."
};

export default function TunnelsPage() {
    return <TunnelsPageClient />;
}
