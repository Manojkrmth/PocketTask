'use client';

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, MoreHorizontal, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const dummyAdmins = [
    { id: 'admin1', fullName: 'Super Admin', email: 'super.admin@example.com', mobile: '9999999999', referralCode: 'CMSUPER1', isSuperAdmin: true, status: 'Active' },
    { id: 'admin2', fullName: 'Manager Admin', email: 'manager.admin@example.com', mobile: '8888888888', referralCode: 'CMADMIN2', isSuperAdmin: false, status: 'Active' },
];

function AdminDetails({ admin }: { admin: any }) {
    const { toast } = useToast();
    
    const handleAction = (action: string) => {
        toast({ title: 'Action Triggered', description: `${action} on ${admin.fullName}` });
    };

    return (
        <div className="flex items-center justify-between p-3 border-b gap-4">
            <div className="flex items-center gap-3 flex-1">
                <Avatar>
                    <AvatarFallback>{admin.fullName ? admin.fullName.charAt(0) : 'A'}</AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5">
                    <div className="font-bold flex items-center gap-2">
                        {admin.fullName}
                        {admin.isSuperAdmin && <ShieldCheck className="h-4 w-4 text-green-500" title="Super Admin" />}
                    </div>
                    <div className="text-xs text-muted-foreground">{admin.email}</div>
                </div>
            </div>
            <div className="text-sm text-muted-foreground hidden md:block">{admin.mobile}</div>
            <div className="font-mono text-sm text-primary hidden md:block">{admin.referralCode}</div>

            {!admin.isSuperAdmin ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction('Remove Admin Role')}>Remove Admin Role</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(admin.status === 'Blocked' ? 'Unblock User' : 'Block User')}>
                            {admin.status === 'Blocked' ? 'Unblock' : 'Block'} User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : <div className="w-8"></div> }
        </div>
    )
}

export default function AdminAdminsPage() {
    const { toast } = useToast();
    const [adminIdentifier, setAdminIdentifier] = useState('');
    const [isAdding, startAdding] = useTransition();
    
    const handleAddAdmin = () => {
        if (!adminIdentifier) {
            toast({ variant: 'destructive', title: 'Identifier required' });
            return;
        }

        startAdding(() => {
            // Simulate adding admin
            setTimeout(() => {
                 toast({ title: 'Admin Added', description: `User ${adminIdentifier} has been granted admin privileges.` });
                setAdminIdentifier('');
            }, 1000);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Admin Management</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add New Admin</CardTitle>
                    <CardDescription>Enter a User's Email or Referral Code to grant them admin privileges.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Enter User Email or Referral Code" 
                            value={adminIdentifier}
                            onChange={(e) => setAdminIdentifier(e.target.value)}
                        />
                        <Button onClick={handleAddAdmin} disabled={isAdding}>
                            {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Add Admin
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Current Admins</CardTitle>
                    <CardDescription>List of users with admin privileges.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div>
                        {dummyAdmins.map(admin => <AdminDetails key={admin.id} admin={admin} />)}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
