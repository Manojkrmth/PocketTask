'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/loading-screen';
import type { User } from '@supabase/supabase-js';

// For simplicity, hardcoding the admin user's ID.
// In a real app, this should be managed via a database role or custom claims.
const ADMIN_USER_ID = '7fa62eb6-4e08-4064-ace3-3f6116efa29f';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      if (session.user.id !== ADMIN_USER_ID) {
        // If not an admin, redirect to home page
        router.push('/');
        return;
      }
      
      setUser(session.user);
      setIsAuthorized(true);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthorized) {
    // This will show briefly before redirecting.
    // Or you could return a dedicated "Unauthorized" component.
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-background shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-foreground">
            Super Admin Panel
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0 bg-background rounded-lg shadow-sm">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
