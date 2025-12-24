
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ClipboardList,
  Wallet,
  IndianRupee,
  CheckCircle,
  Loader2,
  Clock,
  Coins,
  UserPlus,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalUsers: number;
  pendingTasks: number;
  pendingWithdrawals: number;
  totalPaid: number;
  completedTasks: number;
  pendingCoins: number;
}

const dummyTopUsers = [
  { id: 'user1', full_name: 'Ravi Kumar', email: 'ravi.k@example.com', mobile: '9876543210', referral_code: 'CMRAV123', balance_available: 1500.75 },
  { id: 'user2', full_name: 'Sunita Sharma', email: 'sunita.sh@example.com', mobile: '9876543211', referral_code: 'CMSUN456', balance_available: 1250.00 },
  { id: 'user3', full_name: 'Amit Patel', email: 'amit.p@example.com', mobile: '9876543212', referral_code: 'CMAMI789', balance_available: 1100.50 },
  { id: 'user4', full_name: 'Priya Singh', email: 'priya.s@example.com', mobile: '9876543213', referral_code: 'CMPRI012', balance_available: 950.00 },
  { id: 'user5', full_name: 'Vikram Rathore', email: 'vikram.r@example.com', mobile: '9876543214', referral_code: 'CMVIK345', balance_available: 800.25 },
];


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch stats individually instead of using RPC
      try {
        const { count: totalUsersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: pendingTasksCount } = await supabase.from('usertasks').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
        const { count: pendingWithdrawalsCount } = await supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
        const { data: totalPaidData } = await supabase.from('payments').select('amount').eq('status', 'Completed');
        const { count: completedTasksCount } = await supabase.from('usertasks').select('*', { count: 'exact', head: true }).eq('status', 'Approved');
        const { count: pendingCoinsCount } = await supabase.from('coinsubmissions').select('*', { count: 'exact', head: true }).eq('status', 'Pending');

        const totalPaid = totalPaidData ? totalPaidData.reduce((sum, item) => sum + item.amount, 0) : 0;

        setStats({
          totalUsers: totalUsersCount || 0,
          pendingTasks: pendingTasksCount || 0,
          pendingWithdrawals: pendingWithdrawalsCount || 0,
          totalPaid: totalPaid || 0,
          completedTasks: completedTasksCount || 0,
          pendingCoins: pendingCoinsCount || 0,
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
      

      const { data: recentUsersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentUsers(recentUsersData || []);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-500' },
    { title: 'Pending Tasks', value: stats?.pendingTasks, icon: Clock, color: 'text-orange-500' },
    { title: 'Pending Withdrawals', value: stats?.pendingWithdrawals, icon: Wallet, color: 'text-yellow-500' },
    { title: 'Pending Coins', value: stats?.pendingCoins, icon: Coins, color: 'text-amber-500' },
    { title: 'Total Paid', value: `₹${(stats?.totalPaid || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-green-500' },
    { title: 'Completed Tasks', value: stats?.completedTasks, icon: CheckCircle, color: 'text-teal-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Super Admin!</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map(card => (
            <Card key={card.title} className="bg-blue-50 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">{card.title}</CardTitle>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                        <div className="text-3xl font-bold text-blue-900">{card.value}</div>
                    )}
                </CardContent>
            </Card>
        ))}
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
            <Card>
                <CardHeader>
                <CardTitle>Top Users by Balance</CardTitle>
                <CardDescription>Your most active users.</CardDescription>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Referral Code</TableHead>
                        <TableHead>Available Balance</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading && <TableRow><TableCell colSpan={6} className="text-center h-24">Loading top users...</TableCell></TableRow>}
                    {!isLoading && dummyTopUsers.map((user) => (
                        <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.mobile}</TableCell>
                        <TableCell className="font-mono text-xs">{user.referral_code}</TableCell>
                        <TableCell className="font-bold text-green-600">₹{user.balance_available?.toLocaleString('en-IN') || '0'}</TableCell>
                        <TableCell className="text-right">
                           <Link href={`/cmadmin/users/${user.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                                <Eye className="h-4 w-4 mr-2" /> View User
                            </Link>
                        </TableCell>
                        </TableRow>
                    ))}
                     {!isLoading && (!dummyTopUsers || dummyTopUsers.length === 0) && (
                        <TableRow><TableCell colSpan={6} className="text-center h-24">No users with balance found.</TableCell></TableRow>
                     )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>
       </div>
    </div>
  );
}
