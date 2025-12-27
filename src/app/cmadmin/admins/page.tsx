
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
import { Loader2, PlusCircle, UserPlus, Shield, UserX, Edit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdmin } from '../layout';

type Permission = 'full_access' | 'view_only';

interface AdminUser {
  id: number;
  user_id: string;
  created_at: string;
  permissions: Permission | null;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
}

// This is the user ID for manojmukhiyamth@gmail.com, which should not be deletable.
const nonDeletableAdminId = '98cda2fc-f09d-4840-9f47-ec0c749a6bbd';

export default function AdminsPage() {
  const { isViewOnly } = useAdmin();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isProcessing, startProcessing] = useTransition();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  
  const [selectedAdminToDismiss, setSelectedAdminToDismiss] = useState<AdminUser | null>(null);
  const [selectedAdminToEdit, setSelectedAdminToEdit] = useState<AdminUser | null>(null);
  const [newPermissionForEdit, setNewPermissionForEdit] = useState<Permission>('full_access');

  const [newAdminUserId, setNewAdminUserId] = useState('');
  const [newAdminPermission, setNewAdminPermission] = useState<Permission>('full_access');

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
  }, []);


  const handleAddAdmin = () => {
    if (!newAdminUserId.trim()) {
        toast({ variant: 'destructive', title: 'User ID required', description: "Please enter a valid user ID." });
        return;
    }

    startProcessing(async () => {
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
            .insert({ 
                user_id: newAdminUserId.trim(), 
                role: 'admin', 
                permissions: newAdminPermission 
            });

        if (insertError) {
             if (insertError.code === '23505') { // unique constraint violation
                toast({ variant: 'destructive', title: 'Already Admin', description: 'This user is already an admin.' });
             } else {
                toast({ variant: 'destructive', title: 'Failed to Add', description: insertError.message });
             }
        } else {
            toast({ title: 'Success', description: 'New admin has been added.' });
            setNewAdminUserId('');
            setNewAdminPermission('full_access');
            setAddDialogOpen(false);
            await fetchAdmins();
        }
    });
  }

  const openDismissDialog = (admin: AdminUser) => {
    setSelectedAdminToDismiss(admin);
    setDismissDialogOpen(true);
  }

  const handleDismissAdmin = () => {
      if (!selectedAdminToDismiss) return;
      
      startProcessing(async () => {
        const { error } = await supabase
            .from('admins')
            .delete()
            .eq('user_id', selectedAdminToDismiss.user_id);

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to Dismiss', description: error.message });
        } else {
            toast({ title: 'Success', description: `${selectedAdminToDismiss.users?.full_name || 'Admin'} has been dismissed.` });
            setDismissDialogOpen(false);
            setSelectedAdminToDismiss(null);
            await fetchAdmins();
        }
      });
  }
  
  const openEditDialog = (admin: AdminUser) => {
    setSelectedAdminToEdit(admin);
    setNewPermissionForEdit(admin.permissions || 'full_access');
    setEditDialogOpen(true);
  }
  
  const handleEditAdmin = () => {
    if (!selectedAdminToEdit || !newPermissionForEdit) return;

    startProcessing(async () => {
        const { error } = await supabase
            .from('admins')
            .update({ permissions: newPermissionForEdit })
            .eq('user_id', selectedAdminToEdit.user_id);
            
        if (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } else {
            toast({ title: 'Success', description: `Permissions for ${selectedAdminToEdit.users?.full_name} have been updated.` });
            setEditDialogOpen(false);
            setSelectedAdminToEdit(null);
            await fetchAdmins(); // Refetch data to ensure UI consistency
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
              Add, remove, and manage administrator permissions.
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
                <Button disabled={isViewOnly}><PlusCircle className="mr-2 h-4 w-4"/> Add New Admin</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Admin</DialogTitle>
                    <DialogDescription>Enter the User ID and set permissions for the new admin.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="user-id">User ID</Label>
                        <Input 
                            id="user-id" 
                            value={newAdminUserId}
                            onChange={(e) => setNewAdminUserId(e.target.value)}
                            placeholder="Enter the full User ID"
                            disabled={isProcessing}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="permission">Permissions</Label>
                        <Select value={newAdminPermission} onValueChange={(value: Permission) => setNewAdminPermission(value)}>
                            <SelectTrigger id="permission">
                                <SelectValue placeholder="Select permissions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full_access">Full Access</SelectItem>
                                <SelectItem value="view_only">View Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={isProcessing}>Cancel</Button>
                    <Button onClick={handleAddAdmin} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>}
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
                <TableHead>Permission</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
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
                    <TableCell>
                       {admin.user_id === nonDeletableAdminId ? (
                         <Badge variant="secondary">All</Badge>
                       ) : (
                         <Badge variant={admin.permissions === 'full_access' ? 'default' : 'outline'} className={cn(admin.permissions === 'full_access' && 'bg-green-600')}>
                            {admin.permissions === 'full_access' ? 'Full Access' : 'View Only'}
                         </Badge>
                       )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(admin.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                       {admin.user_id !== nonDeletableAdminId && (
                           <div className="flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={() => openEditDialog(admin)} disabled={isProcessing || isViewOnly}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => openDismissDialog(admin)}
                                    disabled={isProcessing || isViewOnly}
                                >
                                    <UserX className="mr-2 h-4 w-4" />
                                    Dismiss
                                </Button>
                           </div>
                       )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No admins found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <AlertDialog open={dismissDialogOpen} onOpenChange={setDismissDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will remove admin privileges for <span className="font-bold">{selectedAdminToDismiss?.users?.full_name || 'this user'}</span>. They will remain a regular user.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDismissAdmin} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Confirm Dismissal
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Permissions</DialogTitle>
                <DialogDescription>Change the permission level for <span className="font-bold">{selectedAdminToEdit?.users?.full_name}</span>.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="edit-permission">Permissions</Label>
                <Select 
                    value={newPermissionForEdit} 
                    onValueChange={(value: Permission) => setNewPermissionForEdit(value)}
                >
                    <SelectTrigger id="edit-permission">
                        <SelectValue placeholder="Select permissions" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="full_access">Full Access</SelectItem>
                        <SelectItem value="view_only">View Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isProcessing}>Cancel</Button>
                <Button onClick={handleEditAdmin} disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
    

    

    
