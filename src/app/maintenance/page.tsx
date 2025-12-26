
'use client';

import { Wrench, Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100 p-6 text-gray-800 text-center">
      <div className="p-6 bg-white/50 rounded-full mb-6 shadow-lg backdrop-blur-md">
        <Wrench className="w-16 h-16 text-blue-600" />
      </div>
      <h1 className="text-4xl font-bold mb-3">Under Maintenance</h1>
      <p className="text-lg text-gray-600 max-w-md mb-8">
        Our app is currently undergoing scheduled maintenance to improve your experience. We'll be back online shortly. Thank you for your patience!
      </p>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>We will be back soon!</span>
      </div>
    </div>
  );
}
