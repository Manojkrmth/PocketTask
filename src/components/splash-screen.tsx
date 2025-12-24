'use client';

import { cn } from "@/lib/utils";

export function SplashScreen() {
    return (
      <div className={cn(
          "fixed inset-0 z-[200] flex min-h-screen flex-col items-center justify-center gap-4 bg-background",
          "text-foreground"
        )}>
        <div className="flex items-center gap-3">
             <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="animate-spin text-primary"
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
            <p className="text-lg font-medium">Loading App...</p>
        </div>
      </div>
    );
}
