'use client';

// =================================================================
// "SHARE & EARN" DIALOG CODE (for your new project)
// Path: components/share-referral-dialog.tsx
// =================================================================
// Description:
// Yeh component "Share & Earn" button par click karne par ek popup (dialog)
// kholta hai. Ismein user ka referral code aur link share karne ke liye
// saare options hote hain.
//
// How it works:
// 1.  Yeh `referralCode` ko prop ke roop mein leta hai.
// 2.  Is code ka istemaal karke ek shareable message aur URL banata hai.
// 3.  Dialog ke andar, code aur link ko alag-alag input fields mein dikhata hai.
// 4.  "Copy" button component ka istemaal karke code aur link ko copy karne ki
//     suvidha deta hai.
// 5.  WhatsApp, Telegram, aur native mobile share (Web Share API) ke liye
//     buttons deta hai.
//
// Dependencies:
// - All ShadCN UI components used below (Dialog, Button, Input, etc.)
// - lucide-react (for icons)
// - @/components/icons (for custom icons like WhatsApp)
// - @/hooks/use-toast (for showing "Copied!" messages)

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from './ui/button';
import { CopyButton } from "./copy-button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Share, Link as LinkIcon, Copy } from "lucide-react";
import { WhatsAppIcon, TelegramIcon } from "./icons";
import { useToast } from "@/hooks/use-toast";

export function ShareReferralDialog({ children, referralCode }: { children: React.ReactNode, referralCode?: string }) {
    
    const { toast } = useToast();
    const code = referralCode || '...';
    const shareText = `Join me on AuthNexus! Complete simple tasks, invite your friends, and earn real rewards. Use my code to get started: ${code}`;
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${code}`;
    
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join me on AuthNexus!',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error sharing:', error);
                toast({
                    variant: "destructive",
                    title: "Share Failed",
                    description: "Could not open the share dialog.",
                })
            }
        } else {
            toast({
                variant: "destructive",
                title: "Not Supported",
                description: "Your browser does not support the Web Share API.",
            })
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-sm bg-white text-gray-900">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-lg font-bold">Share & Earn</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Share your code and link with friends to earn referral bonuses.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="referral-code-input" className="font-semibold text-gray-800">Your Referral Code</Label>
                        <div className="flex items-center gap-2">
                            <Input id="referral-code-input" value={code} readOnly className="font-mono text-center text-lg h-12 bg-gray-100 text-gray-800 border-gray-300"/>
                            <CopyButton value={code} className="h-12 w-12 shrink-0 bg-gray-200 text-gray-700 hover:bg-gray-300">
                                <Copy className="h-6 w-6"/>
                            </CopyButton>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="referral-link-input" className="font-semibold text-gray-800">Your Referral Link</Label>
                         <div className="flex items-center gap-2">
                            <Input id="referral-link-input" value={shareUrl} readOnly className="text-xs h-12 bg-gray-100 text-gray-800 border-gray-300"/>
                             <CopyButton value={shareUrl} className="h-12 w-12 shrink-0 bg-gray-200 text-gray-700 hover:bg-gray-300">
                                <LinkIcon className="h-6 w-6"/>
                            </CopyButton>
                        </div>
                    </div>

                    <Separator className="bg-gray-200" />
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <a href={`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 gap-1">
                           <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full text-green-600">
                             <WhatsAppIcon className="h-7 w-7"/>
                           </div>
                           <span className="text-xs text-gray-500">WhatsApp</span>
                        </a>
                        <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 gap-1">
                           <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-full text-blue-600">
                             <TelegramIcon className="h-7 w-7"/>
                           </div>
                            <span className="text-xs text-gray-500">Telegram</span>
                        </a>
                         <button onClick={handleShare} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 gap-1">
                           <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded-full text-gray-600">
                             <Share className="h-6 w-6"/>
                           </div>
                           <span className="text-xs text-gray-500">More</span>
                        </button>
                   </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
