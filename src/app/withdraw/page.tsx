
'use client';

import Link from 'next/link';
import { History, ChevronDown, Loader2, AlertTriangle, Info, Wallet, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState, useTransition, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCurrency } from '@/context/currency-context';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { PageHeader } from '@/components/page-header';

export default function WithdrawPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [balances, setBalances] = useState({ available: 0, hold: 0 });
  const [settingsData, setSettingsData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const [isSubmitting, startTransition] = useTransition();
  const { formatCurrency, currency } = useCurrency();

  useEffect(() => {
    const fetchData = async (sessionUser: User) => {
        setDataLoading(true);
        
        // Fetch wallet balances
        const { data: walletData, error: walletError } = await supabase
            .from('wallet_history')
            .select('amount, status')
            .eq('user_id', sessionUser.id);
        
        let availableBalance = 0;
        if (walletData) {
            availableBalance = walletData.reduce((acc, item) => {
                if (item.status === 'Completed' && item.amount > 0) {
                    return acc + item.amount;
                }
                if (item.amount < 0) {
                    return acc + item.amount;
                }
                return acc;
            }, 0);
        }

        // Fetch hold balance
        const { data: pendingTasks, error: pendingError } = await supabase
            .from('usertasks')
            .select('reward')
            .eq('user_id', sessionUser.id)
            .eq('status', 'Pending');
            
        let holdBalance = 0;
        if (pendingTasks) {
            holdBalance = pendingTasks.reduce((acc, task) => acc + task.reward, 0);
        }

        setBalances({ available: availableBalance, hold: holdBalance });
        
        // Mocking settings data
        setSettingsData({ withdrawal: { chargesPercent: 2, minAmount: 500, methods: { upi: true, bank: true } } });
        
        setDataLoading(false);
    };

    const getUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUser(session.user);
            fetchData(session.user);
        } else {
            setDataLoading(false);
        }
    };
    
    getUser();
  }, []);


  const [amount, setAmount] = useState('');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [userProfileData, setUserProfileData] = useState<any>(null); // Still need this for block status

  useEffect(() => {
    const fetchProfile = async () => {
        if(user) {
            const { data: profile } = await supabase.from('users').select('status').eq('id', user.id).single();
            setUserProfileData(profile);
        }
    }
    fetchProfile();
  }, [user]);

  const withdrawalSettings = settingsData?.withdrawal || { chargesPercent: 2, minAmount: 500, methods: { upi: true } };
  const availableMethods = Object.entries(withdrawalSettings.methods || {})
    .filter(([_, isEnabled]) => isEnabled)
    .map(([key]) => key);

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'upi': return 'UPI';
      case 'bank': return 'Bank Transfer';
      case 'usdt_bep20': return 'USDT (BEP20)';
      default: return method;
    }
  }

  const getPlaceholder = (method: string) => {
    switch (method) {
      case 'upi': return 'your-upi-id@okhdfcbank';
      case 'bank': return 'Account No, Name, IFSC';
      case 'usdt_bep20': return 'Your BEP20 Wallet Address';
      default: return 'Payment Details';
    }
  }

  const isRequestValid = () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated.' });
      return false;
    }
    if (userProfileData?.status === 'Blocked') {
      toast({ variant: 'destructive', title: 'Account Blocked', description: 'You cannot make withdrawals as your account is blocked.' });
      return false;
    }
    if (!amount || !paymentDetails || !selectedMethod) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please enter amount, method, and details.' });
      return false;
    }
    const numAmount = parseFloat(amount);
    const minWithdrawalInr = withdrawalSettings.minAmount;
    
    if (numAmount < (currency === 'USD' ? minWithdrawalInr / 85 : minWithdrawalInr)) { // Assuming a static rate for now
      toast({ variant: 'destructive', title: 'Amount too low', description: `Minimum withdrawal is ${formatCurrency(minWithdrawalInr)}.`});
      return false;
    }

    const availableBalanceInr = balances.available;
    const availableBalanceCurrentCurrency = currency === 'USD' ? availableBalanceInr / 85 : availableBalanceInr;
    
    if (numAmount > availableBalanceCurrentCurrency) {
        toast({ variant: 'destructive', title: 'Insufficient balance', description: 'You cannot withdraw more than your available balance.'});
        return false;
    }
    return true;
  }

  const handleSubmit = async () => {
    if (!isRequestValid() || !user) return;
    
    const numAmount = parseFloat(amount);
    const amountInr = currency === 'USD' ? numAmount * (settingsData?.usdToInrRate || 85) : numAmount;

    startTransition(async () => {
        try {
            const { error } = await supabase
              .from('payments')
              .insert({
                  user_id: user.id,
                  amount: amountInr,
                  payment_method: getMethodLabel(selectedMethod),
                  payment_details: paymentDetails,
                  status: 'Pending',
              });

            if (error) throw error;
            
            const newBalance = balances.available - amountInr;
            setBalances(prev => ({...prev, available: newBalance}));


            toast({ title: 'Success', description: 'Withdrawal request submitted.' });
            setAmount('');
            setPaymentDetails('');
        } catch(error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    })
  };

  const charge = (parseFloat(amount) || 0) * (withdrawalSettings.chargesPercent / 100);
  const receiveAmount = (parseFloat(amount) || 0) - charge;
  const isLoading = dataLoading;
  const isUserBlocked = userProfileData?.status === 'Blocked';
  
  const minWithdrawalDisplay = formatCurrency(withdrawalSettings.minAmount);
  const availableBalanceDisplay = formatCurrency(balances.available || 0);
  const holdBalanceDisplay = formatCurrency(balances.hold || 0);

  const getUsdValue = () => {
    if (selectedMethod !== 'usdt_bep20' || !amount) return null;
    const usdRate = settingsData?.usdToInrRate || 85;
    const amountInr = currency === 'USD' ? parseFloat(amount) * usdRate : parseFloat(amount);
    const chargeInr = amountInr * (withdrawalSettings.chargesPercent / 100);
    const finalAmountInr = amountInr - chargeInr;
    const finalUsd = finalAmountInr / usdRate;
    return finalUsd.toFixed(4);
  }

  return (
    <div>
       <PageHeader 
        title="Withdraw"
        actionButton={
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-primary-foreground hover:bg-white/20" asChild>
              <Link href="/withdraw/history">
                <History className="h-5 w-5" />
              </Link>
            </Button>
        }
       />

      <main className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-green-500 text-white text-center border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2 pl-2"><Wallet /> Available</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin"/> : <p className="text-2xl font-bold">{availableBalanceDisplay}</p>}
            </CardContent>
          </Card>
          <Card className="bg-orange-400 text-white text-center border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2 pl-2"><Lock /> On Hold</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
               {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin"/> : <p className="text-2xl font-bold">{holdBalanceDisplay}</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Withdrawal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-bold">Withdrawal Method</Label>
              <Select onValueChange={setSelectedMethod} value={selectedMethod} disabled={isLoading || isUserBlocked}>
                  <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                     {availableMethods.length > 0 ? availableMethods.map(method => (
                          <SelectItem key={method} value={method}>{getMethodLabel(method)}</SelectItem>
                     )) : <SelectItem value="none" disabled>No methods available</SelectItem>}
                  </SelectContent>
              </Select>
            </div>
            
            {selectedMethod && (
              <>
                <div>
                  <Label htmlFor="amount" className="font-bold">Amount ({currency})</Label>
                  <Input id="amount" type="number" placeholder={`Min: ${minWithdrawalDisplay}`} className="text-lg font-semibold h-12 mt-1" value={amount} onChange={e => setAmount(e.target.value)} disabled={isUserBlocked}/>
                  <p className="text-xs text-muted-foreground mt-1">Available: {availableBalanceDisplay}</p>
                </div>

                <div>
                  <Label htmlFor="payment-details" className="font-bold">Payment Details</Label>
                  <Input id="payment-details" type="text" placeholder={getPlaceholder(selectedMethod)} className="h-12 mt-1" value={paymentDetails} onChange={e => setPaymentDetails(e.target.value)} disabled={isUserBlocked} />
                </div>
                
                {selectedMethod === 'upi' && (
                  <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                    <Info className="h-4 w-4 !text-yellow-600" />
                    <AlertTitle>Check Your UPI ID</AlertTitle>
                    <AlertDescription>
                      Please ensure your UPI ID is correct. Payments made to incorrect IDs cannot be reversed.
                    </AlertDescription>
                  </Alert>
                )}
                
                {selectedMethod === 'bank' && (
                  <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                    <Info className="h-4 w-4 !text-yellow-600" />
                    <AlertTitle>Check Your Bank Details</AlertTitle>
                    <AlertDescription>
                      Please enter your Account Number, Full Name, and IFSC Code carefully. Incorrect details will lead to transaction failure.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedMethod === 'usdt_bep20' && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                    <AlertTriangle className="h-4 w-4 !text-red-600" />
                    <AlertTitle>Important Notice</AlertTitle>
                    <AlertDescription>
                      Please double-check your BEP20 wallet address. Providing an incorrect address will result in permanent loss of funds. We are not responsible for losses due to incorrect details.
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                  <AlertDescription>
                    <p>Withdraw Charges ({withdrawalSettings.chargesPercent}%): <span className="font-semibold">{formatCurrency(charge)}</span></p>
                    <p className="font-bold">You'll receive: <span className="font-semibold">{formatCurrency(receiveAmount)}</span></p>
                    {selectedMethod === 'usdt_bep20' && getUsdValue() && (
                      <p className="font-bold mt-1">Approx. <span className="text-green-600">${getUsdValue()}</span></p>
                    )}
                  </AlertDescription>
                </Alert>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90" disabled={isSubmitting || isLoading || isUserBlocked || !amount || !paymentDetails}>
                      {isSubmitting ? 'Submitting...' : 'Submit Withdrawal'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Your Withdrawal</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please review the details below before confirming. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-bold">{formatCurrency(parseFloat(amount) || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Method:</span>
                        <span className="font-bold">{getMethodLabel(selectedMethod)}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground">Details:</span>
                        <span className="font-bold text-right break-all">{paymentDetails}</span>
                      </div>
                       <hr className="my-2"/>
                       <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">You Will Receive:</span>
                        <span className="font-bold text-green-600">{formatCurrency(receiveAmount)}</span>
                      </div>
                      {selectedMethod === 'usdt_bep20' && getUsdValue() && (
                        <div className="flex justify-between text-base">
                          <span className="text-muted-foreground">Approx. USD:</span>
                          <span className="font-bold text-green-600">${getUsdValue()}</span>
                        </div>
                      )}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Withdrawal
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

              </>
            )}

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
