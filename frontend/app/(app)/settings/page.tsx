"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-xl space-y-6">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Manage your account preferences
                </p>
            </div>

            {/* Profile */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Profile</CardTitle>
                    <CardDescription>Your account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Username</Label>
                        <Input value={user?.username ?? ""} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={user?.email ?? ""} disabled className="bg-muted" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                        {user?.isAdmin && <Badge>Admin</Badge>}
                        <Badge variant="secondary">
                            Member since {user?.createdAt ? formatDate(user.createdAt) : "—"}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Username and email changes are not yet supported from the dashboard.
                    </p>
                </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
                    <CardDescription>Irreversible and destructive actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <Separator className="mb-4" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Delete account</p>
                            <p className="text-xs text-muted-foreground">
                                Permanently delete your account and all data
                            </p>
                        </div>
                        <Button variant="destructive" size="sm" disabled>
                            Delete account
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
