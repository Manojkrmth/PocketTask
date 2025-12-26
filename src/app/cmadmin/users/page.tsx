

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { MoreHorizontal, Loader2, Mail, Phone, UserX, UserCheck, Eye, Edit, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/context/currency-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch users." });
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
  
  const sqlPolicyFix = `-- This script will drop and recreate the settings table with a better structure.
-- It will also create the featured_offers table.
-- WARNING: This will delete your current settings. Make sure to re-configure them in the admin panel.

BEGIN;

-- Drop existing settings table if it exists
DROP TABLE IF EXISTS public.settings;

-- Create a new, better-structured settings table
CREATE TABLE public.settings (
    id bigint PRIMARY KEY DEFAULT 1,
    usd_to_inr_rate double precision NOT NULL DEFAULT 85,
    notice_board_text text,
    whatsapp_link text,
    telegram_link text,
    instagram_link text,
    popup_notice_is_enabled boolean NOT NULL DEFAULT false,
    popup_notice_display_type text,
    popup_notice_text text,
    popup_notice_image_url text,
    popup_notice_redirect_link text,
    referral_commissions jsonb NOT NULL DEFAULT '[]'::jsonb,
    task_settings jsonb NOT NULL DEFAULT '[]'::jsonb,
    withdrawal_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    are_ads_globally_enabled boolean NOT NULL DEFAULT true,
    ad_configs jsonb NOT NULL DEFAULT '[]'::jsonb,
    CONSTRAINT settings_pkey PRIMARY KEY (id),
    CONSTRAINT settings_id_check CHECK (id = 1)
);

-- Enable RLS for the new table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings table
CREATE POLICY "Allow read access to everyone" ON public.settings
FOR SELECT USING (true);

CREATE POLICY "Allow admin full access" ON public.settings
FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Insert a default row so the app doesn't crash on first load.
INSERT INTO public.settings(id) VALUES(1) ON CONFLICT (id) DO NOTHING;


-- 2. Create 'featured_offers' table
CREATE TABLE IF NOT EXISTS public.featured_offers (
    id bigint generated by default as identity primary key,
    created_at timestamp with time zone not null default now(),
    image_url text,
    description text,
    redirect_link text,
    enabled boolean not null default true,
    sort_order integer not null default 0
);
-- Enable RLS for the new table
ALTER TABLE public.featured_offers ENABLE ROW LEVEL SECURITY;
-- Drop old policies for featured_offers if they exist
DROP POLICY IF EXISTS "Allow read access to everyone" ON public.featured_offers;
DROP POLICY IF EXISTS "Allow admin full access" ON public.featured_offers;

-- Create policies for 'featured_offers'
CREATE POLICY "Allow read access to everyone" ON public.featured_offers
FOR SELECT USING (true);

CREATE POLICY "Allow admin full access" ON public.featured_offers
FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Drop and Recreate other policies for consistency
DROP POLICY IF EXISTS "Enable admins to manage users" ON public.users;
DROP POLICY IF EXISTS "Allow individual users to view their own data" ON public.users;
DROP POLICY IF EXISTS "Allow individual users to update their own data" ON public.users;
DROP POLICY IF EXISTS "Allow admins to update users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for own records" ON public.wallet_history;
DROP POLICY IF EXISTS "Allow admins to read all history" ON public.wallet_history;
DROP POLICY IF EXISTS "Allow admins to insert records" ON public.wallet_history;
DROP POLICY IF EXISTS "Enable insert for own withdrawal requests" ON public.wallet_history;
DROP POLICY IF EXISTS "Allow admins to read all payments" ON public.payments;
DROP POLICY IF EXISTS "Allow admins to update payments" ON public.payments;
DROP POLICY IF EXISTS "Allow users to insert their own payment requests" ON public.payments;

CREATE POLICY "Enable admins to manage users" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Allow individual users to view their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow individual users to update their own data" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow admins to update users" ON public.users FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Enable read access for own records" ON public.wallet_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow admins to read all history" ON public.wallet_history FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Allow admins to insert records" ON public.wallet_history FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Enable insert for own withdrawal requests" ON public.wallet_history FOR INSERT WITH CHECK (auth.uid() = user_id AND type = 'withdrawal_pending');
CREATE POLICY "Allow admins to read all payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Allow admins to update payments" ON public.payments FOR UPDATE USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Allow users to insert their own payment requests" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);


COMMIT;
`;


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
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Can't see or edit users/settings?</AlertTitle>
          <div className="space-y-2">
            <p>If you are unable to view or manage users/settings, your database schema might be outdated. Please run the following SQL code in your Supabase SQL Editor. <strong>Warning:</strong> This will reset your app settings.</p>
            <Textarea className="font-mono bg-destructive/10 text-destructive-foreground h-48" readOnly value={sqlPolicyFix} />
            <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(sqlPolicyFix)}>Copy SQL</Button>
          </div>
        </Alert>

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
                      <div className="text-xs text-muted-foreground">ID: {user.id}</div>
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
                      <Badge variant={user.status === 'Blocked' ? 'destructive' : 'outline'}>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating && selectedUser?.id === user.id}>
                            <span className="sr-only">Open menu</span>
                            {isUpdating && selectedUser?.id === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           <DropdownMenuItem onSelect={() => router.push(`/cmadmin/users/${user.id}`)}>
                            <Eye className="mr-2 h-4 w-4"/>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status !== 'Blocked' ? (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onSelect={() => openConfirmationDialog(user, 'Block')}
                            >
                              <UserX className="mr-2 h-4 w-4"/>
                              Block User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="text-green-600"
                              onSelect={() => openConfirmationDialog(user, 'Unblock')}
                            >
                              <UserCheck className="mr-2 h-4 w-4"/>
                              Unblock User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            <AlertDialogAction onClick={confirmAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
