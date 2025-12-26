

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, UserPlus, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: number;
  user_id: string;
  created_at: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
}

// This is the user ID for manojmukhiyamth@gmail.com, which should not be deletable.
const nonDeletableAdminId = '98cda2fc-f09d-4840-9f47-ec0c749a6bbd';

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, startAdd] = useTransition();

  const [addDialogOpen, setAddDialogOpen] = useState(false);

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : admins.length > 0 ? (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <span className="font-medium">{admin.users?.full_name || 'N/A'}</span>
                          {admin.user_id === nonDeletableAdminId && (
                            <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                               <Shield className="mr-1 h-3 w-3" />
                               Super Admin
                            </Badge>
                          )}
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{admin.users?.email}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(admin.created_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No admins found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
    