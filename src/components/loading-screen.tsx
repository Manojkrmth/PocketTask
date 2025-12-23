'use client';

import Image from 'next/image';
import { cn } from "@/lib/utils";

export function LoadingScreen() {
    return (
      <div className={cn(
          "flex min-h-screen flex-col items-center justify-center gap-8",
          "bg-gradient-to-b from-orange-400 via-white to-green-400 animate-pulse-background-fast",
          "text-neutral-800"
        )}>
        <div className="relative h-28 w-28">
            <div className="absolute inset-0 animate-tricolor-spin rounded-full bg-[conic-gradient(from_90deg_at_50%_50%,#FF9933_0%,#FFFFFF_33%,#138808_66%,#00008B_83%,#FF9933_100%)]" />
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white/80 backdrop-blur-sm">
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
        <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-3">
                 <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="animate-spin text-blue-900"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ animationDuration: '2s' }}
                >
                    <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                    fill="currentColor"
                    />
                    <path
                    d="M12 6V18M6 12H18M7.75 7.75L16.25 16.25M7.75 16.25L16.25 7.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    />
                </svg>
                <p className="text-lg font-medium text-neutral-800">Loading App...</p>
            </div>
            <p className="text-sm text-neutral-600">Made with <span className="text-red-500">❤️</span> in Bharat</p>
        </div>
      </div>
    );
}
