import { useRouter } from "next/navigation";
import { Link2, Search, ArrowRight, User as UserIcon, Shield, LayoutDashboard, Loader2, Plus } from "lucide-react";
import * as React from "react";

import {
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import type { ShortURL, AdminUser } from "@/types";

interface CommandMenuProps {
    search: string;
    urls: ShortURL[];
    users: AdminUser[];
    loading: boolean;
    isSearching: boolean;
    onClose: () => void;
}

export function CommandMenu({ search, urls, users, loading, isSearching, onClose }: CommandMenuProps) {
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const runCommand = React.useCallback(
        (command: () => void) => {
            onClose();
            command();
        },
        [onClose]
    );

    const showEmpty = search && !loading && !isSearching && urls.length === 0 && users.length === 0;

    return (
        <CommandList className="p-2 overflow-y-auto custom-scrollbar">
            {isSearching && (
                <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground animate-in fade-in duration-200">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Searching...</span>
                </div>
            )}

            {showEmpty && (
                <CommandEmpty>
                    <div className="py-10 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                        <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center mb-3">
                            <Search className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-[11px] font-black text-foreground uppercase tracking-widest">No results found</p>
                    </div>
                </CommandEmpty>
            )}

            {(loading && !isSearching) ? (
                <div className="p-2 space-y-4">
                    {/* URL Skeleton */}
                    <div className="flex items-center gap-3 px-4 py-3">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24 rounded-full" />
                            <Skeleton className="h-2 w-48 rounded-full opacity-50" />
                        </div>
                    </div>
                    {/* User Skeleton */}
                    <div className="flex items-center gap-3 px-4 py-3">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32 rounded-full" />
                            <Skeleton className="h-2 w-36 rounded-full opacity-50" />
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {search && urls.length > 0 && (
                        <CommandGroup heading="Links">
                            {urls.map((url) => (
                                <CommandItem
                                    key={url.id}
                                    value={`url ${url.slug} ${url.title || ""}`}
                                    onSelect={() => runCommand(() => router.push(`/links/${url.id}`))}
                                    className="rounded-xl px-4 py-3 cursor-pointer group data-[selected=true]:bg-violet-500/10"
                                >
                                    <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center mr-3 group-hover:bg-violet-500/20 group-data-[selected=true]:bg-violet-500/20 transition-all">
                                        <Link2 className="h-4 w-4 text-violet-500" />
                                    </div>
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <span className="text-sm font-black text-foreground tracking-tight line-clamp-1 italic">/{url.slug}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground truncate opacity-70">
                                            {url.title || url.originalUrl}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-all">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-500">View Link</span>
                                        <ArrowRight className="h-3 w-3 text-violet-500" />
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {search && users.length > 0 && (
                        <CommandGroup heading="Users">
                            {users.map((u) => (
                                <CommandItem
                                    key={u.id}
                                    value={`user ${u.username} ${u.email}`}
                                    onSelect={() => runCommand(() => router.push(`/admin/users?search=${u.username}`))}
                                    className="rounded-xl px-4 py-3 cursor-pointer group data-[selected=true]:bg-emerald-500/10"
                                >
                                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mr-3 group-hover:bg-emerald-500/20 group-data-[selected=true]:bg-emerald-500/20 transition-all">
                                        <UserIcon className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <span className="text-sm font-black text-foreground tracking-tight line-clamp-1 capitalize">{u.username}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground truncate opacity-70">
                                            {u.email}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-all">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">View User</span>
                                        <ArrowRight className="h-3 w-3 text-emerald-500" />
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {!search && (
                        <>
                            <CommandGroup heading="Navigation">
                                <CommandItem
                                    onSelect={() => runCommand(() => router.push("/links"))}
                                    className="rounded-xl px-4 py-3 cursor-pointer group data-[selected=true]:bg-blue-500/10"
                                >
                                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3 group-data-[selected=true]:bg-blue-500/20">
                                        <LayoutDashboard className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <span className="text-sm font-bold text-foreground">Dashboard</span>
                                </CommandItem>
                                {currentUser?.isAdmin && (
                                    <CommandItem
                                        onSelect={() => runCommand(() => router.push("/admin"))}
                                        className="rounded-xl px-4 py-3 cursor-pointer group data-[selected=true]:bg-amber-500/10"
                                    >
                                        <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center mr-3 group-data-[selected=true]:bg-amber-500/20">
                                            <Shield className="h-4 w-4 text-amber-500" />
                                        </div>
                                        <span className="text-sm font-bold text-foreground">Administration</span>
                                    </CommandItem>
                                )}
                            </CommandGroup>

                            <CommandGroup heading="Quick Actions">
                                <CommandItem
                                    onSelect={() => runCommand(() => router.push("/links/new"))}
                                    className="rounded-xl px-4 py-3 cursor-pointer group data-[selected=true]:bg-emerald-500/10"
                                >
                                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mr-3 group-data-[selected=true]:bg-emerald-500/20">
                                        <Plus className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <span className="text-sm font-bold text-foreground">Create Link</span>
                                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 uppercase tracking-tighter shadow-sm">
                                        N
                                    </kbd>
                                </CommandItem>
                            </CommandGroup>
                        </>
                    )}
                </>
            )}

            <div className="p-4 mt-2 border-t border-border/50 bg-muted/20 flex items-center justify-between rounded-b-2xl">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded border bg-background text-[9px] font-black tracking-widest text-muted-foreground shadow-sm">ENTER</kbd>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60">Execute</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded border bg-background text-[9px] font-black tracking-widest text-muted-foreground shadow-sm">ESC</kbd>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60">Dismiss</span>
                    </div>
                </div>
            </div>
        </CommandList>
    );
}
