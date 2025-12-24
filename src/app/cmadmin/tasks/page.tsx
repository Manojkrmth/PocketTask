
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Loader2, ListFilter, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/context/currency-context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


type TaskStatus = 'Pending' | 'Approved' | 'Rejected';

interface AppTask {
  id: string;
  submission_time: string;
  task_type: string;
  reward: number;
  status: TaskStatus;
  user_id: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>([]);
  const [isUpdating, startUpdateTransition] = useTransition();

  const { formatCurrency } = useCurrency();
  const { toast } = useToast();

  const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('usertasks')
        .select(`
            id,
            submission_time,
            task_type,
            reward,
            status,
            user_id,
            users (
                full_name,
                email
            )
        `)
        .order('submission_time', { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch tasks.' });
      } else {
        setTasks(data as AppTask[]);
      }
      setLoading(false);
    };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateTaskStatus = (task: AppTask, newStatus: TaskStatus) => {
    startUpdateTransition(async () => {
        try {
            // Step 1: Update the task status in the usertasks table
            const { error: updateError } = await supabase
                .from('usertasks')
                .update({ status: newStatus })
                .eq('id', task.id);

            if (updateError) throw updateError;
            
            // Step 2: If approved, credit the user's wallet
            if (newStatus === 'Approved' && task.reward > 0) {
                 const { error: walletError } = await supabase
                    .from('wallet_history')
                    .insert({
                        user_id: task.user_id,
                        amount: task.reward,
                        type: 'task_reward',
                        status: 'Completed',
                        description: `Reward for task: ${task.task_type}`
                    });
                
                if (walletError) throw walletError;
            }

            toast({
                title: 'Success',
                description: `Task has been ${newStatus.toLowerCase()}.`,
            });
            
            // Refresh the tasks list to show the updated status
            await fetchTasks();

        } catch (error: any) {
            console.error('Error updating task status:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message,
            });
        }
    });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(task.status);
        const matchesSearch = !filter ||
            (task.users?.full_name?.toLowerCase().includes(filter.toLowerCase())) ||
            (task.users?.email?.toLowerCase().includes(filter.toLowerCase())) ||
            (task.task_type?.toLowerCase().includes(filter.toLowerCase())) ||
            (task.id.toLowerCase().includes(filter.toLowerCase()));
            
        return matchesStatus && matchesSearch;
    });
  }, [tasks, filter, statusFilters]);
  
  const toggleFilter = (status: TaskStatus) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">
            Review, approve, or reject user task submissions.
          </p>
        </div>
        <div className="flex gap-2">
            <Input
            placeholder="Filter tasks..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span>Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={statusFilters.includes('Pending')} onCheckedChange={() => toggleFilter('Pending')}>Pending</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilters.includes('Approved')} onCheckedChange={() => toggleFilter('Approved')}>Approved</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilters.includes('Rejected')} onCheckedChange={() => toggleFilter('Rejected')}>Rejected</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Details</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="font-medium capitalize">{task.task_type.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-muted-foreground">ID: {task.id}</div>
                  </TableCell>
                   <TableCell>
                    <div className="font-medium">{task.users?.full_name || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{task.users?.email}</div>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(task.reward || 0)}
                  </TableCell>
                  <TableCell>
                     <Badge variant="outline" className={cn(
                          task.status === "Approved" && "bg-green-100 text-green-800 border-green-200",
                          task.status === "Pending" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                          task.status === "Rejected" && "bg-red-100 text-red-800 border-red-200"
                        )}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(task.submission_time), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem disabled={task.status !== 'Pending' || isUpdating} onClick={() => handleUpdateTaskStatus(task, 'Approved')}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                          Approve
                        </DropdownMenuItem>
                         <DropdownMenuItem disabled={task.status !== 'Pending' || isUpdating} onClick={() => handleUpdateTaskStatus(task, 'Rejected')}>
                          <XCircle className="mr-2 h-4 w-4 text-red-600"/>
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
