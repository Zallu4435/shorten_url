"use client";

import { Moon, Sun, LogOut, User, Settings, Shield } from "lucide-react";
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
import { getInitials, stringToColor } from "@/lib/utils";

export function Topbar() {
    const { user, loading, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.replace("/login");
        } catch {
            toast.error("Failed to sign out");
        }
    };

    const initials = user ? getInitials(user.username) : "";
    const avatarColor = user ? stringToColor(user.username) : "#6d28d9";

    return (
        <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm sticky top-0 z-10">
            {/* Left — page title filled by individual pages via a slot  */}
            <div className="flex-1" />

            {/* Right — controls */}
            <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                >
                    {theme === "dark" ? (
                        <Sun className="h-4 w-4" />
                    ) : (
                        <Moon className="h-4 w-4" />
                    )}
                </Button>

                {/* User menu */}
                {loading ? (
                    <Skeleton className="h-8 w-8 rounded-full" />
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="outline-none ring-ring ring-offset-background ring-offset-1 focus-visible:ring-2 rounded-full"
                                aria-label="User menu"
                            >
                                <Avatar className="h-8 w-8 cursor-pointer">
                                    <AvatarFallback
                                        style={{ backgroundColor: avatarColor }}
                                        className="text-white text-xs font-semibold"
                                    >
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-0.5">
                                    <p className="text-sm font-medium leading-none">
                                        {user?.username}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    Account settings
                                </Link>
                            </DropdownMenuItem>
                            {user?.isAdmin && (
                                <DropdownMenuItem asChild>
                                    <Link href="/admin" className="cursor-pointer">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Admin panel
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="text-destructive focus:text-destructive cursor-pointer"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
