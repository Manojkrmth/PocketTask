
'use client';

import { Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-6 text-white text-center">
      <div className="relative mb-8 p-1 rounded-full animate-border-spin border-4 border-transparent">
        <div className="w-48 h-48 bg-gray-800/50 rounded-full p-2">
            <svg
            className="w-full h-full text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            >
            <defs>
                <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
                </filter>
            </defs>
            
            {/* Desk */}
            <path d="M10 160 H190 L180 175 H20 Z" fill="#4a5568"/>
            
            {/* Laptop Base */}
            <path d="M40 160 L50 120 H150 L160 160 Z" fill="#718096"/>
            
            {/* Laptop Screen */}
            <rect x="55" y="60" width="90" height="60" rx="5" fill="#2d3748"/>
            <rect x="60" y="65" width="80" height="50" rx="2" fill="#4fd1c5" className="animate-screen-glow" />

            {/* Operator */}
            <g className="animate-head-bob">
                <circle cx="100" cy="80" r="15" fill="#a0aec0" />
            </g>
            <path d="M100 95 C 80 100, 80 130, 90 140 H110 C 120 130, 120 100, 100 95 Z" fill="#a0aec0" />
            </svg>
        </div>
      </div>
      <h1 className="text-4xl font-bold mb-3 tracking-tight">System Maintenance</h1>
      <p className="text-lg text-slate-300 max-w-md mb-8">
        We're making some improvements and will be back online shortly.
      </p>
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Clock className="w-4 h-4" />
        <span>Thank you for your patience!</span>
      </div>
    </div>
  );
}
