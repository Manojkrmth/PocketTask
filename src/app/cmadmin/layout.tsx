
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/loading-screen';
import type { User } from '@supabase/supabase-js';
import { BarChart, Users, ListTodo, LogOut, MessageSquare, Settings, Bell, Coins, SlidersHorizontal, Wallet, ListChecks, Shield } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const ADMIN_USER_ID = '7fa62eb6-4e08-4064-ace3-3f6116efa29f';

const navItems = [
  { href: '/cmadmin/dashboard', label: 'Dashboard', icon: BarChart },
  { href: '/cmadmin/users', label: 'Users', icon: Users },
  { href: '/cmadmin/task-manager', label: 'Gmail Task Manager', icon: SlidersHorizontal },
  { href: '/cmadmin/tasks', label: 'Task Center', icon: ListTodo },
  { href: '/cmadmin/coin-manager', label: 'Coin Manager', icon: Coins },
  { href: '/cmadmin/daily-tasks', label: 'Daily Task', icon: ListChecks },
  { href: '/cmadmin/withdrawals', label: 'Withdrawals', icon: Wallet },
  { href: '/cmadmin/tickets', label: 'Tickets', icon: MessageSquare },
  { href: '/cmadmin/notifications', label: 'Notifications', icon: Bell },
  { href: '/cmadmin/settings', label: 'Settings', icon: Settings },
  { href: '/cmadmin/admins', label: 'Admins', icon: Shield },
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
    // You can optionally show an "Unauthorized" message here
    // before redirecting, but for now, LoadingScreen is fine.
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen bg-background admin-panel">
      <aside className="w-64 flex-shrink-0 bg-card border-r p-4 flex flex-col">
        <div className="text-center py-4 mb-8 flex items-center justify-center gap-2">
            <Image 
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-full"
            />
            <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
        </div>
        <nav className="flex-grow space-y-2">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} passHref>
               <Button
                variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                className="w-full justify-start text-sm h-11"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
             <Button
                variant='ghost'
                className="w-full justify-start text-sm h-11 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col">
        <header className="bg-card shadow-sm border-b">
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
