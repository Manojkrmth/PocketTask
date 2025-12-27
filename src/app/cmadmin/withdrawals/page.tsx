
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
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
import { MoreHorizontal, Loader2, CheckCircle, XCircle, ListFilter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/currency-context';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type PaymentStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

interface PaymentRequest {
  id: number;
  created_at: string;
  amount: number;
  payment_method: string;
  payment_details: string;
  status: PaymentStatus;
  user_id: string;
  metadata: any;
  users: {
    full_name: string | null;
    email: string | null;
    mobile: string | null;
  } | null;
}

interface WithdrawalSettings {
    chargesPercent: number;
    minAmount: number;
    methods: any[];
}

export default function WithdrawalsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilters, setStatusFilters] = useState<PaymentStatus[]>(['Pending']);
  const [filter, setFilter] = useState('');
  
  const [withdrawalSettings, setWithdrawalSettings] = useState<WithdrawalSettings | null>(null);

  const [isUpdating, startUpdateTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [newStatus, setNewStatus] = useState<PaymentStatus | null>(null);
  const [actionReason, setActionReason] = useState('');
  
  const { toast } = useToast();
  const { formatCurrency, usdToInrRate } = useCurrency();
  
  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [requestsRes, settingsRes] = await Promise.all([
                supabase.rpc('get_all_payment_requests'),
                supabase.from('settings').select('withdrawal_settings').eq('id', 1).single()
            ]);

            if (requestsRes.error) throw requestsRes.error;
            setRequests(requestsRes.data as PaymentRequest[]);

            if (settingsRes.error) {
                console.error("Could not fetch withdrawal settings:", settingsRes.error);
                setWithdrawalSettings({ chargesPercent: 5, minAmount: 500, methods: [] }); // Fallback
            } else {
                setWithdrawalSettings(settingsRes.data.withdrawal_settings);
            }
        } catch (error: any) {
            console.error("Error fetching initial data:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not fetch page data. Please run the script from the SQL Editor page.",
            });
        } finally {
            setLoading(false);
        }
    };
    fetchInitialData();
  }, [toast]);
  
  const handleUpdateStatus = (request: PaymentRequest, status: PaymentStatus) => {
    startUpdateTransition(async () => {
      try {
        const metadataUpdate = {
            ...(request.metadata || {}),
            reason: actionReason || undefined,
            utr: status === 'Approved' ? actionReason : undefined,
        };
        
        const { error } = await supabase
            .from('payments')
            .update({ status: status, metadata: metadataUpdate })
            .eq('id', request.id);

        if (error) throw error;
        
        if (status === 'Rejected' || status === 'Cancelled') {
            const { error: refundError } = await supabase
                .from('wallet_history')
                .insert({
                    user_id: request.user_id,
                    amount: request.amount, // Positive amount to refund
                    type: 'withdrawal_refund',
                    status: 'Completed',
                    description: `Refund for ${status.toLowerCase()} withdrawal request #${request.id}`,
                    metadata: { payment_id: request.id, reason: actionReason }
                });
            if (refundError) throw new Error(`Could not refund user: ${refundError.message}`);
        }

        toast({
          title: "Success",
          description: `Request #${request.id} has been ${status.toLowerCase()}.`,
        });
        
        // Refetch requests after update
        const { data, error: refetchError } = await supabase.rpc('get_all_payment_requests');
        if (refetchError) throw refetchError;
        setRequests(data as PaymentRequest[]);

      } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message,
          });
      }
    });
  };

  const openConfirmationDialog = (request: PaymentRequest, status: PaymentStatus) => {
    setSelectedRequest(request);
    setNewStatus(status);
    setActionReason(''); // Reset reason input
    setDialogOpen(true);
  };
  
  const confirmAction = () => {
    if (selectedRequest && newStatus) {
        if ((newStatus === 'Rejected' || newStatus === 'Cancelled') && !actionReason.trim()) {
            toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for this action.' });
            return;
        }
      handleUpdateStatus(selectedRequest, newStatus);
    }
    setDialogOpen(false);
    setSelectedRequest(null);
    setNewStatus(null);
  };
  
  const toggleFilter = (status: PaymentStatus) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(request.status);
        const matchesSearch = !filter ||
            (request.users?.full_name?.toLowerCase().includes(filter.toLowerCase())) ||
            (request.users?.email?.toLowerCase().includes(filter.toLowerCase())) ||
            (request.payment_method?.toLowerCase().includes(filter.toLowerCase())) ||
            (request.payment_details?.toLowerCase().includes(filter.toLowerCase()));

        return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilters, filter]);


  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">Payments Request</h1>
                <p className="text-muted-foreground">
                Review and process all user payment requests.
                </p>
            </div>
             <div className="flex gap-2">
                <Input
                    placeholder="Filter by user, email, method, details..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-1">
                        <ListFilter className="h-3.5 w-3.5" />
                        <span>Filter by Status</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={statusFilters.includes('Pending')} onCheckedChange={() => toggleFilter('Pending')}>Pending</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusFilters.includes('Approved')} onCheckedChange={() => toggleFilter('Approved')}>Approved</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusFilters.includes('Rejected')} onCheckedChange={() => toggleFilter('Rejected')}>Rejected</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusFilters.includes('Cancelled')} onCheckedChange={() => toggleFilter('Cancelled')}>Cancelled</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        
        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method & Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
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
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((request) => {
                  const charges = request.amount * ((withdrawalSettings?.chargesPercent || 0) / 100);
                  const finalAmount = request.amount - charges;
                  const isUsdt = request.payment_method.toLowerCase().includes('usdt');
                  const finalUsdtAmount = isUsdt ? (finalAmount / usdToInrRate).toFixed(4) : null;

                  return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.users?.full_name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{request.users?.email}</div>
                      <div className="text-xs text-muted-foreground">{request.users?.mobile || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-semibold">{formatCurrency(request.amount)}</div>
                         <div className="text-xs text-muted-foreground">
                            Net: {isUsdt ? `$${finalUsdtAmount}` : formatCurrency(finalAmount)}
                         </div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{request.payment_method}</div>
                        <div className="text-xs text-muted-foreground break-all">{request.payment_details}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        request.status === "Approved" && "bg-green-100 text-green-800 border-green-200",
                        request.status === "Pending" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                        request.status === "Rejected" && "bg-red-100 text-red-800 border-red-200",
                        request.status === "Cancelled" && "bg-gray-100 text-gray-800 border-gray-200",
                      )}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                       {request.status === 'Pending' ? (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openConfirmationDialog(request, 'Approved')} disabled={isUpdating}>
                                <CheckCircle className="mr-2 h-4 w-4"/> Approve
                            </Button>
                             <Button size="sm" variant="destructive" onClick={() => openConfirmationDialog(request, 'Rejected')} disabled={isUpdating}>
                               <XCircle className="mr-2 h-4 w-4"/> Reject
                            </Button>
                          </div>
                       ) : (
                           <span className="text-xs text-muted-foreground">No actions</span>
                       )}
                    </TableCell>
                  </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No requests found for the selected filters.
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
              You are about to <span className={cn("font-bold", newStatus === 'Approved' ? "text-green-600" : "text-red-600")}>{newStatus?.toLowerCase()}</span> this request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(newStatus === 'Rejected' || newStatus === 'Cancelled') && (
            <div className="space-y-2 pt-2">
                <Label htmlFor="action-reason" className="font-semibold">Reason for Action</Label>
                <Textarea 
                    id="action-reason"
                    placeholder={`Provide a clear reason for ${newStatus.toLowerCase()}ing this request...`}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                />
            </div>
          )}
           {newStatus === 'Approved' && (
            <div className="space-y-2 pt-2">
                <Label htmlFor="action-reason" className="font-semibold">UTR/Transaction ID (Optional)</Label>
                <Textarea 
                    id="action-reason"
                    placeholder="Enter the transaction ID for user reference..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmAction}
                disabled={isUpdating || ((newStatus === 'Rejected' || newStatus === 'Cancelled') && !actionReason.trim())}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
