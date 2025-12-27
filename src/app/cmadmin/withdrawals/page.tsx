

'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
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
import { MoreHorizontal, Loader2, CheckCircle, XCircle, FileText, IndianRupee, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCurrency } from '@/context/currency-context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type PaymentStatus = 'Pending' | 'Approved' | 'Rejected';

interface PaymentRequest {
  id: number;
  created_at: string;
  amount: number;
  payment_method: string;
  payment_details: string;
  status: PaymentStatus;
  user_id: string;
  metadata: {
    utr?: string;
    reason?: string;
  } | null,
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function WithdrawalsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, startUpdateTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [newStatus, setNewStatus] = useState<PaymentStatus | null>(null);
  const [actionDetail, setActionDetail] = useState(''); // For UTR or Reason
  
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_payment_requests');

    if (error) {
      console.error("Error fetching payment requests:", error);
      const description = 'Could not fetch requests. Please run the "Fix: Withdrawal Requests" script from the SQL Editor page.';
      toast({ variant: 'destructive', title: 'Error Fetching Data', description: description, duration: 10000 });
    } else {
      setRequests(data as any[] as PaymentRequest[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);
  
  const handleUpdateRequest = async () => {
    if (!selectedRequest || !newStatus) return;

    if ((newStatus === 'Approved' && !actionDetail.trim()) || (newStatus === 'Rejected' && !actionDetail.trim())) {
        toast({ variant: 'destructive', title: 'Detail Required', description: newStatus === 'Approved' ? 'Please provide a UTR.' : 'Please provide a rejection reason.' });
        return;
    }
    
    startUpdateTransition(async () => {
        try {
            const metadata = newStatus === 'Approved' ? { utr: actionDetail } : { reason: actionDetail };
            
            const { error: updateError } = await supabase
                .from('payments')
                .update({ status: newStatus, metadata })
                .eq('id', selectedRequest.id);
            
            if (updateError) throw updateError;
            
            if (newStatus === 'Rejected') {
                const { data: pendingTransaction, error: findError } = await supabase
                    .from('wallet_history')
                    .select('id, amount')
                    .eq('user_id', selectedRequest.user_id)
                    .eq('type', 'withdrawal_pending')
                    .eq('metadata->>payment_id', String(selectedRequest.id))
                    .single();

                if (findError && findError.code !== 'PGRST116') throw findError;

                if (pendingTransaction) {
                    const { error: walletError } = await supabase
                        .from('wallet_history')
                        .insert({
                            user_id: selectedRequest.user_id,
                            amount: Math.abs(pendingTransaction.amount),
                            type: 'withdrawal_refund',
                            status: 'Completed',
                            description: `Refund for rejected withdrawal #${selectedRequest.id}. Reason: ${actionDetail}`
                        });
                    if (walletError) throw walletError;

                    await supabase
                      .from('wallet_history')
                      .update({ status: 'Cancelled', description: `Request rejected by admin. Reason: ${actionDetail}` })
                      .eq('id', pendingTransaction.id);
                }
            } else if (newStatus === 'Approved') {
                const { error: walletError } = await supabase
                    .from('wallet_history')
                    .update({ 
                        status: 'Completed', 
                        description: `Withdrawal to ${selectedRequest.payment_method}. UTR: ${actionDetail}`,
                    })
                    .eq('metadata->>payment_id', String(selectedRequest.id));

                if (walletError) throw walletError;
            }

            toast({ title: 'Success', description: `Request #${selectedRequest.id} has been ${newStatus.toLowerCase()}.`});
            await fetchRequests();
        } catch(error: any) {
            console.error('Error updating request:', error);
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } finally {
            setDialogOpen(false);
        }
    });
  };

  const openConfirmationDialog = (request: PaymentRequest, status: PaymentStatus) => {
    setSelectedRequest(request);
    setNewStatus(status);
    setActionDetail('');
    setDialogOpen(true);
  };
  
  const getFilteredRequests = (status: PaymentStatus) => {
    return requests.filter(req => req.status === status);
  }

  const renderTable = (data: PaymentRequest[]) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Details</TableHead>
            <TableHead>Amount & Method</TableHead>
            <TableHead>Payment Details</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested</TableHead>
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
          ) : data.length > 0 ? (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.users?.full_name || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">{item.users?.email}</div>
                   <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Hash className="h-3 w-3"/>Req #{item.id}</div>
                </TableCell>
                <TableCell>
                    <div className="font-semibold text-green-600">{formatCurrency(item.amount || 0)}</div>
                    <div className="text-xs text-muted-foreground capitalize">{item.payment_method}</div>
                </TableCell>
                <TableCell className="text-xs font-mono">{item.payment_details}</TableCell>
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
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating || item.status !== 'Pending'}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem 
                        disabled={item.status !== 'Pending' || isUpdating} 
                        onSelect={() => openConfirmationDialog(item, 'Approved')}
                        className="cursor-pointer"
                      >
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        disabled={item.status !== 'Pending' || isUpdating} 
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
                No requests found in this category.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
            <p className="text-muted-foreground">
              Manage all user withdrawal requests.
            </p>
          </div>
        </div>
        
         <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending ({getFilteredRequests('Pending').length})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({getFilteredRequests('Approved').length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({getFilteredRequests('Rejected').length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
                {renderTable(getFilteredRequests('Pending'))}
            </TabsContent>
            <TabsContent value="approved" className="mt-4">
                {renderTable(getFilteredRequests('Approved'))}
            </TabsContent>
            <TabsContent value="rejected" className="mt-4">
                {renderTable(getFilteredRequests('Rejected'))}
            </TabsContent>
        </Tabs>

      </div>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to <span className={cn("font-bold", newStatus === 'Approved' ? "text-green-600" : "text-red-600")}>{newStatus?.toLowerCase()}</span> this request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 pt-2">
            <Label htmlFor="action-detail" className="font-semibold">
              {newStatus === 'Approved' ? 'Transaction ID (UTR)' : 'Reason for Rejection'}
            </Label>
            {newStatus === 'Approved' ? (
                <Input 
                    id="action-detail"
                    placeholder="Enter the UTR or Transaction ID"
                    value={actionDetail}
                    onChange={(e) => setActionDetail(e.target.value)}
                />
            ) : (
                <Textarea 
                    id="action-detail"
                    placeholder="Provide a clear reason for rejecting..."
                    value={actionDetail}
                    onChange={(e) => setActionDetail(e.target.value)}
                />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleUpdateRequest}
                disabled={isUpdating || !actionDetail.trim()}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
    

    