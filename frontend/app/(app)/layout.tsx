"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard>
            <div className="flex h-screen overflow-hidden bg-background">
                {/* Sidebar — desktop only */}
                <div className="hidden md:flex">
                    <Sidebar />
                </div>

                {/* Main area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <Topbar />

                    {/* Page content */}
                    <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
                        {children}
                    </main>
                </div>

                {/* Bottom nav — mobile only */}
                <MobileNav />
            </div>
        </AuthGuard>
    );
}
