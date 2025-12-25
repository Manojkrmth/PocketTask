
'use client';

import { HardHat, Server, Code } from 'lucide-react';

function DeveloperWorkingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Desk */}
      <path d="M2 16h20" />
      <path d="M4 20h2" />
      <path d="M18 20h2" />

      {/* Chair */}
      <path d="M14 13a2 2 0 10-4 0v3h4v-3z" />
      <path d="M12 16v4" />
      <path d="M10 20h4" />

      {/* Person */}
      <circle cx="12" cy="7" r="3" />
      <path d="M12 10v3" />
      
      {/* Laptop */}
      <path d="M7 12h-4a1 1 0 00-1 1v3a1 1 0 001 1h16a1 1 0 001-1v-3a1 1 0 00-1-1h-4" />
      <path d="M8 12l-2 4" />
      <path d="M16 12l2 4" />
    </svg>
  );
}


export default function MaintenancePage() {
  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6 text-center overflow-hidden">
      
      <div className="relative mb-6">
        <div className="absolute -inset-8 bg-primary/10 rounded-full animate-pulse-slow"></div>
        <div className="relative p-6 bg-primary/20 rounded-full backdrop-blur-sm border border-primary/30">
          <DeveloperWorkingIcon className="w-24 h-24 text-primary animate-tilt" />
        </div>
      </div>
      
      <h1 className="text-4xl font-bold text-primary animate-highlight bg-gradient-to-r from-primary via-white to-primary">
        We'll be back soon!
      </h1>
      
      <p className="text-muted-foreground max-w-sm text-neutral-300">
        Our app is currently undergoing scheduled maintenance. We are working hard to improve your experience and will be back online shortly. Thank you for your patience!
      </p>

      <div className="mt-6 flex items-center justify-center gap-6 text-neutral-400">
          <div className="flex items-center gap-2 animate-in fade-in-0 slide-in-from-bottom-4 delay-300 duration-500">
            <HardHat className="h-5 w-5 text-primary/70" />
            <span className="text-sm">Upgrades</span>
          </div>
           <div className="flex items-center gap-2 animate-in fade-in-0 slide-in-from-bottom-4 delay-500 duration-500">
            <Server className="h-5 w-5 text-primary/70" />
            <span className="text-sm">Maintenance</span>
          </div>
           <div className="flex items-center gap-2 animate-in fade-in-0 slide-in-from-bottom-4 delay-700 duration-500">
            <Code className="h-5 w-5 text-primary/70" />
            <span className="text-sm">New Features</span>
          </div>
      </div>

    </div>
  );
}
