
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Phone, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AppUser {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
}

export default function EditUserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.userId as string;

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, startSaving] = useTransition();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchUserDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, mobile')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user details:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user details.' });
        router.push('/cmadmin/users');
      } else {
        setUser(data);
        setFullName(data.full_name || '');
        setEmail(data.email || '');
        setMobile(data.mobile || '');
      }
      setLoading(false);
    };

    fetchUserDetails();
  }, [userId, router, toast]);

  const handleSaveChanges = () => {
    startSaving(async () => {
        if (!user) return;
        
        // Update user data in the 'users' table
        const { error: usersUpdateError } = await supabase
            .from('users')
            .update({ full_name: fullName, mobile: mobile })
            .eq('id', user.id);
        
        if (usersUpdateError) {
             toast({ variant: 'destructive', title: 'Update Failed', description: usersUpdateError.message });
             return;
        }

        // Update email in the 'auth.users' table
        const { data: authUser, error: authUpdateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { email: email }
        );

        if (authUpdateError) {
             toast({ variant: 'destructive', title: 'Auth Update Failed', description: `Could not update email. ${authUpdateError.message}` });
             // Note: You might want to handle partial success here
             return;
        }
        
        toast({ title: 'Success', description: "User details have been updated." });
        router.push(`/cmadmin/users/${user.id}`);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold">Edit User</h1>
            <p className="text-muted-foreground">Modify details for {user.full_name || user.email}</p>
        </div>
      <Card>
          <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                  Make changes to the user's profile. Click save when you're done.
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2"><User className="h-4 w-4"/> Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isSaving}/>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4"/> Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSaving}/>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="mobile" className="flex items-center gap-2"><Phone className="h-4 w-4"/> Mobile Number</Label>
                  <Input id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={isSaving}/>
              </div>
          </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
          </Button>
      </div>
    </div>
  );
}
