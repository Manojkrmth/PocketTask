

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
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
import { Loader2, Mail, Phone, UserX, UserCheck, Eye, ListFilter, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/context/currency-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AppUser {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  status: string;
  created_at: string;
  referral_code: string;
  balance_available: number;
  referral_count: number;
}

type ActionType = 'Block' | 'Unblock';
type SortByType = 'latest' | 'balance' | 'referrals';

const ROWS_PER_PAGE_OPTIONS = [20, 30, 40, 50, 100];

export default function UsersPage() {
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('latest');
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  
  const [isUpdating, startUpdateTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_users_with_referral_counts');

    if (error) {
      console.error("Error fetching users:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch users. Please ensure the 'get_users_with_referral_counts' function exists by running the script from the SQL Editor page." });
    } else {
      setAllUsers(data as AppUser[]);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchUsers();
  }, [toast]);

  const handleUpdateUserStatus = (user: AppUser, newStatus: 'Active' | 'Blocked') => {
    startUpdateTransition(async () => {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', user.id);

      if (error) {
        toast({ variant: "destructive", title: "Update Failed", description: error.message });
      } else {
        toast({ title: "Success", description: `${user.full_name}'s status has been updated to ${newStatus}.` });
        await fetchUsers();
      }
    });
  };

  const openConfirmationDialog = (user: AppUser, type: ActionType) => {
    setSelectedUser(user);
    setActionType(type);
    setDialogOpen(true);
  };

  const confirmAction = () => {
    if (selectedUser && actionType) {
      const newStatus = actionType === 'Block' ? 'Blocked' : 'Active';
      handleUpdateUserStatus(selectedUser, newStatus);
    }
    setDialogOpen(false);
    setSelectedUser(null);
    setActionType(null);
  };
  
  const sortedAndFilteredUsers = useMemo(() => {
    const filtered = allUsers.filter(user =>
        (user.full_name?.toLowerCase().includes(filter.toLowerCase()) ?? false) ||
        (user.email?.toLowerCase().includes(filter.toLowerCase()) ?? false) ||
        (user.mobile?.includes(filter) ?? false)
    );
    
    switch (sortBy) {
        case 'balance':
            return filtered.sort((a, b) => (b.balance_available || 0) - (a.balance_available || 0));
        case 'referrals':
             return filtered.sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0));
        case 'latest':
        default:
            return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [allUsers, filter, sortBy]);
  
  const totalPages = Math.ceil(sortedAndFilteredUsers.length / rowsPerPage);
  
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedAndFilteredUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedAndFilteredUsers, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sortBy, rowsPerPage]);

  
  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              View, search, and manage all registered users.
            </p>
          </div>
          <div className="flex gap-2">
             <Input
                placeholder="Filter by name, email, or mobile..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-64"
             />
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-1">
                        <ListFilter className="h-3.5 w-3.5" />
                        <span>Sort by</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort Users By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as SortByType)}>
                        <DropdownMenuRadioItem value="latest">Latest Registered</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="balance">Top Balance</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="referrals">Top Referrers</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Balance</TableHead>
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
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.full_name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {user.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-3 w-3 text-muted-foreground"/>
                          <span className="text-xs">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground"/>
                          <span className="text-xs">{user.mobile || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant={user.status === 'Blocked' ? 'destructive' : 'outline'} className={cn(user.status !== 'Blocked' && 'bg-green-100 text-green-800 border-green-200')}>
                        {user.status || 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(user.balance_available || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                         <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/cmadmin/users/${user.id}`}>
                                <Eye className="h-4 w-4" />
                            </Link>
                         </Button>
                        {user.status !== 'Blocked' ? (
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => openConfirmationDialog(user, 'Block')}
                                disabled={isUpdating && selectedUser?.id === user.id}
                            >
                               {isUpdating && selectedUser?.id === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserX className="h-4 w-4"/>}
                            </Button>
                        ) : (
                             <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 text-green-600 hover:bg-green-100/80 hover:text-green-700"
                                onClick={() => openConfirmationDialog(user, 'Unblock')}
                                disabled={isUpdating && selectedUser?.id === user.id}
                            >
                               {isUpdating && selectedUser?.id === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <UserCheck className="h-4 w-4"/>}
                            </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
         <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
                Showing <strong>{paginatedUsers.length}</strong> of <strong>{sortedAndFilteredUsers.length}</strong> users.
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
                    <div className="text-sm font-medium">
                        Page {currentPage} of {totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
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
               You are about to <span className={cn("font-bold", actionType === 'Block' ? "text-red-600" : "text-green-600")}>{actionType?.toLowerCase()}</span> the user <span className="font-bold">{selectedUser?.full_name}</span>.
               This will {actionType === 'Block' ? 'prevent them from accessing their account' : 'restore their account access'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmAction}
                className={cn(actionType === 'Block' && 'bg-destructive hover:bg-destructive/90')}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


