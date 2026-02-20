"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { User as UserIcon, ShieldAlert, Lock, Trash2, Fingerprint, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 py-6 animate-in fade-in duration-700">
            <PageHeader
                title="Node Configuration"
                description="Manage your identity parameters and interface preferences."
                icon={Fingerprint}
            />

            {/* Profile Section */}
            <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
                <CardHeader className="p-10 pb-6 bg-muted/30 border-b border-border">
                    <TechnicalIndicator label="Profile Architecture" icon={UserIcon} className="mb-0" />
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">System Username</Label>
                            <Input value={user?.username ?? ""} disabled className="h-12 bg-muted/30 border-border/50 rounded-2xl font-black cursor-not-allowed text-foreground/80 tracking-tight" />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Access Email Address</Label>
                            <Input value={user?.email ?? ""} disabled className="h-12 bg-muted/30 border-border/50 rounded-2xl font-black cursor-not-allowed text-foreground/80 tracking-tight" />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {user?.isAdmin && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] px-4 h-8 rounded-xl shadow-sm">
                                <ShieldAlert className="mr-2 h-3.5 w-3.5" />
                                Commander (Admin)
                            </Badge>
                        )}
                        <Badge variant="outline" className="border-border bg-muted/10 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] px-4 h-8 rounded-xl shadow-sm">
                            <Calendar className="mr-2 h-3.5 w-3.5" />
                            Registered: {user?.createdAt ? formatDate(user.createdAt) : "—"}
                        </Badge>
                    </div>

                    <div className="p-6 rounded-3xl bg-violet-500/[0.03] border border-violet-500/10 flex items-start gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Lock className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-violet-600/90 leading-relaxed">
                                <span className="font-black uppercase mr-2 tracking-tighter bg-violet-500 text-white px-2 py-0.5 rounded-lg shadow-sm">Restricted</span>
                                Identity parameters are currently locked for security.
                                Personal details cannot be mutated from this terminal environment. Contact central intelligence to initiate a records update.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="rounded-[40px] border-red-500/20 bg-red-500/[0.01] shadow-sm overflow-hidden transition-all hover:border-red-500/30">
                <CardHeader className="p-10 pb-6 bg-red-500/[0.03] border-b border-red-500/10">
                    <TechnicalIndicator label="Danger Quadrant" icon={Trash2} color="red" className="mb-0" />
                </CardHeader>
                <CardContent className="p-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10">
                        <div className="max-w-md space-y-2">
                            <p className="text-xl font-black text-foreground tracking-tight">Decommission Identity</p>
                            <p className="text-sm font-bold text-muted-foreground/70 leading-relaxed">
                                Irreversibly purge your profile and all associate network endpoints. This action will cause immediate
                                <span className="text-red-500/80 font-black ml-1">DATA FRAGMENTATION</span> and cannot be undone.
                            </p>
                        </div>
                        <Button variant="destructive" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-500/20 active:scale-[0.98] transition-all border border-red-500/20 hover:bg-red-600" disabled>
                            Purge Identity
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
