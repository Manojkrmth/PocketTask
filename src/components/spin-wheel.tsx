'use client';

import React, { useState, useEffect } from 'react';
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

const RADIUS = 150; // Wheel radius
const TEXT_RADIUS = RADIUS * 0.7; // Radius for text placement

export function SpinWheel({ segments, isSpinning, onSpinComplete }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const numSegments = segments.length;
  const anglePerSegment = 360 / numSegments;

  useEffect(() => {
    if (isSpinning) {
      const winningSegmentIndex = Math.floor(Math.random() * numSegments);
      
      const randomOffset = (Math.random() * 0.8 + 0.1) * anglePerSegment;
      
      const targetRotation = (360 * 5) + (360 - (winningSegmentIndex * anglePerSegment)) - randomOffset;
      
      setRotation(prev => prev + targetRotation);

      setTimeout(() => {
        onSpinComplete(segments[winningSegmentIndex]);
      }, 5000); // Must match animation duration
    }
  }, [isSpinning, numSegments, segments, anglePerSegment, onSpinComplete]);

  return (
    <div className="relative w-[320px] h-[320px] flex items-center justify-center">
      
      {/* Stand */}
      <div className="absolute bottom-[-20px] w-32 h-10 bg-red-800 rounded-t-lg shadow-lg z-0"></div>
      <div className="absolute bottom-[-30px] w-40 h-4 bg-red-900 rounded-sm shadow-xl z-0"></div>

      {/* Pointer */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2.5 w-0 h-0 
        border-l-[18px] border-l-transparent
        border-r-[18px] border-r-transparent
        border-t-[35px] border-t-yellow-400 
        drop-shadow-lg z-20 rounded-t-full">
      </div>
       <div className="absolute top-[8px] left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-200 z-20"></div>

      {/* The Wheel */}
      <div
        className={cn(
          "relative w-full h-full rounded-full transition-transform duration-[5000ms] ease-out",
          "select-none flex items-center justify-center",
          "bg-red-700 p-2 shadow-2xl" 
        )}
      >
        <div
            className="relative w-full h-full rounded-full"
            style={{ 
                transform: `rotate(${rotation}deg)`,
                background: `conic-gradient(from ${-anglePerSegment/2}deg, ${segments.map((s, i) => 
                    `${s.color} 0, ${s.color} ${anglePerSegment}deg, white ${anglePerSegment}deg, white ${anglePerSegment + 0.5}deg`
                ).join(', ')})`,
            }}
        >
             {/* Decorative lights */}
            {Array.from({ length: numSegments }).map((_, index) => (
                <div
                    key={`light-${index}`}
                    className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-300 rounded-full shadow-md"
                    style={{
                        transform: `rotate(${index * anglePerSegment}deg) translate(${RADIUS-5}px) rotate(-${index * anglePerSegment}deg)`
                    }}
                ></div>
            ))}

             {/* Text Segments */}
            {segments.map((segment, index) => {
                const segmentAngle = index * anglePerSegment;
                const textAngleRad = ((segmentAngle + anglePerSegment / 2) * Math.PI) / 180;

                const x = Math.cos(textAngleRad) * TEXT_RADIUS;
                const y = Math.sin(textAngleRad) * TEXT_RADIUS;

                return (
                    <div
                    key={index}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                        transform: `translate(${x}px, ${y}px) rotate(${segmentAngle + anglePerSegment / 2 + 90}deg)`
                    }}
                    >
                    <span
                        className="text-sm font-bold text-white text-center block"
                        style={{
                            textShadow: '1px 1px 3px rgba(0,0,0,0.6)',
                        }}
                    >
                        {segment.text}
                    </span>
                    </div>
                );
            })}
        </div>
      </div>
      
      {/* Center Circle */}
      <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-4 border-yellow-200 shadow-inner flex items-center justify-center z-10">
      </div>
    </div>
  );
}
