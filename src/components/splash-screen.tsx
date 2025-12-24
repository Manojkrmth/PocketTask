'use client';

import { cn } from "@/lib/utils";
import Image from "next/image";

export function SplashScreen() {
    return (
      <div className={cn(
          "fixed inset-0 z-[200] flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-orange-400 via-white to-green-500 animate-splash-bg",
          "text-foreground"
        )}>
        
        <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-white/50 blur-2xl animate-splash-pulse"></div>
            <Image 
                 src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg"
                 alt="App Logo"
                 width={120}
                 height={120}
                 className="rounded-full shadow-2xl animate-splash-pulse relative"
                 priority
            />
        </div>

        <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-800 drop-shadow-sm">CookieMail</h1>
            <p className="animate-color-cycle text-lg font-semibold">Made with ❤️ in Bharat</p>
        </div>
      </div>
    );
}
