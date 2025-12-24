
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  pendingTasks: number;
  pendingWithdrawals: number;
  totalPaid: number;
  completedTasks: number;
  pendingCoins: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      const { count: pendingTasks } = await supabase
        .from('usertasks')
        .select('id', { count: 'exact' })
        .eq('status', 'Pending');

      const { count: pendingWithdrawalsCount, data: pendingWithdrawalsData } = await supabase
        .from('payments')
        .select('*, users(full_name)', { count: 'exact' })
        .eq('status', 'Pending')
        .limit(5)
        .order('created_at', { ascending: false });

      const { data: paidData } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'Completed');
      const totalPaid = paidData ? paidData.reduce((sum, item) => sum + item.amount, 0) : 0;
      
      const { count: completedTasks } = await supabase
        .from('usertasks')
        .select('id', { count: 'exact' })
        .eq('status', 'Approved');
        
      const { count: pendingCoins } = await supabase
        .from('coinsubmissions')
        .select('id', { count: 'exact' })
        .eq('status', 'Pending');

      const { data: recentUsersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: totalUsers || 0,
        pendingTasks: pendingTasks || 0,
        pendingWithdrawals: pendingWithdrawalsCount || 0,
        totalPaid: totalPaid,
        completedTasks: completedTasks || 0,
        pendingCoins: pendingCoins || 0
      });

      setRecentUsers(recentUsersData || []);
      setPendingWithdrawals(pendingWithdrawalsData || []);
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map(card => (
            <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                        <div className="text-2xl font-bold">{card.value}</div>
                    )}
                </CardContent>
            </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                <CardTitle>Recent Registrations</CardTitle>
            </div>
            <Button variant="outline" size="sm" asChild>
                <Link href="/cmadmin/users">View All <ArrowRight className="ml-2 h-4 w-4"/></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow><TableCell colSpan={2} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow>
                ) : recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                <CardTitle>Pending Withdrawals</CardTitle>
            </div>
             <Button variant="outline" size="sm" asChild>
                <Link href="/cmadmin/withdrawals">View All <ArrowRight className="ml-2 h-4 w-4"/></Link>
              </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {isLoading ? (
                    <TableRow><TableCell colSpan={2} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow>
                ) : pendingWithdrawals.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="text-center h-24 text-muted-foreground">No pending withdrawals.</TableCell></TableRow>
                ) : pendingWithdrawals.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.users?.full_name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ₹{req.amount.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
