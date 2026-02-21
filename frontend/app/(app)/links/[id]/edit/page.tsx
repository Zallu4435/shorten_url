import { LinkSettingsClient } from "./LinkSettingsClient";

export default async function LinkSettingsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <LinkSettingsClient id={id} />;
}
