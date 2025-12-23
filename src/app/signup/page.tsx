'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';


export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reenteredPassword, setReenteredPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, [searchParams]);
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== reenteredPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (mobile.trim().length !== 10) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }
    
    setIsLoading(true);
    
    let user;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      
      const { data: supabaseData, error: supabaseError } = await supabase.from('users').insert({ 
        // id: user.uid, // This was causing the error
        firebase_uid: user.uid, // Correct: Use the new text column
        email: user.email, 
        full_name: fullName, 
        mobile: mobile,
        referral_code: `CM${user.uid.substring(0, 6).toUpperCase()}`,
        referred_by: referralCode || null,
        balance_available: 0,
        balance_hold: 0,
        status: 'Active',
      }).select();

      if (supabaseError) {
        throw new Error(`Supabase insert error: ${supabaseError.message}`);
      }
      
      console.log('User created in Firebase and data saved to Supabase:', supabaseData);
      
      router.push('/');

    } catch (error: any) {
        console.error("Signup error:", error);

        // If Supabase insert fails, delete the Firebase user to prevent orphaned accounts
        if (auth.currentUser) {
           try {
                await deleteUser(auth.currentUser);
                console.log("Cleaned up Firebase user due to an error during signup process.");
           } catch (deleteError) {
                console.error("Failed to clean up Firebase user:", deleteError);
           }
        }

        const errorCode = error.code;
        let errorMessage = "An unexpected error occurred. Please try again.";

        if (errorCode === 'auth/email-already-in-use') {
            errorMessage = 'This email address is already in use.';
        } else if (errorCode === 'auth/weak-password') {
            errorMessage = 'The password is too weak. Please use at least 8 characters.';
        } else if (error.message.includes('Supabase')) {
            errorMessage = `Could not save user profile. ${error.message}`;
        }
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="text-neutral-300">Join our community!</p>
        </div>
        
          <form onSubmit={handleSignup} className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="fullName" className="text-neutral-300">Full Name</Label>
              <Input id="fullName" type="text" placeholder="e.g. Radhe Shyam" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-primary" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="mobile" className="text-neutral-300">Mobile Number (10 digits)</Label>
              <Input id="mobile" type="tel" placeholder="e.g. 9876543210" required value={mobile} onChange={(e) => setMobile(e.target.value)} className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-primary" maxLength={10} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">Email</Label>
              <Input id="email" type="email" placeholder="user@gmail.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-primary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-300">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ character password" className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-primary" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="reenter-password" className="text-neutral-300">Re-enter Password</Label>
              <Input id="reenter-password" type="password" required value={reenteredPassword} onChange={(e) => setReenteredPassword(e.target.value)} placeholder="Re-enter your password" className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-primary" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="referral-code" className="text-neutral-300">Referral Code (Optional)</Label>
              <Input id="referral-code" type="text" placeholder="e.g., CM123456" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-primary" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base h-12" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

        <p className="mt-8 w-full text-center text-sm text-neutral-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
      </div>
    </div>
  );
}
