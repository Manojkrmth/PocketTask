'use client';

import Image from 'next/image';

export function LoadingScreen() {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative h-20 w-20">
                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75"></div>
                <Image 
                    src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjQeXPPDoYHtSI3CkEycSr99eEzj5eNNnXZkkzetdCk8G5qhltxgm9vXYe4O2nRb8eJIkTRvSW7WljNX1U4sgGJopouCKxTr_u6Vn6eG5mmZrFt9Fw2R9L_VgCzk4J3BLhQu9UG7uAuGy3INawPoZlC1j11YSD0TSRCnUglyTByJM2ajI_Ce8O2t1d9Ahk/s320/photo_2025-11-21_17-20-41.jpg"
                    alt="AuthNexus Logo"
                    width={80}
                    height={80}
                    className="relative rounded-full animate-pulse"
                />
            </div>
          <h2 className="text-xl font-bold text-foreground">Securing your session...</h2>
          <p className="text-primary/70 text-sm">Please wait a moment.</p>
        </div>
      </div>
    );
}
