'use client';

import Image from 'next/image';
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';

export function LoadingScreen() {
    return (
      <div className={cn(
          "flex min-h-screen flex-col items-center justify-center gap-8",
          "bg-gradient-to-br from-gray-900 via-gray-800 to-neutral-900",
          "text-white"
        )}>
        <div className="relative h-28 w-28">
            <div className="absolute inset-0 animate-tricolor-spin rounded-full bg-[conic-gradient(from_90deg_at_50%_50%,#FF9933_0%,#FFFFFF_33%,#138808_66%,#FF9933_100%)]" />
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-neutral-900/90 backdrop-blur-sm">
                <Image 
                    src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg"
                    alt="AuthNexus Logo"
                    width={80}
                    height={80}
                    className="rounded-full animate-pulse"
                    priority
                />
            </div>
        </div>
        <div className="flex items-center gap-3 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-lg font-medium text-neutral-300">Loading App...</p>
        </div>
      </div>
    );
}
