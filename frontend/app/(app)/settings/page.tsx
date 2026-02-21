"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@apollo/client";
import { useForm } from "react-hook-form";
import {
    UPDATE_PROFILE_MUTATION,
    CHANGE_PASSWORD_MUTATION,
    DELETE_ACCOUNT_MUTATION
} from "@/lib/graphql/mutations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { User as UserIcon, ShieldAlert, Lock, Trash2, Settings, Calendar, Save, KeyRound, AlertCircle, CheckCircle2, Loader2, LogOut } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { TechnicalIndicator } from "@/components/shared/TechnicalIndicator";
import {
    updateProfileSchema, type UpdateProfileValues,
    changePasswordSchema, type ChangePasswordValues,
    deleteAccountSchema, type DeleteAccountValues
} from "@/lib/validations/user";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";


export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Profile Form
    const profileForm = useForm<UpdateProfileValues>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            username: user?.username ?? "",
            email: user?.email ?? "",
        },
    });

    // Password Form
    const passwordForm = useForm<ChangePasswordValues>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    // Delete Form
    const deleteForm = useForm<DeleteAccountValues>({
        resolver: zodResolver(deleteAccountSchema),
        defaultValues: {
            confirmText: "",
        },
    });

    const [updateProfile, { loading: updatingProfile }] = useMutation(UPDATE_PROFILE_MUTATION, {
        onCompleted: (data) => {
            toast.success("Profile updated successfully");
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const [changePassword, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD_MUTATION, {
        onCompleted: (data) => {
            toast.success("Password changed. Please log in again.");
            setTimeout(logout, 2000);
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const [deleteAccount, { loading: deletingAccount }] = useMutation(DELETE_ACCOUNT_MUTATION, {
        onCompleted: (data) => {
            toast.success("Account deleted. Redirecting...");
            logout();
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    const onUpdateProfile = (values: UpdateProfileValues) => {
        if (values.username === user?.username) {
            toast.info("No changes detected");
            return;
        }
        updateProfile({
            variables: {
                username: values.username,
            }
        });
    };

    const onChangePassword = (values: ChangePasswordValues) => {
        changePassword({
            variables: {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword
            }
        });
    };

    const onDeleteAccount = () => {
        deleteAccount();
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-12 py-6 animate-in fade-in duration-700">
            <PageHeader
                title="Account Settings"
                description="Manage your profile information and security protocols."
                icon={Settings}
            />

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Profile Section */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden border-primary/5">
                        <CardHeader className="p-10 pb-2 flex flex-row items-center justify-between">
                            <TechnicalIndicator label="Personal Information" icon={UserIcon} className="mb-0" />
                            <Badge variant="outline" className="border-border bg-muted/10 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] px-4 h-8 rounded-xl">
                                <Calendar className="mr-2 h-3.5 w-3.5" />
                                Registered: {user?.createdAt ? formatDate(user.createdAt) : "—"}
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-10 pt-6">
                            <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-8">
                                <div className="grid gap-8 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Username</Label>
                                        <Input
                                            {...profileForm.register("username")}
                                            placeholder="e.g. protocol_user"
                                            className="h-14 bg-muted/20 border-border text-base font-black tracking-tighter focus-visible:ring-primary/20 rounded-2xl shadow-inner px-6"
                                        />
                                        {profileForm.formState.errors.username && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-2">{profileForm.formState.errors.username.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between ml-2">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Email Address</Label>
                                            <Badge variant="outline" className="h-5 text-[8px] font-black px-2 border-primary/20 bg-primary/5 text-primary opacity-60">
                                                SYSTEM MANAGED
                                            </Badge>
                                        </div>
                                        <Input
                                            {...profileForm.register("email")}
                                            disabled
                                            placeholder="e.g. user@protocol.net"
                                            className="h-14 bg-muted/10 border-border/50 text-base font-black tracking-tighter rounded-2xl shadow-inner px-6 opacity-50 cursor-not-allowed"
                                        />
                                        {profileForm.formState.errors.email && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-2">{profileForm.formState.errors.email.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <div className="flex items-center gap-4">
                                        {user?.isAdmin && (
                                            <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] px-4 h-8 rounded-xl shadow-sm">
                                                <ShieldAlert className="mr-2 h-3.5 w-3.5" />
                                                Administrator
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        disabled={updatingProfile}
                                        className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[11px] shadow-xl hover:opacity-90 transition-all active:scale-[0.98]"
                                    >
                                        {updatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Security Section */}
                    <Card className="rounded-[40px] border-border bg-card shadow-sm overflow-hidden border-violet-500/5">
                        <CardHeader className="p-10 pb-2">
                            <TechnicalIndicator label="Security Protocols" icon={KeyRound} color="violet" className="mb-0" />
                        </CardHeader>
                        <CardContent className="p-10 pt-6">
                            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-8">
                                <div className="grid gap-8 md:grid-cols-3">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Current Password</Label>
                                        <Input
                                            type="password"
                                            {...passwordForm.register("oldPassword")}
                                            placeholder="••••••••"
                                            className="h-14 bg-muted/20 border-border text-base font-black tracking-tighter focus-visible:ring-violet-500/20 rounded-2xl shadow-inner px-6"
                                        />
                                        {passwordForm.formState.errors.oldPassword && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-2">{passwordForm.formState.errors.oldPassword.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">New Password</Label>
                                        <Input
                                            type="password"
                                            {...passwordForm.register("newPassword")}
                                            placeholder="Min 8 chars, A-Z, 0-9"
                                            className="h-14 bg-muted/20 border-border text-base font-black tracking-tighter focus-visible:ring-violet-500/20 rounded-2xl shadow-inner px-6"
                                        />
                                        {passwordForm.formState.errors.newPassword && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-2">{passwordForm.formState.errors.newPassword.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Confirm New Password</Label>
                                        <Input
                                            type="password"
                                            {...passwordForm.register("confirmPassword")}
                                            placeholder="Confirm new password"
                                            className="h-14 bg-muted/20 border-border text-base font-black tracking-tighter focus-visible:ring-violet-500/20 rounded-2xl shadow-inner px-6"
                                        />
                                        {passwordForm.formState.errors.confirmPassword && (
                                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 ml-2">{passwordForm.formState.errors.confirmPassword.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <div className="flex-1 max-w-sm">
                                        <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-tighter">
                                            Changing your password will invalidate all current sessions and force a re-login for security.
                                        </p>
                                    </div>
                                    <Button
                                        disabled={changingPassword}
                                        className="h-14 px-8 rounded-2xl bg-violet-600 text-white font-black uppercase tracking-widest text-[11px] shadow-xl hover:opacity-90 transition-all active:scale-[0.98]"
                                    >
                                        {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Info & Danger Sidebars */}
                <div className="space-y-8">
                    {/* Security Status Card */}
                    <Card className="rounded-[40px] border-emerald-500/10 bg-emerald-500/[0.02] shadow-sm overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <TechnicalIndicator label="Node Status" icon={CheckCircle2} color="emerald" className="mb-0" />
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-4">
                            <p className="text-xl font-black text-foreground tracking-tighter italic uppercase opacity-80">Operational</p>
                            <p className="text-sm font-bold text-muted-foreground/70 leading-relaxed">
                                Your account is currently in good standing. All core link protocols are active and your global traffic is being routed securely.
                            </p>
                            <div className="pt-4 flex flex-col gap-3">
                                <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[9px] uppercase tracking-widest px-3 h-7">2FA: Inactive</Badge>
                                <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[9px] uppercase tracking-widest px-3 h-7">Auth: MAANG-STD</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="rounded-[40px] border-red-500/20 bg-red-500/[0.01] shadow-sm overflow-hidden border-dashed">
                        <CardHeader className="p-8 pb-4">
                            <TechnicalIndicator label="Danger Zone" icon={Trash2} color="red" className="mb-0" />
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="space-y-2">
                                <p className="text-lg font-black text-foreground tracking-tight">Deactivate Node</p>
                                <p className="text-xs font-bold text-muted-foreground/70 leading-relaxed uppercase tracking-tighter">
                                    Permanently remove your profile and all associated links. This action <span className="text-red-500">cannot be undone</span>.
                                </p>
                            </div>

                            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-500/10 transition-all hover:bg-red-600 border border-red-500/20">
                                        Delete Account
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="rounded-[40px] border-red-500/20 bg-card shadow-2xl max-w-md p-0 overflow-hidden">
                                    <div className="p-8 space-y-6">
                                        <DialogHeader className=" space-y-4">
                                            <TechnicalIndicator label="Terminal Operation" icon={ShieldAlert} color="red" />
                                            <DialogTitle className="text-3xl font-black tracking-tighter text-foreground leading-none">
                                                Confirm Node<br />Deactivation
                                            </DialogTitle>
                                            <DialogDescription className="text-sm font-bold text-muted-foreground leading-relaxed">
                                                Warning: This protocol will permanently wipe your links, analytics, and profile from the registry. This action <span className="text-red-500 underline underline-offset-2">is irreversible</span>.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-2">Type "DELETE" to verify identity</Label>
                                                <Input
                                                    {...deleteForm.register("confirmText")}
                                                    placeholder="DELETE"
                                                    className="h-16 bg-red-500/5 border-red-500/20 text-center text-xl font-black tracking-[0.5em] focus-visible:ring-red-500/20 rounded-2xl shadow-inner placeholder:text-red-500/10"
                                                />
                                                {deleteForm.formState.errors.confirmText && (
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 text-center font-bold">{deleteForm.formState.errors.confirmText.message}</p>
                                                )}
                                            </div>

                                            <DialogFooter className="flex-col sm:flex-col gap-3 pt-2">
                                                <Button
                                                    variant="destructive"
                                                    onClick={deleteForm.handleSubmit(onDeleteAccount)}
                                                    disabled={deletingAccount}
                                                    className="h-16 rounded-2xl font-black uppercase tracking-widest text-xs w-full shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-[0.98]"
                                                >
                                                    {deletingAccount ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initiate Full Wipe"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    type="button"
                                                    onClick={() => setIsDeleteDialogOpen(false)}
                                                    className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] w-full text-muted-foreground hover:bg-muted/50 transition-all"
                                                >
                                                    Abort Sync
                                                </Button>
                                            </DialogFooter>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>

                    {/* Quick Logout */}
                    <div className="pt-8">
                        <Button
                            variant="ghost"
                            onClick={logout}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-red-500/5 hover:text-red-500 transition-all group border border-border/40 hover:border-red-500/20"
                        >
                            <LogOut className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Sign Out Instance
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
