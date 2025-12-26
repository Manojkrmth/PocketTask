
'use client';

import { Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-6 text-white text-center">
      <div className="relative mb-8 w-40 h-40">
        <svg
          className="w-full h-full text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g className="animate-spin-gear" style={{ transformOrigin: '50% 50%' }}>
            <path
              d="M93.5,61.2l-7.2-4.2c-0.8-2.5-2-4.8-3.5-6.9l4.2-7.2c1.9-3.4,0.9-7.7-2.5-9.6l-8.6-4.9c-3.4-1.9-7.7-0.9-9.6,2.5l-4.2,7.2 c-2.2-1.5-4.6-2.7-7.2-3.5l4.2-7.2c1.9-3.4,0.9-7.7-2.5-9.6L42,2.5c-3.4-1.9-7.7-0.9-9.6,2.5l-4.2,7.2c-2.5,0.8-4.8,2-6.9,3.5 l-7.2-4.2c-3.4-1.9-7.7-0.9-9.6,2.5l-4.9,8.6c-1.9,3.4-0.9,7.7,2.5,9.6l7.2,4.2c0.8,2.5,2,4.8,3.5,6.9l-4.2,7.2 c-1.9,3.4-0.9,7.7,2.5,9.6l8.6,4.9c3.4,1.9,7.7,0.9,9.6-2.5l4.2-7.2c2.2,1.5,4.6,2.7,7.2,3.5l-4.2,7.2c-1.9,3.4-0.9,7.7,2.5,9.6 l8.6,4.9c3.4,1.9,7.7,0.9,9.6-2.5l4.2-7.2c2.5-0.8,4.8-2,6.9-3.5l7.2,4.2c3.4,1.9,7.7,0.9,9.6-2.5l4.9-8.6 C94.4,68.9,95.4,64.6,93.5,61.2z M50,68.8c-10.4,0-18.8-8.4-18.8-18.8s8.4-18.8,18.8-18.8s18.8,8.4,18.8,18.8S60.4,68.8,50,68.8z"
              fill="currentColor"
            />
          </g>
          <g className="animate-swing-wrench" filter="url(#glow)">
            <path
              d="M78.6,21.4c-11.8-11.8-31-11.8-42.8,0L21.4,35.8c-11.8,11.8-11.8,31,0,42.8C27.3,84.5,35.4,88,43.6,88 s16.3-3.5,22.2-9.4l4.6-4.6c1-1,1.6-2.4,1.6-3.8c0-1.4-0.6-2.8-1.6-3.8L59.3,55.3c-2.1-2.1-5.5-2.1-7.6,0l-7,7 c-1,1-2.7,1-3.8,0s-1-2.7,0-3.8l7-7c4.2-4.2,11-4.2,15.2,0l11.1,11.1c1,1,2.7,1,3.8,0c1-1,1-2.7,0-3.8L67.1,47.9 c-6.3-6.3-16.5-6.3-22.8,0L30,62.1c-8.4,8.4-8.4,22,0,30.4c4.2,4.2,9.7,6.3,15.2,6.3s11-2.1,15.2-6.3L74.7,78 c8.4-8.4,8.4-22,0-30.4L63.4,36.4c-2.1-2.1-5.5-2.1-7.6,0s-2.1,5.5,0,7.6l11.3,11.3c1,1,1,2.7,0,3.8c-1,1-2.7,1-3.8,0 L62,47.8c-4.2-4.2-11-4.2-15.2,0L32.5,62.1c-6.3,6.3-6.3,16.5,0,22.8c3.1,3.1,7.2,4.7,11.4,4.7s8.3-1.6,11.4-4.7L69.6,70.7 c6.3-6.3,6.3-16.5,0-22.8L59.3,37.6c-4.2-4.2-11-4.2-15.2,0s-4.2,11,0,15.2l1.3,1.3c1,1,2.7,1,3.8,0c1-1,1-2.7,0-3.8l-1.3-1.3 c-2.1-2.1-2.1-5.5,0-7.6c2.1-2.1,5.5-2.1,7.6,0l10.3,10.3C80.7,51.8,80.7,55.2,78.6,57.3z"
              fill="#F5F5F5"
              stroke="#BDBDBD"
              strokeWidth="2"
            />
          </g>
        </svg>
      </div>
      <h1 className="text-4xl font-bold mb-3 tracking-tight">Site Under Construction</h1>
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
