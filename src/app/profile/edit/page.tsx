'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function EditProfilePage() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isSaving, startTransition] = useTransition();

    const [fullName, setFullName] = useState('');
    const [mobile, setMobile] = useState('');
    
    useEffect(() => {
      const fetchProfile = async (sessionUser: User) => {
         const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionUser.id)
            .single();

         if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
         } else {
            setProfileData(data);
            setFullName(data?.full_name || '');
            setMobile(data?.mobile || '');
         }
         setLoading(false);
      }

      const getUser = async () => {
         const { data: { session } } = await supabase.auth.getSession();
         if (session) {
            setUser(session.user);
            await fetchProfile(session.user);
         } else {
            setLoading(false);
         }
      };

      getUser();
    }, []);

    const handleSaveChanges = async () => {
      if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
      }

      if (mobile.trim().length !== 10) {
        toast({ variant: 'destructive', title: 'Invalid Mobile Number', description: 'Mobile number must be exactly 10 digits.' });
        return;
      }

      const updatedData = {
        full_name: fullName,
        mobile: mobile,
      };

      startTransition(async () => {
        const { error } = await supabase
          .from('users')
          .update(updatedData)
          .eq('id', user.id);

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Your profile has been updated.'});
        }
      });
    }

    return (
        <div>
            <PageHeader title="Edit Profile" />
            <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-24">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                        <>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={user?.email || ''} readOnly disabled className="bg-muted" />
                            </div>
                            <div>
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isSaving} />
                            </div>
                            <div>
                                <Label htmlFor="mobile">Mobile Number (10 digits)</Label>
                                <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} disabled={isSaving} type="tel" maxLength={10} />
                            </div>
                            <Button className="w-full" onClick={handleSaveChanges} disabled={isSaving || loading}>
                               {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
