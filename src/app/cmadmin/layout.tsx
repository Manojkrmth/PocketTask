
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/loading-screen';
import type { User } from '@supabase/supabase-js';
import { BarChart, Users, ListTodo, LogOut } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// For simplicity, hardcoding the admin user's ID.
// In a real app, this should be managed via a database role or custom claims.
const ADMIN_USER_ID = '7fa62eb6-4e08-4064-ace3-3f6116efa29f';

const navItems = [
  { href: '/cmadmin/dashboard', label: 'Dashboard', icon: BarChart },
  { href: '/cmadmin/users', label: 'Users', icon: Users },
  { href: '/cmadmin/tasks', label: 'Tasks', icon: ListTodo },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
        router.push('/');
        return;
      }
      
      setUser(session.user);
      setIsAuthorized(true);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthorized) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <aside className="w-64 flex-shrink-0 bg-background border-r p-4 flex flex-col">
        <div className="text-center py-4 mb-8">
            <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
        </div>
        <nav className="flex-grow space-y-2">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} passHref>
               <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="w-full justify-start text-base py-6"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
             <Button
                variant='destructive'
                className="w-full justify-start text-base py-6"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col">
        <header className="bg-background shadow-sm border-b">
            <div className="p-4 flex justify-end items-center">
                 {user && (
                    <div className="text-sm text-right">
                        <p className="font-semibold">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Super Admin</p>
                    </div>
                 )}
            </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
            {children}
        </main>
      </div>
    </div>
  );
}
