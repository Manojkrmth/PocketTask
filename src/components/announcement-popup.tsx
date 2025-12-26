
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/supabase';

interface PopupNoticeSettings {
    isEnabled: boolean;
    displayType: 'text' | 'image';
    text: string | null;
    imageUrl: string | null;
    redirectLink: string | null;
}

export function AnnouncementPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState<PopupNoticeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from('settings')
            .select('popup_notice_is_enabled, popup_notice_display_type, popup_notice_text, popup_notice_image_url, popup_notice_redirect_link')
            .eq('id', 1)
            .single();

        if (!error && data) {
            setNotice({
                isEnabled: data.popup_notice_is_enabled,
                displayType: data.popup_notice_display_type,
                text: data.popup_notice_text,
                imageUrl: data.popup_notice_image_url,
                redirectLink: data.popup_notice_redirect_link
            });
        }
        setIsLoading(false);
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isLoading || !notice?.isEnabled) return;

    const hasSeenPopup = sessionStorage.getItem("hasSeenPopup");
    if (!hasSeenPopup) {
       const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem("hasSeenPopup", "true");
      }, 2500); 
      
      return () => clearTimeout(timer);
    }
  }, [notice, isLoading]);

  if (isLoading || !notice) {
    return null;
  }
  
  const shouldShowPopup = isOpen && notice?.isEnabled;

  if (!shouldShowPopup) {
      return null;
  }
  
  const showImage = notice.displayType === 'image' && notice.imageUrl;
  const showText = notice.displayType === 'text' && notice.text;

  // Fallback content if nothing is configured
  const fallbackContent = {
    text: "BIG SALE! 50% OFF!",
    styles: {
      container: "bg-gradient-to-br from-red-500 to-orange-500",
      text: "text-white font-black text-5xl tracking-tighter",
    }
  };

  if (!showImage && !showText) {
    return null; 
  }

  const handleRedirect = () => {
    if (notice.redirectLink) {
      window.open(notice.redirectLink, '_blank');
    }
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm w-full p-0 border-0 rounded-xl overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Promotional Offer</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>

          <div className="flex items-center justify-center aspect-square">
            {showImage ? (
                 <Image
                    src={notice.imageUrl!}
                    alt={notice.text || "Promotional Ad"}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className={cn("p-8 text-center", fallbackContent.styles.container, fallbackContent.styles.text)}>
                    {notice.text || fallbackContent.text}
                </div>
            )}
          </div>
        </div>
        {(notice.redirectLink) && (
          <div className="p-4 pt-2">
            <Button className="w-full" onClick={handleRedirect}>
              Learn More
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
