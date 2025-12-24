'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function AddReferralDialog({ onFinished }: { onFinished?: () => void }) {
    const [referralCode, setReferralCode] = useState('');
    const [isVerifying, startVerifying] = useTransition();
    const [isConfirming, startConfirming] = useTransition();
    const [foundUser, setFoundUser] = useState<{ id: string, email: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        if (isOpen) {
            const getUser = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUser(user);
            };
            getUser();
        }
    }, [isOpen]);

    const handleVerify = async () => {
        if (!referralCode) {
            setError("Please enter a referral code.");
            return;
        }
        startVerifying(async () => {
            setError(null);
            setFoundUser(null);
            
            const upperCaseCode = referralCode.trim().toUpperCase();

            const { data, error: queryError } = await supabase
                .from('users')
                .select('id, email')
                .eq('referral_code', upperCaseCode)
                .single();
            
            if (queryError || !data) {
                setError('Invalid referral code. Please check and try again.');
            } else {
                if (data.id === currentUser?.id) {
                   setError('You cannot use your own referral code.');
                   return;
                }
                setFoundUser(data);
            }
        });
    }

    const handleConfirm = async () => {
        if (!foundUser || !currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not confirm referral.'})
            return;
        }
        
        startConfirming(async () => {
             const { data, error } = await supabase.rpc('update_referral_and_add_bonus', {
                referee_id: currentUser.id,
                referrer_code: referralCode.trim().toUpperCase()
            });

            if(error || (data && data.status === 'error')) {
                 toast({ variant: 'destructive', title: 'Error', description: error?.message || (data && data.message) });
            } else {
                 toast({ title: 'Success!', description: `Referral applied! You and your friend have received a bonus.` });
                 setIsOpen(false);
                 if (onFinished) {
                    onFinished();
                 }
            }
        });
    }
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // Reset state when closing the dialog
            setFoundUser(null); 
            setError(null); 
            setReferralCode('');
        }
        setIsOpen(open);
    }

    const isLoading = isVerifying || isConfirming;

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="w-full">Add Code</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Referral Code</DialogTitle>
                    <DialogDescription>
                        Enter your friend's referral code to join their team. This can only be done once.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {!foundUser ? (
                        <div className='space-y-2'>
                             <div className="flex items-center gap-2">
                                <Input 
                                    id="referral-code"
                                    placeholder="Enter referral code"
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value)}
                                    disabled={isLoading}
                                />
                                <Button onClick={handleVerify} disabled={isLoading || !referralCode}>
                                    {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Verify
                                </Button>
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>
                    ) : (
                        <Alert>
                            <AlertTitle className="flex items-center gap-2">Confirm Referrer</AlertTitle>
                            <AlertDescription>
                                Is this your referrer? <br />
                                 <span className="font-bold text-lg text-primary">{foundUser.email}</span>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={isLoading}>
                            Cancel
                        </Button>
                    </DialogClose>
                    {foundUser && (
                        <Button type="button" onClick={handleConfirm} disabled={isLoading}>
                            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, Confirm
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
