"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
    BarChart3,
    Check,
    Copy,
    ExternalLink,
    MoreHorizontal,
    Pencil,
    QrCode,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { UPDATE_SHORT_URL_MUTATION, DELETE_SHORT_URL_MUTATION } from "@/lib/graphql/mutations";
import { MY_URLS_QUERY } from "@/lib/graphql/queries";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { formatNumber, timeAgo, truncateUrl } from "@/lib/utils";
import type { ShortURL } from "@/types";

interface LinkCardProps {
    url: ShortURL;
}

export function LinkCard({ url }: LinkCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const { copied, copy } = useCopyToClipboard();

    const [updateUrl, { loading: updating }] = useMutation(UPDATE_SHORT_URL_MUTATION, {
        refetchQueries: [MY_URLS_QUERY],
    });

    const [deleteUrl, { loading: deleting }] = useMutation(DELETE_SHORT_URL_MUTATION, {
        refetchQueries: [MY_URLS_QUERY],
        onCompleted: () => toast.success("Link deleted"),
        onError: (err) => toast.error(err.message),
    });

    const handleCopy = () => {
        copy(url.shortUrl);
        toast.success("Copied to clipboard");
    };

    const handleToggleActive = async () => {
        try {
            await updateUrl({ variables: { id: url.id, isActive: !url.isActive } });
        } catch {
            toast.error("Failed to update link");
        }
    };

    const handleDelete = async () => {
        await deleteUrl({ variables: { id: url.id } });
        setShowDeleteDialog(false);
    };

    return (
        <>
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm group">
                {/* Active toggle */}
                <Switch
                    checked={url.isActive}
                    onCheckedChange={handleToggleActive}
                    disabled={updating}
                    aria-label={url.isActive ? "Deactivate link" : "Activate link"}
                    className="shrink-0"
                />

                {/* Link info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link
                            href={`/links/${url.id}`}
                            className="text-sm font-semibold hover:text-primary transition-colors"
                        >
                            /{url.slug}
                        </Link>
                        {url.isPrivate && (
                            <Badge variant="secondary" className="text-xs">Private</Badge>
                        )}
                        {url.isSingleUse && (
                            <Badge variant="secondary" className="text-xs">Single-use</Badge>
                        )}
                        {url.isFlagged && (
                            <Badge variant="destructive" className="text-xs">Flagged</Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {truncateUrl(url.originalUrl, 72)}
                    </p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex flex-col items-end shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                        {formatNumber(url.clickCount)}
                    </span>
                    <span className="text-xs text-muted-foreground">clicks</span>
                </div>

                {/* Created */}
                <div className="hidden lg:block text-xs text-muted-foreground shrink-0 w-20 text-right">
                    {timeAgo(url.createdAt)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {/* Copy */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={handleCopy}
                        aria-label="Copy short URL"
                    >
                        {copied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                    </Button>

                    {/* Analytics */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                        <Link href={`/links/${url.id}`} aria-label="View analytics">
                            <BarChart3 className="h-3.5 w-3.5" />
                        </Link>
                    </Button>

                    {/* More menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                aria-label="More options"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <a
                                    href={url.shortUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="cursor-pointer"
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Open link
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={`/links/${url.id}`} className="cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                            {url.qrCode && (
                                <DropdownMenuItem>
                                    <QrCode className="mr-2 h-4 w-4" />
                                    View QR code
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Delete confirm dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete link</DialogTitle>
                        <DialogDescription>
                            This will permanently delete{" "}
                            <span className="font-mono text-foreground">/{url.slug}</span> and
                            all its analytics. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting…" : "Delete link"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
