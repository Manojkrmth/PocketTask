
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, User, Mail, Phone, Calendar, Hash, Wallet, BarChart, Shield } from 'lucide-react';
import { useCurrency } from '@/context/currency-context';
import { format } from 'date-fns';

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

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const userId = params.userId as string;

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchUserDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user details:', error);
        router.push('/cmadmin/users'); // Redirect if user not found
      } else {
        setUser(data as AppUser);
      }
      setLoading(false);
    };

    fetchUserDetails();
  }, [userId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="User Not Found" />
        <main className="p-6">
          <p>The requested user could not be found.</p>
        </main>
      </div>
    );
  }
  
  const formattedDate = format(new Date(user.created_at), 'PPP p');

  return (
    <div>
      <PageHeader title="User Details" description={user.full_name || user.email} />
      <main className="p-6 space-y-6">
        
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary"/> Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Full Name</span>
                        <span className="font-semibold">{user.full_name || 'N/A'}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Email Address</span>
                        <span className="font-semibold">{user.email}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Mobile Number</span>
                        <span className="font-semibold">{user.mobile || 'N/A'}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID</span>
                        <span className="font-mono text-xs">{user.id}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/> Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={user.status === 'Blocked' ? 'destructive' : 'outline'}>
                            {user.status || 'Active'}
                        </Badge>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Registered On</span>
                        <span className="font-semibold">{formattedDate}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Referral Code</span>
                        <span className="font-mono font-semibold">{user.referral_code}</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary"/> Financials</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <span className="font-semibold">Available Balance</span>
                    <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(user.balance_available || 0)}
                    </span>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-start">
            <Button onClick={() => router.push('/cmadmin/users')}>Back to User List</Button>
        </div>
      </main>
    </div>
  );
}
