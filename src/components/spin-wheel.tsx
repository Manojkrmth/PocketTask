
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

export function SpinWheel({ segments, isSpinning, onSpinComplete }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const numSegments = segments.length;
  const anglePerSegment = 360 / numSegments;

  useEffect(() => {
    if (isSpinning) {
      // Determine the winning segment
      const winningSegmentIndex = Math.floor(Math.random() * numSegments);
      const randomOffset = (Math.random() - 0.5) * anglePerSegment * 0.8; // Spin to a random point within the segment
      
      // Calculate rotation: 5 full spins + rotation to the winning segment
      const targetRotation = (360 * 5) + (360 - (winningSegmentIndex * anglePerSegment)) + randomOffset;
      
      setRotation(prev => prev + targetRotation);

      setTimeout(() => {
        onSpinComplete(segments[winningSegmentIndex]);
      }, 5000); // Corresponds to the animation duration
    }
  }, [isSpinning, numSegments, segments, anglePerSegment, onSpinComplete]);


  return (
    <div className="relative w-72 h-72 md:w-80 md:h-80">
      <div 
        className="absolute w-full h-full rounded-full transition-transform duration-5000 ease-out"
        style={{ 
            transform: `rotate(${rotation}deg)`,
            background: `conic-gradient(from 0deg, ${segments.map((s, i) => 
                `${s.color} ${i * anglePerSegment}deg ${(i + 1) * anglePerSegment}deg`
            ).join(', ')})`,
            border: '10px solid #fff',
            boxShadow: '0 0 20px rgba(0,0,0,0.2), inset 0 0 15px rgba(0,0,0,0.3)',
        }}
      >
        {segments.map((segment, index) => {
          const rotateAngle = index * anglePerSegment + anglePerSegment / 2;
          return (
            <div
              key={index}
              className="absolute w-1/2 h-1/2 top-0 left-1/2 origin-bottom-left flex items-center justify-center"
              style={{ transform: `rotate(${rotateAngle}deg)` }}
            >
              <span 
                className="transform -rotate-90 text-sm font-bold text-white text-shadow-lg"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}
              >
                  {segment.text}
              </span>
            </div>
          );
        })}
      </div>
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-600 drop-shadow-lg"></div>
      
      {/* Center Circle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white border-4 border-gray-200 shadow-inner flex items-center justify-center font-bold text-gray-700">
        SPIN
      </div>
    </div>
  );
}

    