'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LoadingScreen } from '@/components/loading-screen';
import { Button } from '@/components/ui/button';
import { LogOut, Mail } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // Auth state is not yet determined or user is not logged in, show loading.
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
              <Image 
                  src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg"
                  alt="AuthNexus Logo"
                  width={32}
                  height={32}
                  className="rounded-full"
              />
              <h1 className="text-xl font-bold text-foreground">AuthNexus</h1>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
          </Button>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl text-center">
            <Mail className="mx-auto h-16 w-16 text-primary mb-6"/>
            <h2 className="text-4xl font-bold mb-2">Welcome Back!</h2>
            <p className="text-lg text-muted-foreground mb-8">
                You are logged in as <span className="font-medium text-primary">{user.email}</span>.
            </p>
            <p className="text-muted-foreground">
                This is your dashboard. You can now access all the features of AuthNexus.
            </p>
        </div>
      </main>
    </div>
  );
}
