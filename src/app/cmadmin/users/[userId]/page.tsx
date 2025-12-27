

'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2, User, Mail, Phone, Calendar, Hash, Wallet, BarChart, Shield,
  ArrowLeftRight, Edit, UserPlus, CheckCircle, Clock, XCircle, ArrowUp, ArrowDown,
  History, ListTodo,
} from 'lucide-react';
import { useCurrency } from '@/context/currency-context';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';


interface AppUser {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  status: string;
  created_at: string;
  referral_code: string;
  balance_available: number;
}

interface FinancialStats {
  available_balance: number;
  pending_balance: number;
  total_earnings: number;
  total_withdrawn: number;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const userId = params.userId as string;

  const [user, setUser] = useState<AppUser | null>(null);
  const [financials, setFinancials] = useState<FinancialStats | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [balanceAction, setBalanceAction] = useState<'credit' | 'debit'>('credit');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [isUpdatingBalance, startBalanceUpdate] = useTransition();

  const fetchAllData = useCallback(async () => {
      setLoading(true);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user:', userError);
        toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
        router.push('/cmadmin/users');
        return;
      }
      setUser(userData);

      const { data: finData, error: finError } = await supabase.rpc('get_user_financials', { p_user_id: userId });
       if (finError) {
        console.error('Error fetching financials:', finError);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch financial stats. Please run the master SQL script.' });
      } else if (finData) {
        setFinancials(finData[0]);
      }
      
      const { count, error: refError } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('referred_by', userData.referral_code);
      if (refError) {
        console.error('Error fetching referral count:', refError);
      } else {
        setReferralCount(count || 0);
      }
      
      setLoading(false);
  }, [userId, router, toast]);

  useEffect(() => {
    if (!userId) return;
    fetchAllData();
  }, [userId, fetchAllData]);

  const handleBalanceUpdate = () => {
    if (!balanceAmount || !user) {
        toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide an amount.' });
        return;
    }
    
    startBalanceUpdate(async () => {
        const amount = parseFloat(balanceAmount);
        const signedAmount = balanceAction === 'credit' ? amount : -amount;
        const currentBalance = user.balance_available || 0;
        const newBalance = currentBalance + signedAmount;
        
        try {
            // Step 1: Insert into wallet_history
            const historyDescription = `Manual ${balanceAction} by admin.`;
            const { error: historyError } = await supabase
                .from('wallet_history')
                .insert({
                    user_id: userId,
                    amount: signedAmount,
                    type: balanceAction === 'credit' ? 'manual_credit' : 'manual_debit',
                    status: 'Completed',
                    description: historyDescription
                });

            if (historyError) throw historyError;
            
            // Step 2: Update the user's available balance
            const { error: userUpdateError } = await supabase
                .from('users')
                .update({ balance_available: newBalance })
                .eq('id', userId);

            if (userUpdateError) throw userUpdateError;

            toast({ title: 'Balance Updated', description: "The user's balance and history have been updated." });
            setIsBalanceDialogOpen(false);
            setBalanceAmount('');
            await fetchAllData(); // Refresh all data on the page

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold">User Not Found</h1>
        <p>The requested user could not be found.</p>
        <Button onClick={() => router.push('/cmadmin/users')} className="mt-4">Back to List</Button>
      </div>
    );
  }
  
  const formattedDate = format(new Date(user.created_at), 'PPP p');

  const stats = [
    { label: 'Available Balance', value: formatCurrency(financials?.available_balance || 0), icon: Wallet, color: 'text-green-500' },
    { label: 'Pending Balance', value: formatCurrency(financials?.pending_balance || 0), icon: Clock, color: 'text-yellow-500' },
    { label: 'Total Earnings', value: formatCurrency(financials?.total_earnings || 0), icon: ArrowUp, color: 'text-blue-500' },
    { label: 'Total Withdrawn', value: formatCurrency(financials?.total_withdrawn || 0), icon: ArrowDown, color: 'text-red-500' },
    { label: 'Referrals (L1)', value: referralCount, icon: UserPlus, color: 'text-purple-500' },
  ];

  return (
    <>
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">{user.full_name || user.email}</h1>
            <p className="text-muted-foreground">User ID: {user.id}</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => router.push('/cmadmin/users')}>Back to List</Button>
        </div>
      </div>
       
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={cn("h-4 w-4 text-muted-foreground", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

       <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary"/> Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4"/> Full Name</span>
                        <span className="font-semibold">{user.full_name || 'N/A'}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4"/> Email Address</span>
                        <span className="font-semibold">{user.email}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4"/> Mobile Number</span>
                        <span className="font-semibold">{user.mobile || 'N/A'}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/> Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4"/> Status</span>
                        <Badge variant={user.status === 'Blocked' ? 'destructive' : 'outline'}>
                            {user.status || 'Active'}
                        </Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> Registered On</span>
                        <span className="font-semibold">{formattedDate}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Hash className="h-4 w-4"/> Referral Code</span>
                        <span className="font-mono font-semibold">{user.referral_code}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5 text-primary"/> Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <Button variant="outline" onClick={() => setIsBalanceDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Balance
                 </Button>
                 <Button variant="outline" asChild>
                    <Link href={`/cmadmin/tasks?userId=${userId}`}>
                        <ListTodo className="mr-2 h-4 w-4" /> View Task History
                    </Link>
                 </Button>
                 <Button variant="outline" asChild>
                    <Link href={`/withdraw/history?userId=${userId}`}>
                        <History className="mr-2 h-4 w-4" /> View Wallet History
                    </Link>
                 </Button>
            </CardContent>
        </Card>
    </div>

    <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit User Balance</DialogTitle>
                <DialogDescription>Manually credit or debit the user's wallet. This will directly change the user's available balance and add a record to their wallet history.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Action</Label>
                    <Select value={balanceAction} onValueChange={(value: 'credit' | 'debit') => setBalanceAction(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="credit">Credit (Add Balance)</SelectItem>
                            <SelectItem value="debit">Debit (Remove Balance)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="balance-amount">Amount (in INR)</Label>
                    <Input id="balance-amount" type="number" placeholder="e.g., 100" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} disabled={isUpdatingBalance} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" disabled={isUpdatingBalance}>Cancel</Button>
                </DialogClose>
                <Button onClick={handleBalanceUpdate} disabled={isUpdatingBalance || !balanceAmount}>
                    {isUpdatingBalance && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Confirm Update
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
