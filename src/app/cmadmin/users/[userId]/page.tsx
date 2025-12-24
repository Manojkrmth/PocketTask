
'use client';

import { useEffect, useState } from 'react';
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

interface AppUser {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  status: string;
  created_at: string;
  referral_code: string;
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
  const { formatCurrency } = useCurrency();
  const userId = params.userId as string;

  const [user, setUser] = useState<AppUser | null>(null);
  const [financials, setFinancials] = useState<FinancialStats | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchAllData = async () => {
      setLoading(true);
      
      // Fetch user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('Error fetching user:', userError);
        router.push('/cmadmin/users');
        return;
      }
      setUser(userData);

      // Fetch financial stats
      const { data: finData, error: finError } = await supabase.rpc('get_user_financials', { p_user_id: userId });
       if (finError) {
        console.error('Error fetching financials:', finError);
      } else {
        setFinancials(finData[0]);
      }
      
      // Fetch referral count
      // This is a simplified count. A recursive CTE would be needed for multi-level counts.
      const { count, error: refError } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('referred_by', userData.referral_code);
      if (refError) {
        console.error('Error fetching referral count:', refError);
      } else {
        setReferralCount(count || 0);
      }
      
      setLoading(false);
    };

    fetchAllData();
  }, [userId, router]);

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
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">{user.full_name || user.email}</h1>
            <p className="text-muted-foreground">User ID: {user.id}</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/cmadmin/users/${userId}/edit`)}>
              <Edit className="mr-2 h-4 w-4"/>
              Edit User
            </Button>
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
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Balance</Button>
                 <Button variant="outline"><ListTodo className="mr-2 h-4 w-4" /> View Task History</Button>
                 <Button variant="outline"><History className="mr-2 h-4 w-4" /> View Wallet History</Button>
            </CardContent>
        </Card>
    </div>
  );
}
