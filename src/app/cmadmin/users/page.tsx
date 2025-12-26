

'use client';

import { useState, useEffect, useTransition } from 'react';
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
import { Loader2, Mail, Phone, UserX, UserCheck, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/context/currency-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AppUser {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  status: string;
  created_at: string;
  referral_code: string;
  balance_available: number;
}

type ActionType = 'Block' | 'Unblock';

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isUpdating, startUpdateTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_users');

    if (error) {
      console.error("Error fetching users:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch users. Please run the latest SQL script from the SQL Editor page." });
    } else {
      setUsers(data as AppUser[]);
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

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
    user.email?.toLowerCase().includes(filter.toLowerCase()) ||
    user.mobile?.includes(filter)
  );
  
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
          <Input
            placeholder="Filter by name, email, or mobile..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
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
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.full_name || 'N/A'}</div>
                      <Link href={`/cmadmin/users/${user.id}`} className="text-xs text-muted-foreground hover:underline">
                        ID: {user.id}
                      </Link>
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
