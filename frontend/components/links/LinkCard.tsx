"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
    BarChart,
    Check,
    Copy,
    ExternalLink,
    MoreHorizontal,
    Pencil,
    Scan,
    Trash2,
    Loader2,
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
import { formatNumber, timeAgo, truncateUrl, cn } from "@/lib/utils";
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
        onCompleted: () => toast.success("Endpoint terminated successfully"),
        onError: (err) => toast.error(err.message),
    });

    const handleCopy = () => {
        copy(url.shortUrl);
        toast.success("URL copied to buffer");
    };

    const handleToggleActive = async () => {
        try {
            await updateUrl({ variables: { id: url.id, isActive: !url.isActive } });
        } catch {
            toast.error("Failed to reconfigure node");
        }
    };

    const handleDelete = async () => {
        await deleteUrl({ variables: { id: url.id } });
        setShowDeleteDialog(false);
    };

    return (
        <>
            <div className={cn(
                "flex items-center gap-6 px-8 py-5 group transition-all duration-300 relative overflow-hidden",
                url.isActive ? "hover:bg-muted/40" : "opacity-60 grayscale-[0.6] bg-muted/5 cursor-not-allowed"
            )}>
                {/* Deactivated — subtle left border accent on the row */}
                {!url.isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-muted-foreground/20 rounded-full" />
                )}

                {/* Status Section */}
                <div className="flex items-center gap-4 shrink-0 relative z-10">
                    <Switch
                        checked={url.isActive}
                        onCheckedChange={handleToggleActive}
                        disabled={updating}
                        className="data-[state=checked]:bg-emerald-500"
                    />
                    <div className={cn(
                        "h-2 w-2 rounded-full transition-all duration-500",
                        url.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-muted-foreground/30 scale-75"
                    )} />
                </div>

                {/* Main Content */}
                <div className="min-w-0 flex-1 relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href={url.isActive ? `/links/${url.id}` : "#"}
                            onClick={(e) => !url.isActive && e.preventDefault()}
                            className={cn(
                                "text-lg font-extrabold tracking-tight transition-colors",
                                url.isActive ? "text-foreground hover:text-primary" : "text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            /{url.slug}
                        </Link>
                        <div className="flex items-center gap-1.5 ml-1">
                            {!url.isActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted border border-border text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground select-none">
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                    Deactivated
                                </span>
                            )}
                            {url.isPrivate && (
                                <Badge variant="secondary" className="bg-muted text-[10px] font-bold uppercase tracking-widest px-1.5 h-4 border-none">Private</Badge>
                            )}
                            {url.isSingleUse && (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-widest px-1.5 h-4 border-none">Ghost</Badge>
                            )}
                            {url.isFlagged && (
                                <Badge variant="destructive" className="bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest px-1.5 h-4 border-none">Alert</Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 max-w-full">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-tighter shrink-0">DST</span>
                        <p className="text-sm font-bold text-muted-foreground truncate">
                            {truncateUrl(url.originalUrl, 90)}
                        </p>
                    </div>
                </div>

                {/* Quantitative Data */}
                <div className="hidden md:flex flex-col items-end shrink-0 min-w-[80px] relative z-10">
                    <span className="text-xl font-extrabold tracking-tight text-foreground tabular-nums leading-none">
                        {formatNumber(url.clickCount)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Hits</span>
                </div>

                {/* Temporal Data */}
                <div className="hidden lg:flex flex-col items-end shrink-0 min-w-[100px] relative z-10">
                    <span className="text-xs font-bold text-muted-foreground leading-none">
                        {timeAgo(url.createdAt)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Discovery</span>
                </div>

                {/* Command Bar */}
                <div className="flex items-center gap-1 shrink-0 bg-muted/50 p-1 rounded-xl border border-border mt-1 md:mt-0 relative z-10">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all border-border hover:border-primary/30"
                        onClick={handleCopy}
                        title="Copy to buffer"
                        disabled={!url.isActive}
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <Copy className="h-4 w-4" />
                        )}
                    </Button>

                    <Button variant="outline" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all border-border hover:border-primary/30" asChild disabled={!url.isActive}>
                        <Link href={url.isActive ? `/links/${url.id}` : "#"} onClick={(e) => !url.isActive && e.preventDefault()} title="Insights">
                            <BarChart className="h-4 w-4" />
                        </Link>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg transition-all border-border hover:border-primary/30"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-border shadow-2xl">
                            <DropdownMenuItem
                                asChild={url.isActive}
                                className={cn(
                                    "rounded-xl px-3 py-2.5 cursor-pointer focus:bg-muted font-bold text-sm",
                                    !url.isActive && "opacity-50 cursor-not-allowed grayscale pointer-events-none"
                                )}
                            >
                                {url.isActive ? (
                                    <a href={url.shortUrl} target="_blank" rel="noopener noreferrer" className="flex items-center w-full">
                                        <ExternalLink className="mr-3 h-4 w-4 text-primary" />
                                        Launch Endpoint
                                    </a>
                                ) : (
                                    <div className="flex items-center w-full">
                                        <ExternalLink className="mr-3 h-4 w-4 text-primary" />
                                        Launch Endpoint
                                    </div>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 cursor-pointer focus:bg-muted font-bold text-sm">
                                <Link href={`/links/${url.id}`} className="flex items-center w-full">
                                    <Pencil className="mr-3 h-4 w-4 text-primary" />
                                    Reconfigure
                                </Link>
                            </DropdownMenuItem>
                            {url.qrEnabled && (
                                <DropdownMenuItem
                                    asChild={url.isActive}
                                    className={cn(
                                        "rounded-xl px-3 py-2.5 cursor-pointer focus:bg-muted font-bold text-sm",
                                        !url.isActive && "opacity-50 cursor-not-allowed grayscale pointer-events-none"
                                    )}
                                >
                                    {url.isActive ? (
                                        <a href={`/qr/${url.slug}`} download={`qr-${url.slug}.png`} className="flex items-center w-full">
                                            <Scan className="mr-3 h-4 w-4 text-primary" />
                                            Download QR Code
                                        </a>
                                    ) : (
                                        <div className="flex items-center w-full">
                                            <Scan className="mr-3 h-4 w-4 text-primary" />
                                            Download QR Code
                                        </div>
                                    )}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="my-1.5 mx-1" />
                            <DropdownMenuItem
                                className="rounded-xl px-3 py-2.5 cursor-pointer focus:bg-red-500/10 text-red-500 focus:text-red-600 font-bold text-sm group"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
                                Terminate Node
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Termination Dialogue */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md rounded-3xl border-border bg-popover shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">Terminate Endpoint?</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground mt-2 leading-relaxed">
                            This will permanently purge the node <span className="font-mono text-foreground font-bold bg-muted px-1.5 py-0.5 rounded">/{url.slug}</span> and all associated analytical data. This action is irreversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 mt-6">
                        <Button
                            variant="ghost"
                            className="rounded-xl px-6 font-bold"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={deleting}
                        >
                            Retain Node
                        </Button>
                        <Button
                            variant="destructive"
                            className="rounded-xl px-6 font-bold shadow-lg shadow-red-500/20"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Terminating...
                                </>
                            ) : (
                                "Confirm Termination"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
