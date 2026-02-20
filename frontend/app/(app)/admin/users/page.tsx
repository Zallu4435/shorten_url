"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Search, Shield, ShieldOff, Users as UsersIcon, UserPlus, Filter, ShieldCheck, Mail, Calendar } from "lucide-react";

import { ALL_USERS_QUERY } from "@/lib/graphql/queries";
import {
    ACTIVATE_USER_MUTATION,
    DEACTIVATE_USER_MUTATION,
    MAKE_ADMIN_MUTATION,
    REMOVE_ADMIN_MUTATION,
} from "@/lib/graphql/mutations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { EmptyTerminal } from "@/components/shared/EmptyTerminal";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { AdminUser, PaginatedUsers } from "@/types";

export default function AdminUsersPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const { data, loading, refetch } = useQuery<{ allUsers: PaginatedUsers }>(
        ALL_USERS_QUERY,
        { variables: { page, limit: 20, search: search || undefined } }
    );

    const [activateUser] = useMutation(ACTIVATE_USER_MUTATION, {
        onCompleted: () => { toast.success("User activated"); refetch(); },
    });
    const [deactivateUser] = useMutation(DEACTIVATE_USER_MUTATION, {
        onCompleted: () => { toast.success("User deactivated"); refetch(); },
    });
    const [makeAdmin] = useMutation(MAKE_ADMIN_MUTATION, {
        onCompleted: () => { toast.success("Admin role granted"); refetch(); },
    });
    const [removeAdmin] = useMutation(REMOVE_ADMIN_MUTATION, {
        onCompleted: () => { toast.success("Admin role removed"); refetch(); },
    });

    const users = data?.allUsers?.users ?? [];
    const total = data?.allUsers?.total ?? 0;

    return (
        <div className="space-y-12 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            <PageHeader
                title="User Matrix"
                description="Identity oversight & access control"
                icon={UsersIcon}
                stats={{
                    label: "Active Identities",
                    value: total,
                    unit: "USR"
                }}
            >
                <FilterSelect
                    value="all"
                    onValueChange={() => { }}
                    options={[
                        { label: "All Identities", value: "all" },
                        { label: "Commander Class", value: "admin" },
                        { label: "Standard Observers", value: "user" },
                    ]}
                    className="sm:w-64"
                />
            </PageHeader>

            <div className="flex items-center gap-4">
                <SearchInput
                    placeholder="Search by email or username…"
                    value={search}
                    onChange={(v) => { setSearch(v); setPage(1); }}
                    className="max-w-md"
                />
            </div>

            <div className="space-y-4">
                <TechnicalIndicator label="Identity Database" icon={ShieldCheck} />
                <div className="rounded-[32px] border border-border bg-card shadow-sm overflow-hidden backdrop-blur-sm">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-b border-border">
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">User Identity</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Access Protocol</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Provisioned</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pulse</TableHead>
                                <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Overrides</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5}>
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ))
                                : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20">
                                            <EmptyTerminal
                                                title="No Identities Discovered"
                                                description="No users matched your current scanning parameters. Expand your search scope."
                                                icon={UsersIcon}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : users.map((user: AdminUser) => (
                                    <TableRow key={user.id} className="group hover:bg-muted/30 border-b border-border/50 transition-colors">
                                        <TableCell className="py-5 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center font-black text-xs text-muted-foreground group-hover:border-primary/30 transition-all">
                                                    {user.username.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-foreground tracking-tight capitalize">{user.username}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Mail className="h-3 w-3 text-muted-foreground/60" />
                                                        <p className="text-[10px] font-bold text-muted-foreground lowercase">{user.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-8">
                                            {user.isAdmin ? (
                                                <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest px-3 h-7 rounded-lg shadow-sm">
                                                    <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                                                    Commander
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-muted text-muted-foreground border border-border text-[10px] font-black uppercase tracking-widest px-3 h-7 rounded-lg">
                                                    Observer
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-5 px-8 text-[11px] font-bold text-muted-foreground tabular-nums">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {formatDate(user.createdAt)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-8">
                                            <div className="flex items-center gap-3">
                                                <Switch
                                                    checked={user.isActive}
                                                    onCheckedChange={(v) =>
                                                        v
                                                            ? activateUser({ variables: { userId: user.id } })
                                                            : deactivateUser({ variables: { userId: user.id } })
                                                    }
                                                    className="data-[state=checked]:bg-emerald-500"
                                                    aria-label="Toggle user active"
                                                />
                                                <span className={`text-[10px] font-black uppercase tracking-tighter ${user.isActive ? "text-emerald-500" : "text-muted-foreground"}`}>
                                                    {user.isActive ? "Online" : "Terminated"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-8 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    user.isAdmin
                                                        ? removeAdmin({ variables: { userId: user.id } })
                                                        : makeAdmin({ variables: { userId: user.id } })
                                                }
                                                className="h-10 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest gap-2 hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                                            >
                                                {user.isAdmin ? (
                                                    <><ShieldOff className="h-4 w-4" /> Demote</>
                                                ) : (
                                                    <><Shield className="h-4 w-4" /> Promote</>
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {Math.ceil(total / 20) > 1 && (
                <div className="flex items-center justify-between bg-muted/20 border border-border p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        Sequence {page} of {Math.ceil(total / 20)}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold border-border" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold border-border" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
