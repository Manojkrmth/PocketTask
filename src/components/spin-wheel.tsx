'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface WheelSegment {
  text: string;
  color: string;
}

interface SpinWheelProps {
  segments: WheelSegment[];
  isSpinning: boolean;
  onSpinComplete: (selectedSegment: WheelSegment) => void;
}

const RADIUS = 150;
const WHEEL_SIZE = RADIUS * 2;
const TEXT_RADIUS = RADIUS * 0.65;

export function SpinWheel({ segments, isSpinning, onSpinComplete }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const numSegments = segments.length;
  const anglePerSegment = 360 / numSegments;

  const paths = useMemo(() => {
    return segments.map((segment, i) => {
      const startAngle = i * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;
      
      const start = {
        x: RADIUS + RADIUS * Math.cos(startAngle * Math.PI / 180),
        y: RADIUS + RADIUS * Math.sin(startAngle * Math.PI / 180)
      };
      const end = {
        x: RADIUS + RADIUS * Math.cos(endAngle * Math.PI / 180),
        y: RADIUS + RADIUS * Math.sin(endAngle * Math.PI / 180)
      };
      const largeArcFlag = anglePerSegment <= 180 ? "0" : "1";

      return `M ${RADIUS},${RADIUS} L ${start.x},${start.y} A ${RADIUS},${RADIUS} 0 ${largeArcFlag} 1 ${end.x},${end.y} Z`;
    });
  }, [segments, anglePerSegment]);

  useEffect(() => {
    if (isSpinning) {
      const winningSegmentIndex = Math.floor(Math.random() * numSegments);
      
      const centerOfSegmentAngle = (winningSegmentIndex * anglePerSegment) + (anglePerSegment / 2);
      const pointerAngle = 270; // Pointer is at the top (270 degrees)
      const offsetToCenter = pointerAngle - centerOfSegmentAngle;
      
      const totalRotation = rotation + (360 * 6) + offsetToCenter; // 6 full spins + adjustment

      setRotation(totalRotation);
      onSpinComplete(segments[winningSegmentIndex]);
    }
  }, [isSpinning]);

  return (
    <div className="relative w-[340px] h-[360px] flex items-center justify-center flex-col">
       <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20 drop-shadow-lg">
           <svg width="40" height="50" viewBox="0 0 42 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 52L0.812826 0.25L41.1872 0.250004L21 52Z" fill="#FDD835"/>
           </svg>
        </div>
      <div
        className="relative"
        style={{ width: `${WHEEL_SIZE}px`, height: `${WHEEL_SIZE}px` }}
      >
        <div
          className={cn(
            "w-full h-full rounded-full transition-transform duration-[2000ms] ease-out", // 2 second spin
            "select-none" 
          )}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
            <svg
                width={WHEEL_SIZE}
                height={WHEEL_SIZE}
                viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                className="rounded-full"
            >
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#000" floodOpacity="0.3"/>
                    </filter>
                </defs>
                 <circle cx={RADIUS} cy={RADIUS} r={RADIUS} fill="#fff" filter="url(#shadow)" />

                {segments.map((segment, i) => (
                    <path
                        key={i}
                        d={paths[i]}
                        fill={segment.color}
                    />
                ))}

                {segments.map((_, i) => {
                    const angle = (i * anglePerSegment + anglePerSegment / 2) * Math.PI / 180;
                    const r = RADIUS * 0.95;
                    const x = RADIUS + r * Math.cos(angle);
                    const y = RADIUS + r * Math.sin(angle);
                    return <circle key={i} cx={x} cy={y} r="3" fill="rgba(255,255,255,0.7)" />;
                })}

                {segments.map((segment, i) => {
                    const textAngle = i * anglePerSegment + anglePerSegment / 2;
                    const x = RADIUS + TEXT_RADIUS * Math.cos(textAngle * Math.PI / 180);
                    const y = RADIUS + TEXT_RADIUS * Math.sin(textAngle * Math.PI / 180);
                    
                    return (
                        <text
                            key={`text-${i}`}
                            x={x}
                            y={y}
                            dy="0.35em"
                            textAnchor="middle"
                            fill="white"
                            fontSize="20"
                            fontWeight="bold"
                            transform={`rotate(${textAngle + 90}, ${x}, ${y})`}
                            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}
                        >
                            {segment.text}
                        </text>
                    );
                })}
            </svg>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-red-600 border-4 border-yellow-300 shadow-inner z-10"></div>
      </div>
      <div className="relative w-[200px] h-[60px] -mt-2">
         <svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="standGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#616161', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#212121', stopOpacity: 1}} />
                </linearGradient>
                <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="2" dy="4"/>
                    <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <path d="M0 60 H200 L180 40 H20 L0 60 Z" fill="#424242" />
            <path d="M70 40 L80 10 H120 L130 40 H70 Z" fill="url(#standGradient)" filter="url(#dropShadow)" />
         </svg>
      </div>
    </div>
  );
}
