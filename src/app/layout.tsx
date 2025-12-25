
'use client';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from '@/context/currency-context';
import { BottomNav } from '@/components/bottom-nav';
import { usePathname } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { AnnouncementPopup } from '@/components/announcement-popup';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/loading-screen';
import MaintenancePage from './maintenance/page';


function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isUnderConstruction, setIsUnderConstruction] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAdminPage = pathname.startsWith('/cmadmin');
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/update-password', '/blocked'].includes(pathname);
  
  useEffect(() => {
    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from('settings')
            .select('settings_data->isUnderConstruction')
            .eq('id', 1)
            .single();
        
        if (!error && data) {
            setIsUnderConstruction((data as any).isUnderConstruction || false);
        }
        setLoading(false);
    };
    
    // Only check settings if it's not an admin or auth page
    if (!isAdminPage && !isAuthPage) {
        fetchSettings();
    } else {
        setLoading(false);
    }
  }, [isAdminPage, isAuthPage]);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (isAuthPage || isAdminPage) {
    return <>{children}</>;
  }

  return (
    <main className="max-w-md mx-auto bg-background min-h-screen relative pb-24 shadow-2xl">
        {isUnderConstruction ? <MaintenancePage /> : children}
        {!isUnderConstruction && (
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
        <link rel="icon" href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg" type="image/jpeg" sizes="any" />
         <link rel="apple-touch-icon" href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg" />
      </head>
      <body className="font-body antialiased bg-neutral-100">
        <CurrencyProvider>
          {showSplash ? <SplashScreen /> : <Suspense><LayoutWrapper>{children}</LayoutWrapper></Suspense>}
        </CurrencyProvider>
        <Toaster />
      </body>
    </html>
  );
}
