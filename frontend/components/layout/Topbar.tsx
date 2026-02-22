"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Moon, Sun, LogOut, Settings, Shield } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverAnchor,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { CommandMenu } from "@/components/layout/CommandMenu";
import { getInitials, stringToColor, cn } from "@/lib/utils";

import { useQuery } from "@apollo/client";
import { MY_URLS_QUERY, ALL_USERS_QUERY } from "@/lib/graphql/queries";
import { useDebounce } from "@/hooks/useDebounce";
import { Command, CommandInput } from "@/components/ui/command";
import type { ShortURL, AdminUser } from "@/types";

export function Topbar() {
    const { user, loading: authLoading, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const searchRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);
    const [search, setSearch] = useState("");
    const [showResults, setShowResults] = useState(false);
    const debouncedSearch = useDebounce(search, 400);
    const isSearching = search !== debouncedSearch;

    const urlVariables = useMemo(() => ({
        search: debouncedSearch.trim() || undefined,
        limit: 5,
    }), [debouncedSearch]);

    const userVariables = useMemo(() => ({
        search: debouncedSearch.trim() || undefined,
        limit: 3,
    }), [debouncedSearch]);

    const { data: urlData, loading: urlsLoading } = useQuery<{
        myUrls: { urls: ShortURL[]; total: number };
    }>(MY_URLS_QUERY, {
        variables: urlVariables,
        skip: !showResults || !debouncedSearch.trim(),
        fetchPolicy: "cache-first",
    });

    const { data: userData, loading: usersLoading } = useQuery<{
        allUsers: { users: AdminUser[]; total: number };
    }>(ALL_USERS_QUERY, {
        variables: userVariables,
        skip: !showResults || !debouncedSearch.trim() || !user?.isAdmin,
        fetchPolicy: "cache-first",
    });

    const loadingResults = urlsLoading || usersLoading;

    // Prevent hydration mismatch
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            router.replace("/login");
            toast.success("Signed out successfully");
        } catch {
            toast.error("Failed to sign out");
        }
    };

    const initials = user ? getInitials(user.username) : "";
    const avatarColor = user ? stringToColor(user.username) : "#7c3aed";

    return (
        <header className="flex h-20 items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-30">
            {/* Left — Search Bar Trigger */}
            <div className="flex flex-1 items-center gap-4">
                <Command
                    shouldFilter={false}
                    className="overflow-visible bg-transparent h-auto w-auto"
                >
                    <Popover open={showResults} onOpenChange={setShowResults}>
                        <PopoverAnchor asChild>
                            <div className="hidden lg:block w-96 relative group">
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-20">
                                    <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded-[10px] border border-border/50 bg-background/50 px-2 font-mono text-[10px] font-black text-muted-foreground transition-all group-focus-within:border-primary/30 group-focus-within:text-primary">
                                        <span className="text-[10px]">⌘</span>K
                                    </kbd>
                                </div>
                                <CommandInput
                                    ref={searchRef}
                                    placeholder="Search links, analytics..."
                                    value={search}
                                    onValueChange={(v) => {
                                        setSearch(v);
                                        if (!showResults) setShowResults(true);
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    className={cn(
                                        "h-12 pl-10 pr-10 bg-muted/30 border-border/50 rounded-2xl font-bold tracking-tight",
                                        "placeholder:text-muted-foreground/60 placeholder:font-medium",
                                        "focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all shadow-sm",
                                        "text-sm w-96 [&_[data-slot=command-input-wrapper]]:border-none [&_[data-slot=command-input-wrapper]]:h-full [&_[data-slot=command-input-wrapper]]:px-4"
                                    )}
                                />
                            </div>
                        </PopoverAnchor>
                        <PopoverContent
                            className="w-96 p-0 border-border bg-popover/95 backdrop-blur-2xl rounded-[32px] shadow-2xl overflow-hidden mt-2"
                            align="start"
                            sideOffset={8}
                            onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                            <CommandMenu
                                search={search}
                                urls={urlData?.myUrls?.urls ?? []}
                                users={userData?.allUsers?.users ?? []}
                                loading={loadingResults}
                                isSearching={isSearching}
                                onClose={() => setShowResults(false)}
                            />
                        </PopoverContent>
                    </Popover>
                </Command>
            </div>

            {/* Right — Controls */}
            <div className="flex items-center gap-3">
                {/* Theme toggle */}
                {mounted && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-2xl bg-muted/50 border border-input text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                )}

                <div className="h-6 w-[1px] bg-border mx-2" />

                {/* User menu */}
                {authLoading ? (
                    <Skeleton className="h-11 w-11 rounded-2xl" />
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="group relative flex items-center gap-3 p-1 rounded-2xl hover:bg-muted transition-all outline-none">
                                <Avatar className="h-10 w-10 ring-2 ring-border group-hover:ring-violet-500/50 transition-all rounded-xl">
                                    <AvatarFallback
                                        style={{ backgroundColor: avatarColor }}
                                        className="text-white text-sm font-black rounded-xl"
                                    >
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:flex flex-col items-start pr-2 text-left">
                                    <span className="text-sm font-black text-foreground tracking-tight line-height-none capitalize">{user?.username}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {user?.isAdmin ? "Commander" : "Observer"}
                                    </span>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-2 bg-popover border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200" forceMount>
                            <DropdownMenuLabel className="p-4">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-base font-black text-foreground tracking-tight line-height-none capitalize">{user?.username}</p>
                                    <p className="text-xs font-medium text-muted-foreground break-all">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="mx-2" />
                            <div className="p-1">
                                <DropdownMenuItem asChild className="rounded-xl px-3 py-3 cursor-pointer focus:bg-muted text-muted-foreground focus:text-foreground">
                                    <Link href="/settings" className="flex items-center w-full">
                                        <Settings className="mr-3 h-4 w-4 text-violet-500" />
                                        <span className="font-bold text-sm">Account Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                {user?.isAdmin && (
                                    <DropdownMenuItem asChild className="rounded-xl px-3 py-3 cursor-pointer focus:bg-muted text-muted-foreground focus:text-foreground">
                                        <Link href="/admin" className="flex items-center w-full">
                                            <Shield className="mr-3 h-4 w-4 text-violet-500" />
                                            <span className="font-bold text-sm">Admin Command</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                            </div>
                            <DropdownMenuSeparator className="mx-2" />
                            <div className="p-1">
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="rounded-xl px-3 py-3 cursor-pointer focus:bg-red-500/10 text-red-500 focus:text-red-400 group"
                                >
                                    <LogOut className="mr-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    <span className="font-black text-sm">Terminate Session</span>
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
