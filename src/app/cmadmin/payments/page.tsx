
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrency } from '@/context/currency-context';

type PaymentStatus = 'Pending' | 'Approved' | 'Rejected';

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
  } | null;
}

export default function PaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
          const { data, error } = await supabase.rpc('get_all_payment_requests');

          if (error) throw error;
          setRequests(data as PaymentRequest[]);
      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Error",
              description: "Could not fetch payment requests. Please run the 'Fix: Withdrawal Requests' script from the SQL Editor page.",
          });
      } finally {
          setLoading(false);
      }
    };
    fetchRequests();
  }, [toast]);

  const filteredRequests = (status: PaymentStatus) => {
    return requests.filter(req => req.status === status);
  };
  
  const PaymentTable = ({ status }: { status: PaymentStatus }) => {
    const data = filteredRequests(status);

    return (
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Details</TableHead>
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
              data.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-medium">{req.users?.full_name || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{req.users?.email}</div>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(req.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{req.payment_method}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-xs truncate">{req.payment_details}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No {status.toLowerCase()} requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Requests</h1>
        <p className="text-muted-foreground">
          View all user withdrawal requests.
        </p>
      </div>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending"><Clock className="mr-2 h-4 w-4"/> Pending</TabsTrigger>
          <TabsTrigger value="approved"><CheckCircle className="mr-2 h-4 w-4"/> Approved</TabsTrigger>
          <TabsTrigger value="rejected"><XCircle className="mr-2 h-4 w-4"/> Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
            <PaymentTable status="Pending" />
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
            <PaymentTable status="Approved" />
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
            <PaymentTable status="Rejected" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
