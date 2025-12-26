
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    Users, 
    Loader2, 
    Hourglass, 
    MessageSquare,
    Wallet,
    TrendingUp,
    UserPlus,
    Crown,
    Copy,
    Coins,
    Banknote,
    DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCurrency } from '@/context/currency-context';
import { CopyButton } from '@/components/copy-button';

interface TopUser {
    id: string;
    full_name: string;
    email: string;
    balance_available?: number;
    referral_count?: number;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalUsersBalance, setTotalUsersBalance] = useState<number | null>(null);
  const [pendingTasks, setPendingTasks] = useState<number | null>(null);
  const [pendingTickets, setPendingTickets] = useState<number | null>(null);
  const [totalWithdrawals, setTotalWithdrawals] = useState<number | null>(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<{count: number; amount: number} | null>(null);
  const [pendingCoins, setPendingCoins] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  
  const [topBalanceUsers, setTopBalanceUsers] = useState<TopUser[]>([]);
  const [topReferralUsers, setTopReferralUsers] = useState<TopUser[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const { formatCurrency } = useCurrency();

  const [showAllBalance, setShowAllBalance] = useState(false);
  const [showAllReferrals, setShowAllReferrals] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }

      // Fetch counts in parallel
      const [
        usersRes, 
        tasksCountRes, 
        ticketsCountRes,
        withdrawalsRes,
        pendingWithdrawalsRes,
        pendingCoinsRes,
        topBalanceRes,
        topReferralRes,
        approvedTasksRes,
        approvedCoinsRes
      ] = await Promise.all([
        supabase.rpc('get_total_users_count'),
        supabase.from('usertasks').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['Open', 'In Progress']),
        supabase.from('payments').select('amount', { count: 'exact' }).eq('status', 'Approved'),
        supabase.from('payments').select('amount', { count: 'exact' }).eq('status', 'Pending'),
        supabase.from('coinsubmissions').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('users').select('id, full_name, email, balance_available').order('balance_available', { ascending: false }).limit(10),
        supabase.rpc('get_top_referral_users', { limit_count: 10 }),
        supabase.from('usertasks').select('reward').eq('status', 'Approved'),
        supabase.from('coinsubmissions').select('reward_inr').eq('status', 'Approved')
      ]);
      
      const { data: totalBalanceData, error: totalBalanceError } = await supabase.rpc('get_total_users_balance');
      
      setTotalUsers(usersRes.data || 0);
      setTotalUsersBalance(totalBalanceData || 0);
      setPendingTasks(tasksCountRes.count);
      setPendingTickets(ticketsCountRes.count);
      setTotalWithdrawals(withdrawalsRes.data?.reduce((sum, { amount }) => sum + amount, 0) || 0);

      const pendingWithdrawalsCount = pendingWithdrawalsRes.count ?? 0;
      const pendingWithdrawalsAmount = pendingWithdrawalsRes.data?.reduce((sum, { amount }) => sum + amount, 0) || 0;
      setPendingWithdrawals({count: pendingWithdrawalsCount, amount: pendingWithdrawalsAmount });

      setPendingCoins(pendingCoinsRes.count);
      
      const approvedTasksRevenue = approvedTasksRes.data?.reduce((sum, { reward }) => sum + (reward || 0), 0) || 0;
      const approvedCoinsRevenue = approvedCoinsRes.data?.reduce((sum, { reward_inr }) => sum + (reward_inr || 0), 0) || 0;
      setTotalRevenue(approvedTasksRevenue + approvedCoinsRevenue);

      if (topBalanceRes.data) setTopBalanceUsers(topBalanceRes.data);
      if (topReferralRes.data) setTopReferralUsers(topReferralRes.data);
      
      setIsLoading(false);
    };
    fetchData();
  }, []);
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const visibleBalanceUsers = showAllBalance ? topBalanceUsers : topBalanceUsers.slice(0, 5);
  const visibleReferralUsers = showAllReferrals ? topReferralUsers : topReferralUsers.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">An overview of your application stats.</p>
        </div>
      </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <div className="text-2xl font-bold text-blue-900">{totalUsers}</div>}
            </CardContent>
        </Card>

        <Card className="bg-cyan-50 border-cyan-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-cyan-800">Total Users Available Balance</CardTitle>
                <Banknote className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <div className="text-2xl font-bold text-cyan-900">{formatCurrency(totalUsersBalance || 0)}</div>}
            </CardContent>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-800">Total Revenue Generated</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <div className="text-2xl font-bold text-emerald-900">{formatCurrency(totalRevenue || 0)}</div>}
            </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Total Withdrawn</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <div className="text-2xl font-bold text-green-900">{formatCurrency(totalWithdrawals || 0)}</div>}
            </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">Pending Tickets</CardTitle>
                <MessageSquare className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <div className="text-2xl font-bold text-purple-900">{pendingTickets}</div>}
            </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800">Pending Tasks</CardTitle>
                <Hourglass className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <div className="text-2xl font-bold text-yellow-900">{pendingTasks}</div>}
            </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Pending Withdrawals</CardTitle>
                <Wallet className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold text-red-900">{pendingWithdrawals?.count}</div>
                        <div className="text-sm font-semibold text-red-800/90">({formatCurrency(pendingWithdrawals?.amount || 0)})</div>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">Pending Coin Submissions</CardTitle>
                <Coins className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <div className="text-2xl font-bold text-orange-900">{pendingCoins}</div>}
            </CardContent>
        </Card>

       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Crown className="text-yellow-500" /> Top Users by Balance</CardTitle>
                    <CardDescription>Users with the highest available balance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                         <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>
                    ) : visibleBalanceUsers.length > 0 ? (
                        visibleBalanceUsers.map(u => (
                            <div key={u.id} className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{getInitials(u.full_name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold truncate">{u.full_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">{formatCurrency(u.balance_available || 0)}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-muted-foreground text-center py-10">No user data available.</p>
                    )}
                    {topBalanceUsers.length > 5 && (
                        <Button variant="outline" className="w-full" onClick={() => setShowAllBalance(!showAllBalance)}>
                            {showAllBalance ? 'Show Less' : 'Load More'}
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus className="text-purple-500" /> Top Referral Users</CardTitle>
                    <CardDescription>Users with the most successful referrals.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                         <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>
                    ) : visibleReferralUsers.length > 0 ? (
                        visibleReferralUsers.map(u => (
                            <div key={u.id} className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-purple-100 text-purple-700 font-bold">{getInitials(u.full_name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold truncate">{u.full_name}</p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                       <span>{u.email}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-purple-600">{u.referral_count || 0}</p>
                                    <p className="text-xs text-muted-foreground">Referrals</p>
                                </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-muted-foreground text-center py-10">No referral data available.</p>
                    )}
                    {topReferralUsers.length > 5 && (
                        <Button variant="outline" className="w-full" onClick={() => setShowAllReferrals(!showAllReferrals)}>
                           {showAllReferrals ? 'Show Less' : 'Load More'}
                        </Button>
                    )}
                </CardContent>
            </Card>
       </div>
    </div>
  );
}

    