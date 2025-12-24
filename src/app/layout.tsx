'use client';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from '@/context/currency-context';
import { BottomNav } from '@/components/bottom-nav';
import { usePathname } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { SplashScreen } from '@/components/splash-screen';

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/update-password'].includes(pathname);
  const isAdminPage = pathname.startsWith('/cmadmin');
  
  if (isAuthPage || isAdminPage) {
    return <>{children}</>;
  }

  return (
    <main className="max-w-md mx-auto bg-background min-h-screen relative pb-24 shadow-2xl">
        {children}
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
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
