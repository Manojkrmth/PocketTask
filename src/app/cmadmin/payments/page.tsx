
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
import { Loader2, ListFilter, Download, ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/context/currency-context';
import { Input } from '@/components/ui/input';
import Papa from 'papaparse';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TransactionStatus = 'Completed' | 'Pending' | 'Rejected' | 'Cancelled';

interface WalletTransaction {
  id: number;
  created_at: string;
  amount: number;
  type: string;
  description: string;
  status: TransactionStatus;
  user_id: string;
  metadata: any;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const ROWS_PER_PAGE_OPTIONS = [20, 30, 40, 50, 100];

export default function PaymentsPage() {
  const [history, setHistory] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilters, setStatusFilters] = useState<TransactionStatus[]>([]);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data: historyData, error: historyError } = await supabase
            .from('wallet_history')
            .select('*, users(full_name, email)')
            .order('created_at', { ascending: false });

        if (historyError) throw historyError;
        setHistory(historyData as WalletTransaction[]);

      } catch (error: any) {
          console.error("Error fetching wallet history:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
  
  useEffect(() => {
    setCurrentPage(1); // Reset to first page on any filter/search change
  }, [filter, statusFilters, rowsPerPage]);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(item.status);
        const matchesSearch = !filter ||
            (item.users?.full_name?.toLowerCase().includes(filter.toLowerCase())) ||
            (item.users?.email?.toLowerCase().includes(filter.toLowerCase())) ||
            (item.type.toLowerCase().includes(filter.toLowerCase())) ||
            (item.description.toLowerCase().includes(filter.toLowerCase()));
            
        return matchesStatus && matchesSearch;
    });
  }, [history, statusFilters, filter]);
  
  const totalPages = Math.ceil(filteredHistory.length / rowsPerPage);

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredHistory.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredHistory, currentPage, rowsPerPage]);

  const handleDownloadCSV = () => {
    if (filteredHistory.length === 0) {
      toast({ variant: 'destructive', title: 'No data to export' });
      return;
    }
    const csvData = filteredHistory.map(item => ({
      'User Name': item.users?.full_name,
      'User Email': item.users?.email,
      'Amount': item.amount,
      'Type': item.type,
      'Description': item.description,
      'Status': item.status,
      'Date': item.created_at,
      'UTR': item.metadata?.utr,
      'Reason': item.metadata?.reason,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'wallet_history.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">Wallet History</h1>
                <p className="text-muted-foreground">
                View all transactions across all users.
                </p>
            </div>
            <div className="flex gap-2">
                <Input 
                    placeholder="Search name, email, type, desc..."
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
                    <DropdownMenuCheckboxItem checked={statusFilters.includes('Completed')} onCheckedChange={() => toggleFilter('Completed')}>Completed</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusFilters.includes('Pending')} onCheckedChange={() => toggleFilter('Pending')}>Pending</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusFilters.includes('Rejected')} onCheckedChange={() => toggleFilter('Rejected')}>Rejected</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={statusFilters.includes('Cancelled')} onCheckedChange={() => toggleFilter('Cancelled')}>Cancelled</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                 <Button variant="outline" className="gap-1" onClick={handleDownloadCSV}>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download CSV</span>
                 </Button>
            </div>
       </div>
      
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type & Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : paginatedHistory.length > 0 ? (
              paginatedHistory.map((item) => (
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
                    <div className="text-sm text-muted-foreground max-w-xs truncate">{item.description}</div>
                    {item.metadata?.utr && <p className="text-xs text-blue-600 mt-1">UTR: {item.metadata.utr}</p>}
                    {item.metadata?.reason && <p className="text-xs text-destructive mt-1">Reason: {item.metadata.reason}</p>}
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
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No transactions found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
                Showing <strong>{paginatedHistory.length}</strong> of <strong>{filteredHistory.length}</strong> transactions.
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
  );
}
