
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2, Hourglass, MessageSquare } from 'lucide-react';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [pendingTasks, setPendingTasks] = useState<number | null>(null);
  const [pendingTickets, setPendingTickets] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }

      // Fetch total users count
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error("Error fetching user count:", usersError);
        setTotalUsers(0);
      } else {
        setTotalUsers(usersCount);
      }

      // Fetch pending tasks count
      const { count: tasksCount, error: tasksError } = await supabase
        .from('usertasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending');

      if (tasksError) {
        console.error("Error fetching pending tasks count:", tasksError);
        setPendingTasks(0);
      } else {
        setPendingTasks(tasksCount);
      }

      // Fetch pending tickets count ('Open' and 'In Progress')
      const { count: ticketsCount, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Open', 'In Progress']);

      if (ticketsError) {
        console.error("Error fetching pending tickets count:", ticketsError);
        setPendingTickets(0);
      } else {
        setPendingTickets(ticketsCount);
      }
      
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">An overview of your application stats.</p>
        </div>
      </div>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                    <div className="text-2xl font-bold">
                        {totalUsers}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    Total registered users in the system
                </p>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Pending Tasks
                </CardTitle>
                <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                    <div className="text-2xl font-bold">
                        {pendingTasks}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    Tasks awaiting approval
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Pending Tickets
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                    <div className="text-2xl font-bold">
                        {pendingTickets}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    Support tickets awaiting response
                </p>
            </CardContent>
        </Card>

       </div>
    </div>
  );
}
