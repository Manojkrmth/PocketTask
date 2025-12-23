'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function AddReferralDialog({ userId, onFinished }: { userId: string, onFinished: () => void }) {
    const [open, setOpen] = useState(false);
    const [referralCode, setReferralCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!referralCode.trim()) {
            setError('Please enter a referral code.');
            return;
        }
        setIsLoading(true);
        setError(null);

        // Check if the referral code exists
        const { data: referrer, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('referral_code', referralCode.trim())
            .single();

        if (checkError || !referrer) {
            setError('Invalid referral code. Please check and try again.');
            setIsLoading(false);
            return;
        }
        
        if (referrer.id === userId) {
            setError('You cannot use your own referral code.');
            setIsLoading(false);
            return;
        }

        // Update the current user's 'referred_by' field
        const { error: updateError } = await supabase
            .from('users')
            .update({ referred_by: referralCode.trim() })
            .eq('id', userId);

        if (updateError) {
            console.error(updateError);
            setError('Failed to apply referral code. Please try again.');
            setIsLoading(false);
        } else {
            toast({
                title: 'Success!',
                description: 'Referral code has been applied.',
            });
            setIsLoading(false);
            setOpen(false);
            onFinished(); // Callback to refresh the page or state
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add Code</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm bg-white text-gray-900">
                <DialogHeader>
                    <DialogTitle>Add Referral Code</DialogTitle>
                    <DialogDescription>
                        Enter the code of the friend who referred you. This can only be done once.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="referral-code">Referral Code</Label>
                    <Input 
                        id="referral-code" 
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="e.g., CM123456"
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Apply Code
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
