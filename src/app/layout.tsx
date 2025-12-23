'use client';
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CurrencyProvider } from '@/context/currency-context';
import { BottomNav } from '@/components/bottom-nav';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/update-password'].includes(pathname);
  
  return (
    <>
      {children}
      {!isAuthPage && (
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      )}
    </>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-neutral-100">
        <CurrencyProvider>
          <main className="max-w-md mx-auto bg-background min-h-screen relative pb-24 shadow-2xl">
            <Suspense fallback={children}>
              <NavWrapper>
                {children}
              </NavWrapper>
            </Suspense>
          </main>
        </CurrencyProvider>
        <Toaster />
      </body>
    </html>
  );
}
