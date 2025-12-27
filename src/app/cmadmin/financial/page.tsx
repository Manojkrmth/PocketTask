'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, IndianRupee, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCurrency } from '@/context/currency-context';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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

export default function FinancialPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_all_payment_requests');

        if (error) {
          console.error("Error fetching payment requests:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
          const description = 'Could not fetch requests. Please run the "Fix: Withdrawal Requests" script from the SQL Editor page.';
          toast({ variant: 'destructive', title: 'Error Fetching Data', description: description, duration: 10000 });
        } else {
          setRequests(data as any[] as PaymentRequest[]);
        }
        setLoading(false);
      };

    fetchRequests();
  }, [toast]);
  
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
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
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No requests found in this category.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="space-y-6">
    <div className="flex justify-between items-center">
        <div>
        <h1 className="text-3xl font-bold">Financial - Withdrawal Requests</h1>
        <p className="text-muted-foreground">
            Review all user withdrawal requests.
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
  );
}
