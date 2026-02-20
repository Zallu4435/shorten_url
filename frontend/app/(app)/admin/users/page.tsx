"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { Search, Shield, ShieldOff } from "lucide-react";

import { ALL_USERS_QUERY } from "@/lib/graphql/queries";
import {
    ACTIVATE_USER_MUTATION,
    DEACTIVATE_USER_MUTATION,
    MAKE_ADMIN_MUTATION,
    REMOVE_ADMIN_MUTATION,
} from "@/lib/graphql/mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">Users</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    {loading ? "Loading…" : `${total} users`}
                </p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Search by email or username…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-9 bg-background"
                />
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                            : users.map((user: AdminUser) => (
                                <TableRow key={user.id} className="row-hover">
                                    <TableCell>
                                        <div>
                                            <p className="text-sm font-medium">{user.username}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {user.isAdmin ? (
                                            <Badge className="text-xs">Admin</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-xs">User</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(user.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={user.isActive}
                                            onCheckedChange={(v) =>
                                                v
                                                    ? activateUser({ variables: { userId: user.id } })
                                                    : deactivateUser({ variables: { userId: user.id } })
                                            }
                                            aria-label="Toggle user active"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                user.isAdmin
                                                    ? removeAdmin({ variables: { userId: user.id } })
                                                    : makeAdmin({ variables: { userId: user.id } })
                                            }
                                            className="text-xs gap-1.5"
                                        >
                                            {user.isAdmin ? (
                                                <><ShieldOff className="h-3.5 w-3.5" /> Remove admin</>
                                            ) : (
                                                <><Shield className="h-3.5 w-3.5" /> Make admin</>
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>

            {Math.ceil(total / 20) > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Page {page} of {Math.ceil(total / 20)}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
