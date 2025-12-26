

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, PlusCircle, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminUser {
  id: number;
  user_id: string;
  created_at: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDeleting, startDelete] = useTransition();
  const [isAdding, startAdd] = useTransition();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [newAdminUserId, setNewAdminUserId] = useState('');

  const { toast } = useToast();

  const fetchAdmins = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_admins');

    if (error) {
      console.error("Error fetching admins:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch admins. Please run the latest SQL script from the SQL Editor page." });
    } else {
      setAdmins(data as AdminUser[]);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchAdmins();
  }, [toast]);

  const handleDeleteAdmin = () => {
    if (!selectedAdmin) return;

    startDelete(async () => {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', selectedAdmin.id);
      
      if (error) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
      } else {
        toast({ title: 'Success', description: `Admin has been removed.` });
        await fetchAdmins(); // Refresh the list
      }
      setDeleteDialogOpen(false);
      setSelectedAdmin(null);
    });
  };

  const handleAddAdmin = () => {
    if (!newAdminUserId.trim()) {
        toast({ variant: 'destructive', title: 'User ID required', description: "Please enter a valid user ID." });
        return;
    }

    startAdd(async () => {
        // First, check if user exists
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', newAdminUserId.trim())
            .single();
        
        if (userError || !user) {
            toast({ variant: 'destructive', title: 'Invalid User ID', description: 'No user found with that ID.' });
            return;
        }

        // Now, add the user to the admins table
        const { error: insertError } = await supabase
            .from('admins')
            .insert({ user_id: newAdminUserId.trim(), role: 'admin' });

        if (insertError) {
             if (insertError.code === '23505') { // unique constraint violation
                toast({ variant: 'destructive', title: 'Already Admin', description: 'This user is already an admin.' });
             } else {
                toast({ variant: 'destructive', title: 'Failed to Add', description: insertError.message });
             }
        } else {
            toast({ title: 'Success', description: 'New admin has been added.' });
            setNewAdminUserId('');
            setAddDialogOpen(false);
            await fetchAdmins();
        }
    });
  }

  const openDeleteDialog = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Management</h1>
            <p className="text-muted-foreground">
              Add or remove administrators.
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4"/> Add New Admin</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Admin</DialogTitle>
                    <DialogDescription>Enter the User ID of the user you want to make an admin.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="user-id">User ID</Label>
                    <Input 
                        id="user-id" 
                        value={newAdminUserId}
                        onChange={(e) => setNewAdminUserId(e.target.value)}
                        placeholder="Enter the full User ID"
                        disabled={isAdding}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={isAdding}>Cancel</Button>
                    <Button onClick={handleAddAdmin} disabled={isAdding}>
                        {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>}
                        Confirm Add
                    </Button>
                </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : admins.length > 0 ? (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="font-medium">{admin.users?.full_name || 'N/A'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{admin.users?.email}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(admin.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => openDeleteDialog(admin)}
                            disabled={isDeleting && selectedAdmin?.id === admin.id}
                        >
                            {isDeleting && selectedAdmin?.id === admin.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No admins found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
               This action cannot be undone. This will permanently remove admin privileges from {' '}
               <span className="font-bold">{selectedAdmin?.users?.email}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    