
'use client';

import { HardHat } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-4 bg-background text-foreground p-4 text-center">
      <div className="relative mb-4">
        <div className="absolute -inset-4 bg-primary/20 rounded-full animate-pulse"></div>
        <div className="relative p-6 bg-primary rounded-full">
          <HardHat className="w-16 h-16 text-primary-foreground" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-primary">Under Construction</h1>
      <p className="text-muted-foreground max-w-sm">
        Our app is currently undergoing scheduled maintenance. We are working hard to improve your experience and will be back online shortly. Thank you for your patience!
      </p>
    </div>
  );
}
