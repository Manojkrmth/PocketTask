'use client';

import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/loading-screen";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SUPER_ADMINS = [
  'manojmukhiyamth@gmail.com',
  'nishkrmth2004@gmail.com',
  'anishamukhiya2004@gmail.com'
];

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
            <Button asChild variant="link" className="mt-6">
                <Link href="/">Go to Home</Link>
            </Button>
        </div>
    )
}

export default function CmAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      if (!SUPER_ADMINS.includes(session.user.email ?? '')) {
         setUser(null);
      } else {
         setUser(session.user);
      }

      setLoading(false);
    };
    checkUser();
  }, [router]);
  
  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AccessDenied />;
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <AdminSidebar />
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b md:justify-end">
            <SidebarTrigger className="md:hidden" />
            <p className="font-bold text-lg md:hidden">Admin Panel</p>
            <Button variant="outline" size="sm">Logout</Button>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
