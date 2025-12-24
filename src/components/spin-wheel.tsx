'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
const TEXT_RADIUS = RADIUS * 0.65;
const WHEEL_SIZE = RADIUS * 2;

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
      const randomOffset = (Math.random() * 0.8 + 0.1) * anglePerSegment;
      const centeredRotation = (winningSegmentIndex * anglePerSegment) + anglePerSegment / 2;
      const targetRotation = (360 * 6) + (360 - centeredRotation) - randomOffset;
      
      setRotation(prev => prev + targetRotation);

      setTimeout(() => {
        onSpinComplete(segments[winningSegmentIndex]);
      }, 5000); // Must match animation duration
    }
  }, [isSpinning, numSegments, segments, anglePerSegment, onSpinComplete]);

  return (
    <div className="relative w-[340px] h-[360px] flex items-center justify-center flex-col">
       {/* Wheel */}
      <div
        className="relative"
        style={{ width: `${WHEEL_SIZE}px`, height: `${WHEEL_SIZE}px` }}
      >
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[28px] z-20 drop-shadow-lg">
           <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 0L59.282 45H0.717968L30 0Z" fill="#FDD835"/>
            <path d="M30 80C41.0457 80 50 71.0457 50 60C50 48.9543 41.0457 40 30 40C18.9543 40 10 48.9543 10 60C10 71.0457 18.9543 80 30 80Z" fill="#D81B60"/>
            <circle cx="30" cy="60" r="8" fill="#FDD835"/>
          </svg>
        </div>
        
        {/* Spinning part */}
        <div
          className={cn(
            "w-full h-full rounded-full transition-transform duration-[5000ms] ease-out",
            "select-none border-[10px] border-red-700 shadow-2xl" 
          )}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
            <svg
                width={WHEEL_SIZE}
                height={WHEEL_SIZE}
                viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                className="rounded-full"
            >
                {/* Segments */}
                {segments.map((segment, i) => (
                    <path
                        key={i}
                        d={paths[i]}
                        fill={segment.color}
                        stroke="white"
                        strokeWidth="2"
                    />
                ))}

                 {/* Decorative Dots */}
                {segments.map((_, i) => {
                    const angle = (i * anglePerSegment) * Math.PI / 180;
                    const dotRadius = RADIUS * 0.85;
                    const dots = 5;
                    return Array.from({length: dots}).map((__, dotIndex) => {
                        const r = dotRadius - (dotIndex * 15);
                        if (r < TEXT_RADIUS - 10) return null;
                        const x = RADIUS + r * Math.cos(angle);
                        const y = RADIUS + r * Math.sin(angle);
                        return <circle key={`${i}-${dotIndex}`} cx={x} cy={y} r="3" fill="rgba(255,255,255,0.5)" />
                    })
                })}

                {/* Text on Segments */}
                {segments.map((segment, i) => {
                    const textAngle = i * anglePerSegment + anglePerSegment / 2;
                    const pathId = `text-path-${i}`;
                    
                    // Create an invisible arc path for text to follow
                    const startAngleRad = (textAngle - anglePerSegment / 3) * Math.PI / 180;
                    const endAngleRad = (textAngle + anglePerSegment / 3) * Math.PI / 180;
                    
                    const arcStart = {
                        x: RADIUS + TEXT_RADIUS * Math.cos(startAngleRad),
                        y: RADIUS + TEXT_RADIUS * Math.sin(startAngleRad)
                    };
                    const arcEnd = {
                        x: RADIUS + TEXT_RADIUS * Math.cos(endAngleRad),
                        y: RADIUS + TEXT_RADIUS * Math.sin(endAngleRad)
                    };

                    return (
                        <g key={`text-${i}`}>
                            <defs>
                                <path
                                    id={pathId}
                                    d={`M ${arcStart.x} ${arcStart.y} A ${TEXT_RADIUS} ${TEXT_RADIUS} 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
                                />
                            </defs>
                            <text
                                fill="white"
                                fontSize="18"
                                fontWeight="bold"
                                textAnchor="middle"
                                dy="-5"
                                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.7)'}}
                            >
                                <textPath href={`#${pathId}`} startOffset="50%">
                                    {segment.text}
                                </textPath>
                            </text>
                        </g>
                    )
                })}
            </svg>
        </div>
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-red-800 border-8 border-yellow-400 shadow-inner z-10"></div>
      </div>
       {/* Stand */}
      <div className="relative w-full h-[60px] -mt-2">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-12 bg-gray-700"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-gray-800 rounded-t-sm"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-[70px] w-4 h-8 bg-gray-700 -rotate-45"></div>
          <div className="absolute bottom-0 left-1/2 translate-x-[54px] w-4 h-8 bg-gray-700 rotate-45"></div>
      </div>
    </div>
  );
}
