
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Loader2, ListFilter, CheckCircle, XCircle, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/context/currency-context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Papa from 'papaparse';


type TaskStatus = 'Pending' | 'Approved' | 'Rejected';

interface AppTask {
  id: string;
  submission_time: string;
  task_type: string;
  reward: number;
  status: TaskStatus;
  user_id: string;
  submission_data: any;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get('userId');

  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(preselectedUserId || '');
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>(['Pending']);
  const [isUpdating, startUpdateTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AppTask | null>(null);
  const [newStatus, setNewStatus] = useState<TaskStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

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
            submission_data,
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
        // Filter out Niva and Top coin tasks
        const filteredData = (data as AppTask[]).filter(task => task.task_type !== 'niva-coin' && task.task_type !== 'top-coin');
        setTasks(filteredData);
      }
      setLoading(false);
    };

  useEffect(() => {
    fetchTasks();
  }, []);
  
  const updateTaskStatus = async (task: AppTask, status: TaskStatus, reason?: string) => {
    const existingMetadata = task.submission_data?.metadata || {};
    const updatePayload: { status: TaskStatus; submission_data?: any } = { status };
    
    let newMetadata = {...existingMetadata};
    if (status === 'Rejected' && reason) {
        newMetadata.rejection_reason = reason;
    }
    if (status === 'Approved' && reason) {
        newMetadata.approval_note = reason;
    }

    updatePayload.submission_data = { ...task.submission_data, metadata: newMetadata };


    const { error: updateError } = await supabase
        .from('usertasks')
        .update(updatePayload)
        .eq('id', task.id);

    if (updateError) throw updateError;
    
    if (status === 'Approved' && task.reward > 0) {
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
  }


  const handleSingleUpdate = (task: AppTask, status: TaskStatus) => {
    startUpdateTransition(async () => {
        try {
            await updateTaskStatus(task, status, rejectionReason);
            toast({
                title: 'Success',
                description: `Task has been ${status.toLowerCase()}.`,
            });
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

  const openConfirmationDialog = (task: AppTask, status: TaskStatus) => {
    setSelectedTask(task);
    setNewStatus(status);
    setDialogOpen(true);
    setRejectionReason(''); // Reset reason
  };
  
  const confirmAction = () => {
    if (selectedTask && newStatus) {
        if (newStatus === 'Rejected' && !rejectionReason.trim()) {
            toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for rejection.' });
            return;
        }
      handleSingleUpdate(selectedTask, newStatus);
    }
    setDialogOpen(false);
    setSelectedTask(null);
    setNewStatus(null);
    setRejectionReason('');
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(task.status);
        const matchesSearch = !filter ||
            (task.users?.full_name?.toLowerCase().includes(filter.toLowerCase())) ||
            (task.users?.email?.toLowerCase().includes(filter.toLowerCase())) ||
            (task.task_type?.toLowerCase().includes(filter.toLowerCase())) ||
            (String(task.id).toLowerCase().includes(filter.toLowerCase())) ||
            (task.user_id.toLowerCase().includes(filter.toLowerCase()));
            
        return matchesStatus && matchesSearch;
    });
  }, [tasks, filter, statusFilters]);
  
  const toggleFilter = (status: TaskStatus) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };
  
  const availableCategories = useMemo(() => {
    return [...new Set(tasks.map(t => t.task_type))];
  }, [tasks]);
  

  const handleDownloadCSV = () => {
      if (!selectedCategory) {
          toast({ variant: 'destructive', title: 'No category selected', description: 'Please select a task category to download.' });
          return;
      }
      
      const tasksToDownload = tasks.filter(task => task.task_type === selectedCategory);
      
      if (tasksToDownload.length === 0) {
          toast({ variant: 'destructive', title: 'No tasks found', description: `No tasks found for the category: ${selectedCategory}`});
          return;
      }
      
      let csvData: any[];

      if (selectedCategory === 'gmail') {
          csvData = tasksToDownload.map(task => {
              const {
                  gmail,
                  password,
                  recoveryMailSubmission,
                  ...restSubmissionData
              } = task.submission_data;
              return {
                  gmail: gmail,
                  password: password,
                  recoveryMailSubmission: recoveryMailSubmission,
                  ...restSubmissionData,
                  task_id: task.id,
                  user_id: task.user_id,
                  user_email: task.users?.email,
                  user_name: task.users?.full_name,
                  status: task.status,
                  reward: task.reward,
                  submission_time: task.submission_time,
              };
          });
      } else {
         csvData = tasksToDownload.map(task => ({
              ...task.submission_data,
              task_id: task.id,
              user_id: task.user_id,
              user_email: task.users?.email,
              user_name: task.users?.full_name,
              status: task.status,
              reward: task.reward,
              submission_time: task.submission_time,
          }));
      }

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${selectedCategory}_tasks_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: 'Download Started', description: `Your CSV file for ${selectedCategory} is being downloaded.`});
      setDownloadDialogOpen(false);
      setSelectedCategory('');
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Task Center</h1>
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
        
        <div className="flex items-center gap-2 border p-2 rounded-lg bg-muted/50">
            <p className="text-sm font-semibold">Bulk Actions</p>
            <div className="ml-auto flex gap-2">
                 <Button size="sm" variant="secondary" onClick={() => setDownloadDialogOpen(true)}>
                    <Download className="mr-2 h-4 w-4"/> Download as CSV
                </Button>
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
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating || task.status !== 'Pending'}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            disabled={task.status !== 'Pending' || isUpdating} 
                            onSelect={() => openConfirmationDialog(task, 'Approved')}
                            className="cursor-pointer"
                          >
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={task.status !== 'Pending' || isUpdating} 
                            onSelect={() => openConfirmationDialog(task, 'Rejected')}
                            className="cursor-pointer text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4"/>
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
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to <span className={cn("font-bold", newStatus === 'Approved' ? "text-green-600" : "text-red-600")}>{newStatus?.toLowerCase()}</span> this task. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(newStatus === 'Rejected' || newStatus === 'Approved') && (
              <div className="space-y-2 pt-2">
                  <Label htmlFor="action-reason" className="font-semibold">
                    {newStatus === 'Rejected' ? 'Reason for Rejection' : 'Reason/Note for Approval (Optional)'}
                  </Label>
                  <Textarea 
                      id="action-reason"
                      placeholder={newStatus === 'Rejected' ? 'Provide a clear reason for rejecting this task...' : 'Optional approval note...'}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                  />
              </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmAction}
                disabled={newStatus === 'Rejected' && !rejectionReason.trim()}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Download Tasks as CSV</DialogTitle>
              <DialogDescription>
                Select a task category to download all its entries as a single CSV file.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-2">
              <Label htmlFor="category-select">Task Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Select a category..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map(category => (
                    <SelectItem key={category} value={category} className="capitalize">
                      {category.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

             <DialogFooter>
                <Button variant="outline" onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleDownloadCSV} disabled={!selectedCategory}>
                   <Download className="mr-2 h-4 w-4"/>
                   Download CSV
                </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
