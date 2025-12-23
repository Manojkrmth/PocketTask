'use client';

// =================================================================
// SIGNUP PAGE CODE (for your new project)
// Path: app/signup/page.tsx
// =================================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';


export default function SignupPage() {
  // State variables to hold form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reenteredPassword, setReenteredPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // State for loading and error messages
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // This effect checks if a referral code is present in the URL (e.g., /signup?ref=CM123)
  // and pre-fills the input field.
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }
  }, [searchParams]);
  
  // This function handles the signup process when the form is submitted.
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client-side validation
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
    
    try {
      // 1. Create the user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Since you're using Supabase, you would make an API call here to save user data.
      // For example:
      // await supabase.from('users').insert([{ 
      //   id: user.uid, 
      //   email: user.email, 
      //   full_name: fullName, 
      //   mobile: mobile 
      // }]);
      
      console.log('User created in Firebase. Now you should save user data to Supabase.');
      
      // 3. Redirect to the main dashboard on successful signup
      router.push('/');

    } catch (error: any) {
        console.error("Auth error:", error);
        const errorCode = error.code;
        let errorMessage = "An unexpected error occurred.";

        // Provide user-friendly error messages
        if (errorCode === 'auth/email-already-in-use') {
            errorMessage = 'This email address is already in use.';
        } else if (errorCode === 'auth/weak-password') {
            errorMessage = 'The password is too weak. Please use at least 8 characters.';
        } else {
            errorMessage = error.message;
        }
        setError(errorMessage);
    } finally