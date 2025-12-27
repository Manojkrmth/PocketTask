
'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/loading-screen';
import type { User } from '@supabase/supabase-js';
import { BarChart, Users, ListTodo, LogOut, MessageSquare, Settings, Bell, Coins, SlidersHorizontal, ListChecks, Shield, Megaphone, UserPlus, Database, Menu, X, IndianRupee, History } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

type Permission = 'full_access' | 'view_only';

interface AdminProfile {
    id: string;
    role: 'super_admin' | 'admin';
    permissions: Permission | null;
}

const SUPER_ADMIN_USER_IDS = [
    '7fa62eb6-4e08-4064-ace3-3f6116efa29f', // Original Super Admin
    '98cda2fc-f09d-4840-9f47-ec0c749a6bbd'  // New Super Admin (manojmukhiyamth@gmail.com)
];

const allNavItems = [
  { href: '/cmadmin/dashboard', label: 'Dashboard', icon: BarChart, requiredPermission: ['full_access', 'view_only'] },
  { href: '/cmadmin/users', label: 'Users', icon: Users, requiredPermission: ['full_access', 'view_only'] },
  { href: '/cmadmin/task-manager', label: 'Gmail Task Manager', icon: SlidersHorizontal, requiredPermission: ['full_access'] },
  { href: '/cmadmin/tasks', label: 'Task Manager', icon: ListTodo, requiredPermission: ['full_access', 'view_only'] },
  { href: '/cmadmin/withdrawals', label: 'Withdrawals', icon: IndianRupee, requiredPermission: ['full_access', 'view_only'] },
  { href: '/cmadmin/payments', label: 'Wallet History', icon: History, requiredPermission: ['full_access', 'view_only'] },
  { href: '/cmadmin/coin-manager', label: 'Coin Manager', icon: Coins, requiredPermission: ['full_access'] },
  { href: '/cmadmin/daily-tasks', label: 'Daily Task', icon: ListChecks, requiredPermission: ['full_access'] },
  { href: '/cmadmin/tickets', label: 'Tickets', icon: MessageSquare, requiredPermission: ['full_access', 'view_only'] },
  { href: '/cmadmin/notifications', label: 'Notifications', icon: Bell, requiredPermission: ['full_access'] },
  { href: '/cmadmin/ads', label: 'Ads Manager', icon: Megaphone, requiredPermission: ['full_access'] },
];

const adminNavItems = [
  { href: '/cmadmin/settings', label: 'App Settings', icon: Settings, requiredPermission: ['full_access'] },
  { href: '/cmadmin/admins', label: 'Admins', icon: Shield, requiredPermission: [] }, // Super admin only
  { href: '/cmadmin/sql-editor', label: 'SQL Editor', icon: Database, requiredPermission: [] }, // Super admin only
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }

    const isSuperAdmin = SUPER_ADMIN_USER_IDS.includes(session.user.id);
    
    if (isSuperAdmin) {
        setAdminProfile({ id: session.user.id, role: 'super_admin', permissions: 'full_access' });
        setUser(session.user);
        setLoading(false);
        return;
    }

    const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('role, permissions')
        .eq('user_id', session.user.id)
        .single();
    
    if (adminError || !adminData) {
        router.push('/');
        return;
    }

    setAdminProfile({ id: session.user.id, role: 'admin', permissions: adminData.permissions as Permission });
    setUser(session.user);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);
  
  const getVisibleNavItems = () => {
    if (!adminProfile) return { main: [], admin: [] };
    
    const isSuper = adminProfile.role === 'super_admin';
    const userPermissions = adminProfile.permissions;

    const main = allNavItems.filter(item => 
        isSuper || (userPermissions && item.requiredPermission.includes(userPermissions))
    );
    
    const admin = adminNavItems.filter(item => {
        if (item.href === '/cmadmin/admins' || item.href === '/cmadmin/sql-editor') {
            return isSuper;
        }
        return isSuper || (userPermissions && item.requiredPermission.includes(userPermissions));
    });

    return { main, admin };
  };

  const { main: visibleNavItems, admin: visibleAdminNavItems } = getVisibleNavItems();


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <LoadingScreen />;
  }
  
  const getRoleDisplayName = () => {
    if (adminProfile?.role === 'super_admin') return 'Super Admin';
    if (adminProfile?.permissions === 'full_access') return 'Full Access Admin';
    if (adminProfile?.permissions === 'view_only') return 'View Only Admin';
    return 'Admin';
  }

  return (
    <div className="admin-panel">
       <aside className={cn(
        "bg-card border-r flex flex-col transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-64 p-4" : "w-0 p-0 overflow-hidden"
      )}>
        <div className="flex justify-between items-center mb-8">
            <div className={cn("flex items-center gap-2 transition-opacity", !isSidebarOpen && "opacity-0")}>
                <Image 
                    src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="rounded-full"
                />
                <h1 className="text-xl font-bold text-primary whitespace-nowrap">Admin Panel</h1>
            </div>
        </div>
        <nav className={cn("flex-grow space-y-2 transition-opacity overflow-y-auto", !isSidebarOpen && "opacity-0")}>
          {visibleNavItems.map(item => (
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
            <Separator className="my-4" />
            {visibleAdminNavItems.map(item => (
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
      </aside>
      
      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
        <header className="bg-card shadow-sm border-b">
            <div className="p-4 flex justify-between items-center gap-4">
                 <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                 </Button>
                 <div className="flex-grow"></div>
                 {user && (
                    <div className="text-sm text-right">
                        <p className="font-semibold">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{getRoleDisplayName()}</p>
                    </div>
                 )}
                 <Button
                    variant='ghost'
                    size='icon'
                    className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
            </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
            {children}
        </main>
      </div>
    </div>
  );
}

    