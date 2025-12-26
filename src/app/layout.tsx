
'use client';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from '@/context/currency-context';
import { BottomNav } from '@/components/bottom-nav';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { AnnouncementPopup } from '@/components/announcement-popup';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/loading-screen';

const ADMIN_USER_IDS = [
    '7fa62eb6-4e08-4064-ace3-3f6116efa29f', // Original Super Admin
    '98cda2fc-f09d-4840-9f47-ec0c749a6bbd'  // New Super Admin (manojmukhiyamth@gmail.com)
];

function MaintenanceModeHandler({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkMaintenance = async () => {
            const { data: settings } = await supabase
                .from('settings')
                .select('is_maintenance_mode_enabled')
                .eq('id', 1)
                .single();

            const maintenanceEnabled = settings?.is_maintenance_mode_enabled || false;
            
            const { data: { session } } = await supabase.auth.getSession();
            const isAdmin = session?.user && ADMIN_USER_IDS.includes(session.user.id);
            
            setIsAuthorized(isAdmin);

            if (maintenanceEnabled && !isAdmin) {
                setIsMaintenance(true);
                 if (pathname !== '/maintenance') {
                    router.replace('/maintenance');
                }
            }
            setIsLoading(false);
        };
        checkMaintenance();
    }, [pathname, router]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (isMaintenance && pathname !== '/maintenance') {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}


function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/cmadmin');
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/update-password', '/blocked', '/maintenance'].includes(pathname);

  return (
    <main className={cn(!isAdminPage && "max-w-md mx-auto bg-background min-h-screen relative pb-24 shadow-2xl")}>
        {children}
        {!isAdminPage && !isAuthPage && (
            <>
                <Suspense fallback={null}>
                  <BottomNav />
                </Suspense>
                <Suspense fallback={null}>
                  <AnnouncementPopup />
                </Suspense>
            </>
        )}
    </main>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg" type="image/jpeg" sizes="any" />
         <link rel="apple-touch-icon" href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg" />
      </head>
      <body className="font-body antialiased bg-neutral-100">
        <CurrencyProvider>
          {showSplash ? <SplashScreen /> : <Suspense><MaintenanceModeHandler><LayoutWrapper>{children}</LayoutWrapper></MaintenanceModeHandler></Suspense>}
        </CurrencyProvider>
        <Toaster />
      </body>
    </html>
  );
}
