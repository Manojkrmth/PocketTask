
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareReferralDialogProps {
  referralCode?: string;
  children: React.ReactNode;
}

export function ShareReferralDialog({ referralCode, children }: ShareReferralDialogProps) {
  const { toast } = useToast();
  const referralLink = referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : '';

  const copyToClipboard = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
    }
  };

  const shareLink = () => {
    if (navigator.share && referralLink) {
      navigator.share({
        title: 'Join me on AuthNexus!',
        text: `Join me on AuthNexus and start earning! Use my referral code: ${referralCode}`,
        url: referralLink,
      }).catch(error => console.error('Error sharing', error));
    } else {
        copyToClipboard();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Referral Link</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input id="link" value={referralLink} readOnly />
          <Button type="button" size="icon" onClick={copyToClipboard} variant="outline">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
            <Button type="button" onClick={shareLink} className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                Share Now
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
