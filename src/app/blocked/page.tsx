
'use client';

import { XCircle } from 'lucide-react';

export default function BlockedPage() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="max-w-sm w-full mx-auto bg-background rounded-xl p-6 sm:p-8 shadow-2xl text-center animate-in fade-in-0 zoom-in-95">
        <XCircle className="w-16 h-16 sm:w-20 sm:h-20 text-destructive mx-auto mb-4" />
        <h1 className="text-xl sm:text-2xl font-bold">Account Blocked</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Your account has been blocked by an administrator due to a policy violation or suspicious activity.
        </p>
        <p className="text-muted-foreground mt-6 text-xs">
          Please contact support for further assistance.
        </p>
        <a
          href="mailto:manojmukhiyamth@gmail.com"
          className="mt-1 text-primary font-semibold hover:underline text-sm break-all"
        >
          manojmukhiyamth@gmail.com
        </a>
      </div>
    </div>
  );
}
