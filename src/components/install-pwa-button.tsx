
'use client';

// =================================================================
// INSTALL PWA BUTTON CODE (for your new project)
// Path: components/install-pwa-button.tsx
// =================================================================
// Description:
// This component provides a button that allows users to install the
// Progressive Web App (PWA) on their device (mobile or desktop).
//
// How it works:
// 1. It listens for the 'beforeinstallprompt' event, which browsers fire when a PWA is installable.
// 2. If the event is caught, it shows the "Install App" button.
// 3. When the button is clicked, it shows the installation prompt to the user.
// 4. If the browser doesn't support the installation prompt directly (like Safari on iOS),
//    it shows a dialog with manual instructions on how to "Add to Home Screen".
// 5. It also detects if the app is already running as a standalone PWA and hides the button.
//
// Dependencies:
// - lucide-react (for icons)
// - @/components/ui/button
// - @/components/ui/dialog
// - @/hooks/use-toast

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, MoreVertical, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      toast({
        title: "Installation Complete!",
        description: "The app has been successfully installed.",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsAppInstalled(true);
      }
    } else {
      // Fallback for browsers that don't support the prompt (e.g., Safari on iOS)
      setShowInstructions(true);
    }
  };

  if (isAppInstalled) {
    return null;
  }
  
  return (
    <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
       <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground border border-white/50 rounded-md"
        onClick={handleInstallClick}
      >
        <Download className="h-4 w-4" />
        <span>Install App</span>
      </Button>

      <DialogContent className="max-w-sm bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>How to Install App</DialogTitle>
          <DialogDescription className="text-gray-500">
            You can add this app to your home screen for a better experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm text-gray-800">
          <div>
            <strong className="font-semibold">For Android (Chrome):</strong>
            <ol className="list-decimal list-inside space-y-2 mt-2 pl-2">
              <li>Tap the <MoreVertical className="inline-block h-4 w-4" /> menu button.</li>
              <li>Select <strong>'Install app'</strong> or <strong>'Add to Home screen'</strong>.</li>
              <li>Follow the on-screen instructions.</li>
            </ol>
          </div>
           <div>
            <strong className="font-semibold">For iOS (Safari):</strong>
             <ol className="list-decimal list-inside space-y-2 mt-2 pl-2">
              <li>Tap the <Share className="inline-block h-4 w-4" /> Share button.</li>
              <li>Scroll down and select <strong>'Add to Home Screen'</strong>.</li>
              <li>Tap 'Add' in the top right corner.</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
