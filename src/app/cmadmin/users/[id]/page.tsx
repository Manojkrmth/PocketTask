'use client';

import { useMemo, useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Users, Gift } from "lucide-react";
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';


const dummyUserDetail = {
    id: 'usr_1',
    fullName: 'Aarav Sharma',
    email: 'aarav.sh@example.com',
    mobile: '9123456780',
    referralCode: 'CMAAR12',
    referredBy: 'CMVIK345',
    balanceAvailable: 75.50,
    balanceHold: 20.00,
    status: 'Active',
    l1Referrals: 5,
    referralEarnings: 250.75,
};


export default function UserDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const [isSaving, startSaving] = useTransition();
    const { toast } = useToast();

    const [formState, setFormState] = useState(dummyUserDetail);

    const handleInputChange = (field: string, value: any) => {
        setFormState((prev) => (prev ? { ...prev, [field]: value } : null));
    };

    const handleSaveChanges = () => {
        if (!formState) return;
        startSaving(() => {
            // Simulate API call
            setTimeout(() => {
                console.log("Saving data:", formState);
                toast({ title: "User Updated", description: "User details have been saved successfully." });
            }, 1000);
        });
    };
    
    if (!formState) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }
    
    return (
        <div className="space-y-6">
            <Link href="/cmadmin/users" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to User List
            </Link>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">{dummyUserDetail?.fullName}</h1>
                    <p className="text-muted-foreground">{dummyUserDetail?.email}</p>
                </div>
                <Badge variant={dummyUserDetail?.status === 'Active' ? 'default' : 'destructive'} className={cn(dummyUserDetail?.status === 'Active' && 'bg-green-500')}>{dummyUserDetail?.status}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">₹{dummyUserDetail?.balanceAvailable?.toFixed(2) || '0.00'}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Hold Balance</CardTitle>
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">₹{dummyUserDetail?.balanceHold?.toFixed(2) || '0.00'}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">L1 Referrals</CardTitle>
                        <Users className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{dummyUserDetail.l1Referrals}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
                        <Gift className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">₹{dummyUserDetail.referralEarnings.toFixed(2)}</div></CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit User</CardTitle>
                    <CardDescription>Modify user details and balances.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" value={formState.fullName || ''} onChange={(e) => handleInputChange('fullName', e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <Input id="mobile" value={formState.mobile || ''} onChange={(e) => handleInputChange('mobile', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="balanceAvailable">Available Balance</Label>
                            <Input id="balanceAvailable" type="number" value={formState.balanceAvailable} onChange={(e) => handleInputChange('balanceAvailable', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="balanceHold">Hold Balance</Label>
                            <Input id="balanceHold" type="number" value={formState.balanceHold} onChange={(e) => handleInputChange('balanceHold', e.target.value)} />
                        </div>
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label>Account Status</Label>
                            <p className="text-xs text-muted-foreground">Block or unblock the user's account.</p>
                        </div>
                        <Switch
                            checked={formState.status === 'Active'}
                            onCheckedChange={(checked) => handleInputChange('status', checked ? 'Active' : 'Blocked')}
                        />
                    </div>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
