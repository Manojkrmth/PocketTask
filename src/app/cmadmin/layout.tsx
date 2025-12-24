
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Bell,
  Users,
  ClipboardList,
  Settings,
  Home,
  Menu,
  X,
  User,
  LogOut,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/loading-screen';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const adminNavItems = [
  { href: '/cmadmin', label: 'Dashboard', icon: Home },
  { href: '/cmadmin/users', label: 'Manage Users', icon: Users },
  { href: '/cmadmin/tasks', label: 'Manage Tasks', icon: ClipboardList },
  { href: '/cmadmin/withdrawals', label: 'Withdrawals', icon: Wallet },
  { href: '/cmadmin/settings', label: 'App Settings', icon: Settings },
];

const ADMIN_USER_ID = '7fa62eb6-4e08-4064-ace3-3f6116efa29f';

function AdminSidebar({
  className,
  onLinkClick,
}: {
  className?: string;
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-primary/90 text-primary-foreground',
        className
      )}
    >
      <div className="border-b border-primary/50 p-4">
        <Link href="/cmadmin" className="flex items-center gap-3">
           <Image
              src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg"
              alt="CookieMail Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </Link>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {adminNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-white/20',
              pathname === item.href
                ? 'bg-white/30 text-white font-semibold'
                : 'text-primary-foreground/80'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-primary/50 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 hover:bg-white/20 text-primary-foreground"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = React.useState<SupabaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = React.useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      if (session.user.id !== ADMIN_USER_ID) {
        router.push('/');
        return;
      }
      setUser(session.user);
      setIsAuthLoading(false);
    };
    checkUser();
  }, [router]);

  if (isAuthLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <div className="hidden md:block md:w-64">
        <AdminSidebar />
      </div>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:justify-end sm:px-6">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 sm:max-w-xs">
              <AdminSidebar onLinkClick={() => setIsSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium">
              Welcome, <span className="text-primary">Admin</span>
            </p>
            <Avatar className="h-9 w-9">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
