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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ListFilter,
  MoreHorizontal,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

type Status = 'Pending' | 'Completed' | 'Rejected';

type WithdrawalRequest = {
  id: number;
  user_id: string;
  amount: number;
  status: Status;
  payment_method: string;
  payment_details: string;
  created_at: string;
  metadata: { utr?: string; reason?: string };
  users: { full_name: string } | null;
};

export default function ManageWithdrawalsPage() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status[]>(['Pending']);
  const [editingUtr, setEditingUtr] = useState<{ [key: number]: string }>({});
  const { toast } = useToast();

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*, users (full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch withdrawal requests.',
      });
    } else {
      setRequests(data as WithdrawalRequest[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (
    requestId: number,
    newStatus: 'Completed' | 'Rejected',
    utr?: string,
    reason?: string
  ) => {
    if (newStatus === 'Completed' && !utr) {
      toast({
        variant: 'destructive',
        title: 'UTR Required',
        description: 'Please enter the UTR/transaction ID to approve.',
      });
      return;
    }
    if (newStatus === 'Rejected' && !reason) {
        // In a real app, you'd have a dialog to input reason.
        // For now, we'll proceed but it's not ideal.
    }
    
    // If rejecting, credit the amount back to the user's wallet.
    if (newStatus === 'Rejected') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
            const { error: walletError } = await supabase.rpc('credit_user_wallet', {
                p_user_id: request.user_id,
                p_amount: request.amount,
                p_description: `Withdrawal rejected, amount refunded.`
            });
            if (walletError) {
                toast({ variant: 'destructive', title: 'Refund Failed', description: walletError.message });
                return;
            }
        }
    }


    const { error } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        metadata: { utr, reason: reason || 'Payment Rejected by admin' },
      })
      .eq('id', requestId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } else {
      toast({
        title: 'Success',
        description: `Request status updated to ${newStatus}.`,
      });
      fetchRequests(); // Refresh data
    }
  };

  const filteredRequests = useMemo(() => {
    if (statusFilter.length === 0) return requests;
    return requests.filter((req) => statusFilter.includes(req.status));
  }, [requests, statusFilter]);

  const toggleFilter = (status: Status) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Withdrawal Requests</CardTitle>
            <CardDescription>
              Manage all pending and processed withdrawal requests.
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span>Filter</span>
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
                checked={statusFilter.includes('Completed')}
                onCheckedChange={() => toggleFilter('Completed')}
              >
                Completed
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
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Date & Status</TableHead>
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
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No requests found for the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-medium">
                      {req.users?.full_name || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {req.user_id.substring(0, 8)}...
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">
                    ₹{req.amount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium capitalize">
                      {req.payment_method}
                    </div>
                    <div className="text-muted-foreground break-all">
                      {req.payment_details}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{format(new Date(req.created_at), 'Pp')}</div>
                    <Badge
                      variant={
                        req.status === 'Completed'
                          ? 'default'
                          : req.status === 'Rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className={
                        req.status === 'Completed' ? 'bg-green-600' : ''
                      }
                    >
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === 'Pending' ? (
                      <div className="flex flex-col items-end gap-2">
                        <Input
                          placeholder="Enter UTR / Txn ID"
                          className="h-8 max-w-xs"
                          value={editingUtr[req.id] || ''}
                          onChange={(e) =>
                            setEditingUtr({ ...editingUtr, [req.id]: e.target.value })
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                            onClick={() =>
                              handleStatusChange(
                                req.id,
                                'Completed',
                                editingUtr[req.id]
                              )
                            }
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() =>
                              handleStatusChange(req.id, 'Rejected')
                            }
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : req.metadata?.utr ? (
                      <div className="text-xs text-muted-foreground">
                        UTR: {req.metadata.utr}
                      </div>
                    ): req.metadata?.reason ? (
                         <div className="text-xs text-destructive">
                            Reason: {req.metadata.reason}
                        </div>
                    ): null}
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
