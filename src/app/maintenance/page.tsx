
'use client';

import { Wrench, Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6 text-white text-center">
      <div className="relative mb-8">
        <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl animate-pulse"></div>
        <div className="relative p-6 bg-slate-700/50 rounded-full shadow-lg border border-slate-600">
          <Wrench className="w-16 h-16 text-primary animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      <h1 className="text-4xl font-bold mb-3 tracking-tight">Under Maintenance</h1>
      <p className="text-lg text-slate-300 max-w-md mb-8">
        We are currently improving our services for you. The app will be back online shortly.
      </p>
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Clock className="w-4 h-4" />
        <span>Thank you for your patience!</span>
      </div>
    </div>
  );
}
