"use client";

import { useCallback, useState } from "react";

export function useCopyToClipboard(timeout = 2000) {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(
        async (text: string) => {
            try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), timeout);
            } catch {
                // Fallback for non-HTTPS
                const el = document.createElement("textarea");
                el.value = text;
                el.style.cssText = "position:fixed;opacity:0";
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
                setCopied(true);
                setTimeout(() => setCopied(false), timeout);
            }
        },
        [timeout]
    );

    return { copied, copy };
}
