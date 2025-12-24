
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ListFilter, Loader2, CheckCircle2, XCircle, Hourglass, Mail, Type, User, Users, Hash } from "lucide-react";
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { useCurrency } from '@/context/currency-context';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const ITEMS_PER_PAGE = 10;
type Status = 'Approved' | 'Pending' | 'Rejected';

function TaskSubmissions() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  
  const [statusFilters, setStatusFilters] = useState<Status[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchUserAndTasks = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setUser(session.user);
            const { data, error } = await supabase
                .from('usertasks')
                .select('*')
                .eq('user_id', session.user.id)
                .order('submission_time', { ascending: false });
            
            if (error) {
                console.error("Error fetching task history:", error);
            } else {
                setTaskHistory(data || []);
            }
        }
        setIsHistoryLoading(false);
    };
    fetchUserAndTasks();
  }, []);
  
  const filteredTasks = useMemo(() => {
     if (!taskHistory) return [];
     let tasks = statusFilters.length > 0 
      ? taskHistory.filter((task: any) => statusFilters.includes(task.status as Status)) 
      : taskHistory;
     return tasks;
  }, [taskHistory, statusFilters]);

  const currentTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTasks.slice(startIndex, endIndex);
  }, [filteredTasks, currentPage]);

  const canLoadMore = currentPage * ITEMS_PER_PAGE < filteredTasks.length;
  const canGoBack = currentPage > 1;

  const toggleFilter = (status: Status) => {
    setCurrentPage(1);
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };
  
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  const loadMore = () => {
    if (canLoadMore) {
        setCurrentPage(prev => prev + 1);
    }
  };

  const goBack = () => {
    if (canGoBack) {
        setCurrentPage(prev => prev - 1);
    }
  }
  
  const getTaskDisplayType = (task: any) => {
    if (task.task_type === 'used-mail-single') {
      return 'Used Mail (Single)';
    }
    if (task.task_type === 'used-mail-bulk') {
        return `Used Mail (Bulk - ${task.submission_data?.entry_count || 0} entries)`;
    }
    if (task.task_type === 'gmail') {
      return 'Gmail Creation Task';
    }
    if (task.task_type === 'visit-earn') {
      return 'Visit & Earn Task';
    }
     if (task.task_type === 'watch-earn') {
      return 'Watch & Earn Task';
    }
    if (task.submission_data?.appName) {
        return 'App Install Task';
    }
    return task.task_type ? task.task_type.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Unknown Task';
  };

  const getSubmissionDetail = (task: any) => {
    const data = task.submission_data;
    if (!data) return null;
    
    if (data.code) {
        return <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1"><Hash className="h-3 w-3"/> Code: {data.code}</div>;
    }
    if (data.email || data.gmail) {
      return <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1"><Mail className="h-3 w-3"/> {data.email || data.gmail}</div>;
    }
    if (data.file_name) {
         return <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1"><Users className="h-3 w-3"/> {data.file_name}</div>;
    }
    if (data.name) {
      return <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1"><User className="h-3 w-3"/> {data.name}</div>;
    }
    if (data.appName) {
        return <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1"><Type className="h-3 w-3"/> {data.appName}</div>;
    }
    return null;
  };

  return (
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Submissions</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={statusFilters.includes('Approved')} onCheckedChange={() => toggleFilter('Approved')}>Approved</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilters.includes('Pending')} onCheckedChange={() => toggleFilter('Pending')}>Pending</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilters.includes('Rejected')} onCheckedChange={() => toggleFilter('Rejected')}>Rejected</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Details</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Submitted At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isHistoryLoading && <TableRow><TableCell colSpan={4} className="h-24 text-center"><div className="flex justify-center items-center gap-2"><Loader2 className="h-6 w-6 animate-spin"/> Loading...</div></TableCell></TableRow>}
                {!isHistoryLoading && currentTasks.map((task: any, index: number) => (
                  <TableRow key={task.id || index}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        <Type className="h-4 w-4 text-muted-foreground"/> {getTaskDisplayType(task)}
                      </div>
                      {getSubmissionDetail(task)}
                    </TableCell>
                    <TableCell><div className="font-medium text-green-600">{task.reward ? formatCurrency(task.reward) : 'N/A'}</div></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                          task.status === "Approved" && "bg-green-100 text-green-800 border-green-200",
                          task.status === "Pending" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                          task.status === "Rejected" && "bg-red-100 text-red-800 border-red-200"
                        )}>{task.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs">{formatDate(task.submission_time)}</TableCell>
                  </TableRow>
                ))}
                {!isHistoryLoading && (!currentTasks || currentTasks.length === 0) && (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground h-24">No submissions found for the selected filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <div className="pt-4 flex justify-center gap-2">
                {canGoBack && (
                    <Button onClick={goBack} variant="outline">Previous</Button>
                )}
                {canLoadMore && (
                    <Button onClick={loadMore} variant="outline">Load More</Button>
                )}
            </div>
          </CardContent>
        </Card>
  )
}


export default function TaskHistoryPage() {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [taskCounts, setTaskCounts] = useState({ approved: 0, pending: 0, rejected: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTaskCounts = async (userId: string) => {
            const { data, error } = await supabase
                .from('usertasks')
                .select('status')
                .eq('user_id', userId);

            if (error) {
                console.error("Error fetching task counts for stats:", error);
            } else if (data) {
                const counts = {
                    approved: data.filter(t => t.status === 'Approved').length,
                    pending: data.filter(t => t.status === 'Pending').length,
                    rejected: data.filter(t => t.status === 'Rejected').length,
                };
                setTaskCounts(counts);
            }
            setIsLoading(false);
        };

        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if(session){
                setUser(session.user);
                fetchTaskCounts(session.user.id);
            } else {
                setIsLoading(false);
            }
        };
        getUser();
    }, []);

    return (
    <div className="min-h-screen">
       <PageHeader title="Submission History" description="Review all your past submissions" />

      <main className="p-4 space-y-4">
        
        <div className="grid grid-cols-3 gap-4 mb-4">
            <Card className="bg-green-50 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-800">Approved</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-900">{isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : taskCounts.approved}</div>
                </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-800">Pending</CardTitle>
                    <Hourglass className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-900">{isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : taskCounts.pending}</div>
                </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-red-800">Rejected</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-900">{isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : taskCounts.rejected}</div>
                </CardContent>
            </Card>
        </div>
        
        <TaskSubmissions />
      </main>
    </div>
  );
}
