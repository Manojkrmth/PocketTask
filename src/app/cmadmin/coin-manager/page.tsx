
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Loader2, ListFilter, CheckCircle, XCircle, Coins, IndianRupee, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/context/currency-context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdmin } from '../layout';

type SubmissionStatus = 'Pending' | 'Approved' | 'Rejected';

interface CoinSubmission {
  id: string;
  created_at: string;
  coin_type: string;
  coin_amount: number;
  reward_inr: number;
  status: SubmissionStatus;
  user_id: string;
  insta_id: string;
  order_id: string;
  metadata: any;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const ROWS_PER_PAGE_OPTIONS = [20, 30, 40, 50];

export default function CoinManagerPage() {
  const { isViewOnly } = useAdmin();
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get('userId');

  const [submissions, setSubmissions] = useState<CoinSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(preselectedUserId || '');
  const [statusFilters, setStatusFilters] = useState<SubmissionStatus[]>(['Pending']);
  const [isUpdating, startUpdateTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<CoinSubmission | null>(null);
  const [newStatus, setNewStatus] = useState<SubmissionStatus | null>(null);
  const [actionReason, setActionReason] = useState('');
  
  const [editableCoinAmount, setEditableCoinAmount] = useState(0);
  const [editableRate, setEditableRate] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);

  const { formatCurrency } = useCurrency();
  const { toast } = useToast();

  const fetchSubmissions = async () => {
      setLoading(true);
      
      // Fetch submissions first
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('coinsubmissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error("Error fetching coin submissions:", submissionsError);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch coin submissions. Ensure you have admin privileges.' });
        setSubmissions([]);
        setLoading(false);
        return;
      }
      
      // Get unique user IDs from submissions
      const userIds = [...new Set(submissionsData.map(s => s.user_id))];
      
      // Fetch corresponding users
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', userIds);

        if (usersError) {
            console.error("Error fetching users for submissions:", usersError);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user details for submissions.' });
             // Still show submissions, but without user details
            const dataWithNullUsers = submissionsData.map(s => ({ ...s, users: null }));
            setSubmissions(dataWithNullUsers as CoinSubmission[]);
        } else {
            const usersMap = new Map(usersData.map(u => [u.id, u]));
            const combinedData = submissionsData.map(s => ({
                ...s,
                users: usersMap.get(s.user_id) || null
            }));
            setSubmissions(combinedData as CoinSubmission[]);
        }
      } else {
        setSubmissions([]);
      }

      setLoading(false);
    };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, statusFilters, rowsPerPage]);
  
  const calculatedReward = useMemo(() => {
    if (editableCoinAmount <= 0 || editableRate <= 0) return 0;
    return (editableCoinAmount / 1000) * editableRate;
  }, [editableCoinAmount, editableRate]);
  
  const updateSubmissionStatus = async (submission: CoinSubmission, status: SubmissionStatus, reason?: string) => {
    const existingMetadata = submission.metadata || {};
    const finalReward = calculatedReward;
    
    const updatePayload: { status: SubmissionStatus; metadata?: any, coin_amount?: number, reward_inr?: number } = { status };
    
    let newMetadata = {...existingMetadata};
    if (status === 'Rejected' && reason) {
        newMetadata.rejection_reason = reason;
    }
    if (status === 'Approved' && reason) {
        newMetadata.approval_note = reason;
    }
    
    if (status === 'Approved') {
        updatePayload.coin_amount = editableCoinAmount;
        updatePayload.reward_inr = finalReward;
    }

    updatePayload.metadata = newMetadata;


    const { error: updateError } = await supabase
        .from('coinsubmissions')
        .update(updatePayload)
        .eq('id', submission.id);

    if (updateError) throw updateError;
    
    if (status === 'Approved' && finalReward > 0) {
        const { error: walletError } = await supabase
            .from('wallet_history')
            .insert({
                user_id: submission.user_id,
                amount: finalReward,
                type: 'coin_credit',
                status: 'Completed',
                description: `Reward for ${editableCoinAmount} ${submission.coin_type.replace('-', ' ')} coins`
            });
        
        if (walletError) throw walletError;
    }
  }


  const handleSingleUpdate = (submission: CoinSubmission, status: SubmissionStatus) => {
    startUpdateTransition(async () => {
        try {
            await updateSubmissionStatus(submission, status, actionReason);
            toast({
                title: 'Success',
                description: `Submission has been ${status.toLowerCase()}.`,
            });
            await fetchSubmissions();
        } catch (error: any) {
            console.error('Error updating submission status:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error.message,
            });
        }
    });
  };

  const openConfirmationDialog = (submission: CoinSubmission, status: SubmissionStatus) => {
    setSelectedSubmission(submission);
    setNewStatus(status);
    setEditableCoinAmount(submission.coin_amount);
    
    // Calculate rate from original submission
    const rate = submission.coin_amount > 0 ? (submission.reward_inr / submission.coin_amount) * 1000 : 0;
    setEditableRate(rate);

    setDialogOpen(true);
    setActionReason(''); // Reset reason
  };
  
  const confirmAction = () => {
    if (selectedSubmission && newStatus) {
        if (newStatus === 'Rejected' && !actionReason.trim()) {
            toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for rejection.' });
            return;
        }
      handleSingleUpdate(selectedSubmission, newStatus);
    }
    setDialogOpen(false);
    setSelectedSubmission(null);
    setNewStatus(null);
    setActionReason('');
    setEditableCoinAmount(0);
    setEditableRate(0);
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(item => {
        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(item.status);
        const matchesSearch = !filter ||
            (item.users?.full_name?.toLowerCase().includes(filter.toLowerCase())) ||
            (item.users?.email?.toLowerCase().includes(filter.toLowerCase())) ||
            (item.coin_type?.toLowerCase().includes(filter.toLowerCase())) ||
            (item.order_id?.toLowerCase().includes(filter.toLowerCase())) ||
            (item.insta_id?.toLowerCase().includes(filter.toLowerCase())) ||
            (item.user_id.toLowerCase().includes(filter.toLowerCase()));
            
        return matchesStatus && matchesSearch;
    });
  }, [submissions, filter, statusFilters]);
  
  const totalPages = Math.ceil(filteredSubmissions.length / rowsPerPage);

  const paginatedSubmissions = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredSubmissions.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredSubmissions, currentPage, rowsPerPage]);

  const toggleFilter = (status: SubmissionStatus) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Coin Manager</h1>
            <p className="text-muted-foreground">
              Review and manage all user coin submissions.
            </p>
          </div>
          <div className="flex gap-2">
              <Input
              placeholder="Filter submissions..."
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
                <TableHead>Submission Details</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount & Reward</TableHead>
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
              ) : paginatedSubmissions.length > 0 ? (
                paginatedSubmissions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium capitalize flex items-center gap-2">
                        <Coins className="h-4 w-4"/>
                        {item.coin_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                          Order ID: {item.order_id} | Insta: {item.insta_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.users?.full_name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{item.users?.email}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-semibold text-green-600">{formatCurrency(item.reward_inr || 0)}</div>
                        <div className="text-xs text-muted-foreground">{item.coin_amount} coins</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                            item.status === "Approved" && "bg-green-100 text-green-800 border-green-200",
                            item.status === "Pending" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                            item.status === "Rejected" && "bg-red-100 text-red-800 border-red-200"
                          )}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating || item.status !== 'Pending' || isViewOnly}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            disabled={item.status !== 'Pending' || isUpdating || isViewOnly} 
                            onSelect={() => openConfirmationDialog(item, 'Approved')}
                            className="cursor-pointer"
                          >
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            disabled={item.status !== 'Pending' || isUpdating || isViewOnly} 
                            onSelect={() => openConfirmationDialog(item, 'Rejected')}
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
                    No submissions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
         <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
                Showing <strong>{paginatedSubmissions.length}</strong> of <strong>{filteredSubmissions.length}</strong> submissions.
            </div>
             <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        value={`${rowsPerPage}`}
                        onValueChange={(value) => setRowsPerPage(Number(value))}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={rowsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {ROWS_PER_PAGE_OPTIONS.map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage >= totalPages}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
             </div>
        </div>
      </div>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to <span className={cn("font-bold", newStatus === 'Approved' ? "text-green-600" : "text-red-600")}>{newStatus?.toLowerCase()}</span> this submission. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
            {newStatus === 'Rejected' && (
                <div className="space-y-2 pt-2">
                    <Label htmlFor="action-reason" className="font-semibold">
                        Reason for Rejection
                    </Label>
                    <Textarea 
                        id="action-reason"
                        placeholder={'Provide a clear reason for rejecting...'}
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                    />
                </div>
            )}
            {newStatus === 'Approved' && (
                <div className="space-y-4 pt-2">
                     <div className="space-y-2">
                        <Label htmlFor="coin-amount" className="font-semibold">Coin Amount</Label>
                        <Input
                            id="coin-amount"
                            type="number"
                            value={editableCoinAmount}
                            onChange={(e) => setEditableCoinAmount(parseInt(e.target.value) || 0)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="reward-rate" className="font-semibold">Rate per 1000 Coins (INR)</Label>
                        <Input
                            id="reward-rate"
                            type="number"
                            value={editableRate}
                            onChange={(e) => setEditableRate(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    {calculatedReward > 0 && (
                        <Alert variant="default" className="bg-green-50 border-green-200">
                            <IndianRupee className="h-4 w-4 text-green-700" />
                            <AlertTitle className="text-green-800">Estimated Earning</AlertTitle>
                            <AlertDescription className="font-bold text-green-700">
                                {formatCurrency(calculatedReward)}
                            </AlertDescription>
                        </Alert>
                    )}
                     <div className="space-y-2">
                        <Label htmlFor="approval-note" className="font-semibold">Approval Note (Optional)</Label>
                         <Textarea 
                            id="approval-note"
                            placeholder={'Optional approval note...'}
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                        />
                    </div>
                </div>
            )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmAction}
                disabled={(newStatus === 'Rejected' && !actionReason.trim()) || (newStatus === 'Approved' && (editableCoinAmount <= 0 || editableRate < 0))}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
