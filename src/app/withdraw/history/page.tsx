'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
    ListFilter, 
    Loader2, 
    Wallet, 
    IndianRupee, 
    ArrowDownCircle, 
    ArrowUpCircle,
    RotateCw,
    Gift,
    FileText,
    HelpCircle
} from "lucide-react";
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { useCurrency } from '@/context/currency-context';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import BannerAd from '@/components/ads/banner-ad';

const ITEMS_PER_PAGE = 10;
type Status = 'Completed' | 'Pending' | 'Rejected';

const transactionIcons: { [key: string]: React.ReactElement } = {
    'task_reward': <FileText className="h-5 w-5 text-blue-500" />,
    'coin_credit': <IndianRupee className="h-5 w-5 text-yellow-500" />,
    'spin_win': <RotateCw className="h-5 w-5 text-purple-500" />,
    'withdrawal': <Wallet className="h-5 w-5 text-red-500" />,
    'referral_bonus': <Gift className="h-5 w-5 text-green-500" />,
    'manual_credit': <Gift className="h-5 w-5 text-green-500" />,
    'manual_debit': <Wallet className="h-5 w-5 text-red-500" />,
    'default': <HelpCircle className="h-5 w-5 text-gray-500" />,
};

export default function WalletHistoryPage() {
  const searchParams = useSearchParams();
  const preselectedUserId = searchParams.get('userId');

  const [statusFilters, setStatusFilters] = useState<Status[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchHistory = async (userId: string) => {
        setIsHistoryLoading(true);
        
        let query = supabase
            .from('wallet_history')
            .select('*')
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error("Error fetching wallet history:", error);
            setHistory([]);
        } else {
            setHistory(data || []);
        }
        setIsHistoryLoading(false);
    };

    const getUser = async () => {
        if (preselectedUserId) {
            fetchHistory(preselectedUserId);
        } else {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                fetchHistory(session.user.id);
            } else {
                setIsHistoryLoading(false);
            }
        }
    };
    getUser();
  }, [preselectedUserId]);

  const { totalCredit, totalDebit } = useMemo(() => {
    if (!history) return { totalCredit: 0, totalDebit: 0 };
    return history.reduce((acc, item) => {
        if(item.status === 'Completed') {
            if (item.amount > 0) acc.totalCredit += item.amount;
            else acc.totalDebit += Math.abs(item.amount);
        }
        return acc;
    }, { totalCredit: 0, totalDebit: 0 });
  }, [history]);

  const filteredItems = useMemo(() => {
     if (!history) return [];
     return statusFilters.length > 0 
      ? history.filter((item: any) => statusFilters.includes(item.status as Status)) 
      : history
  }, [history, statusFilters]);

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);
  
  const canLoadMore = currentPage * ITEMS_PER_PAGE < filteredItems.length;
  const canGoBack = currentPage > 1;

  const toggleFilter = (status: Status) => {
    setCurrentPage(1);
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }

  const loadMore = () => {
    if (canLoadMore) setCurrentPage(prev => prev + 1);
  };

  const goBack = () => {
      if(canGoBack) setCurrentPage(prev => prev - 1);
  }
  
  const getTransactionIcon = (type: string) => {
    return transactionIcons[type] || transactionIcons['default'];
  }

  return (
    <div className="min-h-screen">
       <PageHeader title="Wallet History" description="Review all your transactions" />

      <main className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-green-50 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Total Credit</CardTitle>
                  <ArrowDownCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                      {isHistoryLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : formatCurrency(totalCredit)}
                  </div>
              </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Total Debit</CardTitle>
                  <ArrowUpCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-red-700">
                      {isHistoryLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : formatCurrency(totalDebit)}
                  </div>
              </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Transactions</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={statusFilters.includes('Completed')}
                  onCheckedChange={() => toggleFilter('Completed')}
                >
                  Completed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilters.includes('Pending')}
                  onCheckedChange={() => toggleFilter('Pending')}
                >
                  Pending
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilters.includes('Rejected')}
                  onCheckedChange={() => toggleFilter('Rejected')}
                >
                  Rejected
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div>
              {isHistoryLoading && <div className="flex justify-center items-center h-48 gap-2"><Loader2 className="h-6 w-6 animate-spin"/> Loading...</div>}
              {!isHistoryLoading && currentItems.map((item: any) => (
                <div key={item.id} className="flex items-start gap-4 py-3 border-b last:border-b-0">
                    <div className="p-2 bg-muted rounded-full mt-1">
                       {getTransactionIcon(item.type)}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <p className="font-semibold capitalize">
                                {item.type.replace(/_/g, ' ')}
                            </p>
                            <p className={cn(
                                "font-bold text-lg",
                                item.amount > 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {item.amount > 0 ? '+' : '-'}
                                {formatCurrency(Math.abs(item.amount))}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground -mt-1">{item.description}</p>
                        
                        <div className="flex items-center justify-between text-xs mt-1">
                           <Badge
                              variant="outline"
                              className={cn(
                                "whitespace-nowrap",
                                item.status === "Completed" && "bg-green-100 text-green-800 border-green-200",
                                item.status === "Pending" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                                item.status === "Rejected" && "bg-red-100 text-red-800 border-red-200"
                              )}
                            >
                              {item.status}
                            </Badge>
                            <span className="text-muted-foreground">{formatDate(item.created_at)}</span>
                        </div>

                        {item.metadata?.utr && (
                            <p className="text-xs text-blue-600 mt-1">UTR: {item.metadata.utr}</p>
                        )}
                        {item.metadata?.reason && item.status === 'Rejected' && (
                             <p className="text-xs text-destructive mt-1">Reason: {item.metadata.reason}</p>
                        )}
                    </div>
                </div>
              ))}
              {!isHistoryLoading && currentItems.length === 0 && (
                <div className="text-center py-10 text-muted-foreground h-24">
                  No transactions found for the selected filters.
                </div>
              )}
            </div>
            <div className="pt-4 flex justify-center gap-2">
                {canGoBack && (
                    <Button onClick={goBack} variant="outline">Previous</Button>
                )}
                {canLoadMore && (
                    <Button onClick={loadMore} variant="outline">Load More</Button>
                )}
            </div>
          </CardContent>
        </Card>
        <BannerAd adId="wallet-history" />
      </main>
    </div>
  );
}
