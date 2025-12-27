
'use client';

import { useState, useEffect, useMemo } from 'react';
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ListFilter, Wallet, IndianRupee, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/currency-context';

type TransactionStatus = 'Completed' | 'Pending' | 'Rejected' | 'Cancelled';

interface WalletTransaction {
  id: number;
  created_at: string;
  amount: number;
  type: string;
  description: string;
  status: TransactionStatus;
  user_id: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function PaymentsPage() {
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilters, setStatusFilters] = useState<TransactionStatus[]>(['Pending', 'Completed', 'Rejected', 'Cancelled']);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
          const { data, error } = await supabase
            .from('wallet_history')
            .select('*, users:user_id(full_name, email)')
            .order('created_at', { ascending: false });

          if (error) throw error;
          setHistory(data as WalletTransaction[]);
      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Error",
              description: "Could not fetch wallet history. " + error.message,
          });
      } finally {
          setLoading(false);
      }
    };
    fetchHistory();
  }, [toast]);
  
  const toggleFilter = (status: TransactionStatus) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
        return statusFilters.length === 0 || statusFilters.includes(item.status);
    });
  }, [history, statusFilters]);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">Wallet History</h1>
                <p className="text-muted-foreground">
                View all transactions across all users.
                </p>
            </div>
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
                  <DropdownMenuCheckboxItem checked={statusFilters.includes('Completed')} onCheckedChange={() => toggleFilter('Completed')}>Completed</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={statusFilters.includes('Pending')} onCheckedChange={() => toggleFilter('Pending')}>Pending</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={statusFilters.includes('Rejected')} onCheckedChange={() => toggleFilter('Rejected')}>Rejected</DropdownMenuCheckboxItem>
                   <DropdownMenuCheckboxItem checked={statusFilters.includes('Cancelled')} onCheckedChange={() => toggleFilter('Cancelled')}>Cancelled</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
       </div>
      
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.users?.full_name || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{item.users?.email}</div>
                  </TableCell>
                  <TableCell className={cn(
                    "font-semibold",
                    item.amount > 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {item.amount > 0 ? '+' : '-'} {formatCurrency(Math.abs(item.amount))}
                  </TableCell>
                   <TableCell>
                    <div className="font-medium capitalize">{item.type.replace(/_/g, ' ')}</div>
                  </TableCell>
                   <TableCell>
                    <div className="text-sm max-w-xs truncate">{item.description}</div>
                  </TableCell>
                  <TableCell>
                     <Badge variant="outline" className={cn(
                        item.status === "Completed" && "bg-green-100 text-green-800 border-green-200",
                        item.status === "Pending" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                        item.status === "Rejected" && "bg-red-100 text-red-800 border-red-200",
                        item.status === "Cancelled" && "bg-gray-100 text-gray-800 border-gray-200",
                      )}>
                        {item.status}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No transactions found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
