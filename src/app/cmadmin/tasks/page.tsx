'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  XCircle,
  ListFilter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

type TaskStatus = 'Pending' | 'Approved' | 'Rejected';
type TaskSubmission = {
  id: number;
  user_id: string;
  task_type: string;
  status: TaskStatus;
  reward: number;
  submission_time: string;
  submission_data: any;
  users: { full_name: string } | null;
};

export default function ManageTasksPage() {
  const [tasks, setTasks] = useState<TaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus[]>([
    'Pending',
  ]);
  const { toast } = useToast();

  const fetchTasks = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('usertasks')
      .select('*, users (full_name)')
      .order('submission_time', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch task submissions.',
      });
    } else {
      setTasks(data as TaskSubmission[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (
    taskId: number,
    newStatus: 'Approved' | 'Rejected',
    userId: string,
    reward: number
  ) => {
    // If approving, credit the user's wallet
    if (newStatus === 'Approved') {
        const { error: walletError } = await supabase.rpc('credit_user_wallet', {
            p_user_id: userId,
            p_amount: reward,
            p_description: 'Task reward approved'
        });

        if (walletError) {
             toast({ variant: 'destructive', title: 'Wallet Update Failed', description: walletError.message });
             return;
        }
    }

    const { error } = await supabase
      .from('usertasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Success',
        description: `Task status updated to ${newStatus}.`,
      });
      fetchTasks(); // Refresh data
    }
  };

  const filteredTasks = useMemo(() => {
    if (statusFilter.length === 0) return tasks;
    return tasks.filter((task) => statusFilter.includes(task.status));
  }, [tasks, statusFilter]);

  const toggleFilter = (status: TaskStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const getSubmissionDetail = (task: TaskSubmission) => {
    const data = task.submission_data;
    if (!data) return 'No details';

    if (task.task_type === 'gmail') {
      return `Gmail: ${data.gmail}`;
    }
    if (task.task_type === 'used-mail-single') {
        return `Email: ${data.email}`;
    }
    if (task.task_type === 'used-mail-bulk') {
        return `${data.entry_count} emails in ${data.file_name}`;
    }
    return JSON.stringify(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Task Submissions</CardTitle>
            <CardDescription>
              Review, approve, or reject user task submissions.
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('Pending')}
                onCheckedChange={() => toggleFilter('Pending')}
              >
                Pending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('Approved')}
                onCheckedChange={() => toggleFilter('Approved')}
              >
                Approved
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes('Rejected')}
                onCheckedChange={() => toggleFilter('Rejected')}
              >
                Rejected
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User & Task</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No tasks found for the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="font-medium">
                      {task.users?.full_name || 'Unknown User'}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {task.task_type.replace(/_/g, ' ')}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs max-w-xs truncate">
                    {getSubmissionDetail(task)}
                  </TableCell>
                  <TableCell className="font-medium">₹{task.reward}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        task.status === 'Approved'
                          ? 'default'
                          : task.status === 'Rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className={task.status === 'Approved' ? 'bg-green-600' : ''}
                    >
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {task.status === 'Pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleStatusChange(task.id, 'Approved', task.user_id, task.reward)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                           onClick={() => handleStatusChange(task.id, 'Rejected', task.user_id, task.reward)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
