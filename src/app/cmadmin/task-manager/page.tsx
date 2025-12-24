
'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Trash2, FileDown, CheckCircle, XCircle, Play, Pause, Edit, Save, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Batch {
  id: number;
  created_at: string;
  batch_name: string;
  status: 'active' | 'paused' | 'archived';
  total_tasks: number;
  file_path: string | null;
  task_category: string;
  reward_price: number;
  stats?: {
    approved: number;
    pending: number;
    rejected: number;
  }
}

export default function TaskManagerPage() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, startUploading] = useTransition();

  const [batchName, setBatchName] = useState('');
  const [taskCategory, setTaskCategory] = useState('gmail');
  const [rewardPrice, setRewardPrice] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const fetchBatches = useCallback(async () => {
    setIsLoading(true);
    const { data: batchData, error: batchError } = await supabase
      .from('gmail_task_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (batchError) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch task batches.' });
      setBatches([]);
    } else if (batchData) {
      const batchesWithStats = await Promise.all(batchData.map(async (batch) => {
        const { data: statsData, error: statsError } = await supabase.rpc('get_batch_stats', { batch_id_param: batch.id });
        
        let stats = { approved: 0, pending: 0, rejected: 0 };
        if (statsError) {
            console.error(`Error fetching stats for batch ${batch.id}:`, statsError);
        } else if (statsData && statsData.length > 0) {
            stats = {
                approved: statsData[0].total_approved || 0,
                pending: statsData[0].total_pending || 0,
                rejected: statsData[0].total_rejected || 0,
            }
        }
        return { ...batch, stats };
      }));
      setBatches(batchesWithStats);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleFileUpload = async () => {
    const price = parseFloat(rewardPrice);
    if (!batchName.trim() || !csvFile || !taskCategory || !rewardPrice || isNaN(price) || price < 0) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a valid batch name, category, reward price, and a CSV file.' });
      return;
    }

    startUploading(async () => {
      try {
        const parseResult = await new Promise<any>((resolve, reject) => {
          Papa.parse(csvFile, { header: true, skipEmptyLines: true, complete: resolve, error: reject });
        });

        const requiredColumns = ['full_name', 'gmail_user', 'password'];
        const fileColumns = parseResult.meta.fields || [];
        if (!requiredColumns.every(col => fileColumns.includes(col))) {
            throw new Error(`CSV must contain columns: ${requiredColumns.join(', ')}`);
        }

        const tasksData = parseResult.data;
        if (tasksData.length === 0) throw new Error("CSV file is empty or has no valid data.");

        const { data: batch, error: batchError } = await supabase
          .from('gmail_task_batches')
          .insert({ 
              batch_name: batchName, 
              total_tasks: tasksData.length, 
              status: 'paused',
              task_category: taskCategory,
              reward_price: price,
              file_path: null // No longer storing the file
          })
          .select()
          .single();
        if (batchError) throw batchError;

        const tasksToInsert = tasksData.map((row: any) => ({
          batch_id: batch.id,
          full_name: row.full_name,
          gmail_user: row.gmail_user,
          password: row.password,
          recovery_mail: row.recovery_mail || null,
        }));

        const { error: tasksError } = await supabase.from('gmail_tasks').insert(tasksToInsert);
        if (tasksError) {
          // If inserting tasks fails, roll back the batch creation
          await supabase.from('gmail_task_batches').delete().eq('id', batch.id);
          throw new Error(`Failed to insert tasks: ${tasksError.message}`);
        }

        toast({ title: 'Success', description: `Batch "${batchName}" created with ${tasksData.length} tasks.` });
        setBatchName('');
        setRewardPrice('');
        setCsvFile(null);
        await fetchBatches();

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
      }
    });
  };
  
   const handleDownloadSample = () => {
    const csvContent = "full_name,gmail_user,password,recovery_mail\nJohn Doe,johndoe123,strongpassword,recovery@example.com\nJane Smith,janesmith456,anotherpassword,";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "gmail_batch_sample.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleStatusToggle = async (batch: Batch) => {
    const newStatus = batch.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('gmail_task_batches')
      .update({ status: newStatus })
      .eq('id', batch.id);
    
    if (error) {
       toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } else {
       toast({ title: 'Success', description: `Batch "${batch.batch_name}" is now ${newStatus}.` });
       await fetchBatches();
    }
  }

  const handleDeleteBatch = async (batch: Batch) => {
      // Deleting the batch will also delete associated tasks due to ON DELETE CASCADE
      const { error: deleteError } = await supabase
        .from('gmail_task_batches')
        .delete()
        .eq('id', batch.id);

      if (deleteError) {
          toast({ variant: 'destructive', title: 'Delete Failed', description: deleteError.message });
          return;
      }
      
      toast({ title: 'Batch Deleted', description: `Batch "${batch.batch_name}" and its tasks have been removed.` });
      await fetchBatches();
  }
  
  const handleEditBatch = (batch: Batch) => {
    setEditingBatch({ ...batch });
  }

  const handleUpdateBatch = async () => {
    if (!editingBatch) return;
    const price = parseFloat(String(editingBatch.reward_price));
     if (!editingBatch.batch_name.trim() || isNaN(price) || price < 0) {
      toast({ variant: 'destructive', title: 'Invalid Data', description: 'Batch name and a valid reward price are required.' });
      return;
    }
    
    const { error } = await supabase
      .from('gmail_task_batches')
      .update({ batch_name: editingBatch.batch_name, reward_price: price })
      .eq('id', editingBatch.id);
      
    if (error) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } else {
        toast({ title: 'Success', description: 'Batch has been updated.' });
        setEditingBatch(null);
        await fetchBatches();
    }
  }

  const handleDownloadByStatus = async (batchId: number, status: 'todo' | 'Pending' | 'Approved' | 'Rejected') => {
      try {
        const { data, error } = await supabase.rpc('get_tasks_by_batch_and_status', { p_batch_id: batchId, p_status: status });
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
            toast({ variant: 'default', title: 'No Data', description: `No tasks found with status "${status}" for this batch.` });
            return;
        }

        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `batch_${batchId}_${status}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'Download Started', description: `Downloading ${status} tasks for batch ${batchId}.`});

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Download Failed', description: error.message });
      }
  }

  const handleComingSoon = () => {
    toast({ title: 'Coming Soon', description: 'This feature is under development.' });
  }

  return (
    <>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gmail Task Manager</h1>
        <p className="text-muted-foreground">Upload and manage batches of Gmail tasks.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Task Batch</CardTitle>
          <CardDescription>Upload a CSV with columns: full_name, gmail_user, password, recovery_mail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="batch-name">Batch Name</Label>
              <Input id="batch-name" placeholder="e.g., June Week 1" value={batchName} onChange={e => setBatchName(e.target.value)} disabled={isUploading}/>
            </div>
             <div className="space-y-1.5">
              <Label htmlFor="task-category">Task Category</Label>
              <Select value={taskCategory} onValueChange={setTaskCategory} disabled={isUploading}>
                <SelectTrigger id="task-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail</SelectItem>
                  {/* Add other categories later if needed */}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="reward-price">Reward Price (INR)</Label>
              <Input id="reward-price" type="number" placeholder="e.g., 5" value={rewardPrice} onChange={e => setRewardPrice(e.target.value)} disabled={isUploading}/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input id="csv-file" type="file" accept=".csv" onChange={e => setCsvFile(e.target.files ? e.target.files[0] : null)} disabled={isUploading}/>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleFileUpload} disabled={isUploading || !batchName || !csvFile || !rewardPrice}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload Batch
            </Button>
            <Button variant="secondary" onClick={handleDownloadSample}>
                <FileDown className="mr-2 h-4 w-4" />
                Download Sample CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
         <h2 className="text-2xl font-bold">Uploaded Batches</h2>
         {isLoading ? (
             <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div>
         ) : batches.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">No batches have been uploaded yet.</p>
         ) : (
             <div className="grid grid-cols-1 gap-4">
                 {batches.map(batch => {
                    const stats = batch.stats || { approved: 0, pending: 0, rejected: 0 };
                    const totalProcessed = stats.approved + stats.pending + stats.rejected;
                    const approvedPercent = batch.total_tasks > 0 ? (stats.approved / batch.total_tasks) * 100 : 0;
                    const pendingPercent = batch.total_tasks > 0 ? (stats.pending / batch.total_tasks) * 100 : 0;
                    const rejectedPercent = batch.total_tasks > 0 ? (stats.rejected / batch.total_tasks) * 100 : 0;
                    const todoCount = batch.total_tasks - totalProcessed;

                    return (
                        <Card key={batch.id} className="w-full">
                            <CardHeader className="p-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <CardTitle className="truncate">{batch.batch_name}</CardTitle>
                                        <CardDescription>
                                            Uploaded {formatDistanceToNow(new Date(batch.created_at), { addSuffix: true })}
                                        </CardDescription>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        <Badge variant={batch.status === 'active' ? 'default' : 'secondary'} className={cn(batch.status === 'active' && 'bg-green-600')}>{batch.status}</Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                 <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => handleStatusToggle(batch)}>
                                                    {batch.status === 'active' ? <Pause className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}
                                                    {batch.status === 'active' ? 'Pause' : 'Resume'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleEditBatch(batch)}>
                                                    <Edit className="mr-2 h-4 w-4"/> Edit Batch
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4"/> Delete Batch
                                                        </div>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will delete the batch "{batch.batch_name}" and all associated tasks. This action cannot be undone.</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteBatch(batch)}>Confirm Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-4">
                                <div className="space-y-2">
                                     <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="flex h-full">
                                            <div className="bg-green-500" style={{ width: `${approvedPercent}%` }}></div>
                                            <div className="bg-yellow-500" style={{ width: `${pendingPercent}%` }}></div>
                                            <div className="bg-red-500" style={{ width: `${rejectedPercent}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 text-xs text-center">
                                        <div className="text-green-600 font-semibold">{stats.approved} Approved</div>
                                        <div className="text-yellow-600 font-semibold">{stats.pending} Pending</div>
                                        <div className="text-red-600 font-semibold">{stats.rejected} Rejected</div>
                                        <div className="text-gray-500 font-semibold">{todoCount} To-Do</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadByStatus(batch.id, 'todo')}>To-Do CSV ({todoCount})</Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadByStatus(batch.id, 'Pending')}>Pending CSV ({stats.pending})</Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadByStatus(batch.id, 'Approved')}>Approved CSV ({stats.approved})</Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDownloadByStatus(batch.id, 'Rejected')}>Rejected CSV ({stats.rejected})</Button>
                                </div>
                                <div className="flex gap-2">
                                     <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700" onClick={handleComingSoon}><CheckCircle className="h-4 w-4"/> Bulk Approve</Button>
                                     <Button variant="outline" size="sm" className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700" onClick={handleComingSoon}><XCircle className="h-4 w-4"/> Bulk Reject</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                 })}
             </div>
         )}
      </div>
    </div>
    
    {editingBatch && (
       <AlertDialog open={!!editingBatch} onOpenChange={(open) => !open && setEditingBatch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Update the details for the batch "{editingBatch.batch_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
              <div className="space-y-2">
                  <Label htmlFor="edit-batch-name">Batch Name</Label>
                  <Input 
                      id="edit-batch-name" 
                      value={editingBatch.batch_name}
                      onChange={(e) => setEditingBatch(prev => prev ? { ...prev, batch_name: e.target.value } : null)}
                  />
              </div>
               <div className="space-y-2">
                  <Label htmlFor="edit-reward-price">Reward Price (INR)</Label>
                  <Input 
                      id="edit-reward-price" 
                      type="number"
                      value={editingBatch.reward_price}
                      onChange={(e) => setEditingBatch(prev => prev ? { ...prev, reward_price: parseFloat(e.target.value) || 0 } : null)}
                  />
              </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateBatch}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )}
    </>
  );
}
