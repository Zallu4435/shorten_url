"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, LogOut, User, Settings, Shield, Bell, Search } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { SearchInput } from "@/components/shared/SearchInput";
import { getInitials, stringToColor, cn } from "@/lib/utils";

export function Topbar() {
    const { user, loading, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [topbarSearch, setTopbarSearch] = useState("");

    // Prevent hydration mismatch
    useEffect(() => {
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
            {/* Left — Search Bar */}
            <div className="flex flex-1 items-center gap-4">
                <div className="hidden lg:block w-96">
                    <SearchInput
                        placeholder="Search links, analytics..."
                        value={topbarSearch}
                        onChange={setTopbarSearch}
                    />
                </div>
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
                {loading ? (
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
