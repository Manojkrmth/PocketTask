'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/loading-screen';
import { GoogleIcon } from '@/components/icons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/');
      } else {
        setAuthLoading(false);
      }
    });

    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            router.push('/');
        } else {
            setAuthLoading(false);
        }
    };
    checkSession();

    return () => subscription.unsubscribe();
  }, [router]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      setError(error.message || 'An unknown login error occurred.');
    } else {
      // The onAuthStateChange listener will handle the redirect.
    }
    
    setIsLoading(false);
  };
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
       options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    setIsLoading(false);
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
     <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-neutral-900 p-6 text-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <Image 
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg"
                alt="AuthNexus Logo"
                width={80}
                height={80}
                className="mx-auto rounded-full mb-4 animate-pulse"
            />
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-neutral-300">Enter your credentials to access your account</p>
        </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-neutral-300">Password</Label>
                   <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              <Input 
                id="password" 
                type="password"
                placeholder="8+ character password"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-primary"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base h-12" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>
          
           <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-neutral-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-neutral-400">
                  Or continue with
                  </span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-12 bg-transparent border-neutral-700 hover:bg-neutral-800 text-white" onClick={handleGoogleLogin} disabled={isLoading}>
                <GoogleIcon className="mr-2 h-5 w-5"/>
                Continue with Google
            </Button>

        <p className="mt-8 text-center text-sm text-neutral-400">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
          
        <div className="mt-8 w-full text-center">
            <p className="text-sm text-muted-foreground">
                <span className="animate-color-cycle inline-block">Made with <span className="text-red-500">❤️</span> in Bharat</span>
            </p>
        </div>
      </div>
    </div>
  );
}
