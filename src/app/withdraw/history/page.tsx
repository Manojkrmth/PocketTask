'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { ListFilter, Loader2, Wallet, IndianRupee } from "lucide-react";
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { useCurrency } from '@/context/currency-context';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const ITEMS_PER_PAGE = 10;
type Status = 'Approved' | 'Pending' | 'Rejected';

export default function WithdrawHistoryPage() {
  const [statusFilters, setStatusFilters] = useState<Status[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchHistoryAndProfile = async (userId: string) => {
        setIsHistoryLoading(true);
        setIsProfileLoading(true);

        const { data: historyData, error: historyError } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', userId);
        
        if (historyError) {
            console.error("Error fetching withdrawal history:", historyError);
            setHistory([]);
        } else {
            setHistory(historyData || []);
        }
        setIsHistoryLoading(false);

        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('balance_available, balance_hold')
          .eq('id', userId)
          .single();
        
        if(profileError) {
          console.error("Error fetching user profile for earnings:", profileError);
          setUserProfile(null);
        } else {
          setUserProfile(profileData);
        }
        setIsProfileLoading(false);
    };

    const getUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setUser(session.user);
            fetchHistoryAndProfile(session.user.id);
        } else {
            setIsHistoryLoading(false);
            setIsProfileLoading(false);
        }
    };
    getUser();
  }, []);

  const totalWithdrawn = useMemo(() => {
    if (!history) return 0;
    return history
      .filter(item => item.status === 'Approved')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [history]);
  
  const totalEarned = useMemo(() => {
    if (!userProfile) return 0;
    const available = userProfile.balance_available || 0;
    const hold = userProfile.balance_hold || 0;
    return available + hold + totalWithdrawn;
  }, [userProfile, totalWithdrawn]);

  const sortedHistory = useMemo(() => {
    if (!history) return [];
    return [...history].sort((a: any, b: any) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
    });
  }, [history]);

  const filteredItems = useMemo(() => {
     if (!sortedHistory) return [];
     return statusFilters.length > 0 
      ? sortedHistory.filter((item: any) => statusFilters.includes(item.status as Status)) 
      : sortedHistory
  }, [sortedHistory, statusFilters]);

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage]);
  
  const canLoadMore = currentPage * ITEMS_PER_PAGE < filteredItems.length;
  const canGoBack = currentPage > 1;

  const isLoading = isHistoryLoading || isProfileLoading;

  const toggleFilter = (status: Status) => {
    setCurrentPage(1); // Reset pagination on filter change
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

  return (
    <div className="min-h-screen">
       <PageHeader title="Wallet History" description="Review your past payment requests" />

      <main className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : formatCurrency(totalEarned)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                      Your total lifetime earnings.
                  </p>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : formatCurrency(totalWithdrawn)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                      From all approved withdrawals.
                  </p>
              </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Requests</CardTitle>
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
                  checked={statusFilters.includes('Approved')}
                  onCheckedChange={() => toggleFilter('Approved')}
                >
                  Approved
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={4} className="h-24 text-center"><div className="flex justify-center items-center gap-2"><Loader2 className="h-6 w-6 animate-spin"/> Loading...</div></TableCell></TableRow>}
                  {!isLoading && currentItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold">{formatCurrency(item.amount)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{item.payment_method}</div>
                        <div className="text-xs text-muted-foreground break-all">{item.payment_details}</div>
                        {item.utr && <div className="text-xs text-blue-500">UTR: {item.utr}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "whitespace-nowrap",
                            item.status === "Approved" && "bg-green-100 text-green-800 border-green-200",
                            item.status === "Pending" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                            item.status === "Rejected" && "bg-red-100 text-red-800 border-red-200"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs whitespace-nowrap">{formatDate(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && (!currentItems || currentItems.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground h-24">
                          No withdrawals found for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
      </main>
    </div>
  );
}
