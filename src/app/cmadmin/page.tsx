
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }

      // RLS को बायपास करने के लिए .rpc() का उपयोग करना सबसे अच्छा तरीका है, 
      // लेकिन सरलता के लिए, हम मान रहे हैं कि एडमिन के पास पढ़ने की अनुमति है।
      // यदि यह काम नहीं करता है, तो हमें एक RPC फ़ंक्शन बनाना होगा।
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error("Error fetching user count:", error);
        setTotalUsers(0);
      } else {
        setTotalUsers(count);
      }
      
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome Super Admin!</p>
            {user && <p className="text-sm text-muted-foreground mt-1">{user.email}</p>}
        </div>
      </div>
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                    <div className="text-2xl font-bold">
                        {totalUsers}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                    Total registered users in the system
                </p>
            </CardContent>
        </Card>
        {/* You can add more stat cards here in the future */}
       </div>
    </div>
  );
}
