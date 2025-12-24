'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    getUser();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome Super Admin!</p>
            {user && <p className="text-sm text-muted-foreground mt-1">{user.email}</p>}
        </div>
      </div>
       <div className="mt-8">
        <p>This is your central hub for managing the application.</p>
       </div>
    </div>
  );
}
