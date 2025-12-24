'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Award, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScratchCardPrize {
    prize: string;
    isWon: boolean;
}

interface ScratchCardProps {
  prize: ScratchCardPrize;
  onScratched: () => void;
  isRevealed: boolean;
}

export function ScratchCard({ prize, onScratched, isRevealed }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Local state to control the fade-out, driven by the prop
  const [isCanvasHidden, setIsCanvasHidden] = useState(isRevealed);

  useEffect(() => {
    if (isRevealed) {
      // Start the fade-out animation, then hide the canvas
      const timer = setTimeout(() => setIsCanvasHidden(true), 500);
      return () => clearTimeout(timer);
    }
    
    setIsCanvasHidden(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    const cardWidth = canvas.offsetWidth;
    const cardHeight = canvas.offsetHeight;
    canvas.width = cardWidth;
    canvas.height = cardHeight;

    // Draw the scratchable overlay
    const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
    gradient.addColorStop(0, '#fef08a'); // yellow-200
    gradient.addColorStop(0.5, '#facc15'); // yellow-400
    gradient.addColorStop(1, '#eab308'); // yellow-500
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cardWidth, cardHeight);
    
    // Add text on top
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH HERE', cardWidth / 2, cardHeight / 2);
    
    ctx.globalCompositeOperation = 'destination-out';

    let isDrawing = false;
    
    const getEventPosition = (event: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        if (event instanceof MouseEvent) {
            return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        } else if (event.touches[0]) {
            return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
        }
        return null;
    };
    
    const checkScratchedPercentage = () => {
        const imageData = ctx.getImageData(0, 0, cardWidth, cardHeight);
        let transparentPixels = 0;
        const totalPixels = cardWidth * cardHeight;
        // Iterate only over the alpha channel
        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] === 0) {
                transparentPixels++;
            }
        }
        const scratchedPercent = (transparentPixels / totalPixels) * 100;
        if (scratchedPercent > 60) {
            onScratched();
        }
    }

    const scratch = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      
      const pos = getEventPosition(e);
      if (!pos) return;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
      ctx.fill();
    };
    
    const startDrawing = (e: MouseEvent | TouchEvent) => {
        isDrawing = true;
        scratch(e);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        isDrawing = false;
        // Check percentage only when user stops scratching
        checkScratchedPercentage();
    };
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', scratch, { passive: false });
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('mousemove', scratch);
      canvas.removeEventListener('touchmove', scratch);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('touchend', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
    };
  }, [isRevealed, onScratched]);

  return (
    <div className="relative w-full max-w-sm aspect-[5/3] rounded-2xl shadow-lg overflow-hidden border-4 border-white/50">
      {/* Prize Layer */}
      <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white transition-all duration-500",
          prize.isWon 
            ? "bg-gradient-to-br from-green-500 to-emerald-600" 
            : "bg-gradient-to-br from-gray-500 to-slate-700"
      )}>
        {prize.isWon ? (
            <Award className="h-16 w-16 text-yellow-300 drop-shadow-lg animate-pulse mb-2" />
        ) : (
            <Gift className="h-16 w-16 text-slate-300 drop-shadow-lg mb-2" />
        )}
        <h3 className="text-3xl font-bold tracking-wider drop-shadow-md">{prize.prize}</h3>
      </div>

      {/* Scratch Layer */}
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 w-full h-full cursor-pointer transition-opacity duration-500",
          isCanvasHidden ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      />
    </div>
  );
}
