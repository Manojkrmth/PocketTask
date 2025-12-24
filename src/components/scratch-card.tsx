'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Gift, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScratchCardProps {
  prize: string;
  onScratched: () => void;
  isScratched: boolean;
}

export function ScratchCard({ prize, onScratched, isScratched: initialIsScratched }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(initialIsScratched);
  const isWon = prize.toLowerCase().includes('won');

  useEffect(() => {
    if (isRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const cardWidth = canvas.offsetWidth;
    const cardHeight = canvas.offsetHeight;
    canvas.width = cardWidth;
    canvas.height = cardHeight;

    // Draw the scratchable overlay
    const gradient = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
    gradient.addColorStop(0, '#fde047'); // yellow-200
    gradient.addColorStop(1, '#f97316'); // orange-500
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cardWidth, cardHeight);
    
    // Add text on top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH HERE', cardWidth / 2, cardHeight / 2);
    
    ctx.globalCompositeOperation = 'destination-out';

    let isDrawing = false;
    let scratchedPixels = 0;
    const totalPixels = cardWidth * cardHeight;

    const getEventPosition = (event: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        if (event instanceof MouseEvent) {
            return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        } else if (event.touches[0]) {
            return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
        }
        return null;
    };

    const scratch = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      
      const pos = getEventPosition(e);
      if (!pos) return;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
      ctx.fill();

      // Check scratched percentage
      const imageData = ctx.getImageData(0, 0, cardWidth, cardHeight);
      let transparentPixels = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) {
          transparentPixels++;
        }
      }
      
      const scratchedPercent = (transparentPixels / totalPixels) * 100;
      if (scratchedPercent > 50) {
        revealCard();
      }
    };
    
    const revealCard = () => {
      if (isRevealed) return;
      setIsRevealed(true);
      onScratched();
    }

    const startDrawing = (e: MouseEvent | TouchEvent) => {
        isDrawing = true;
        scratch(e);
    };

    const stopDrawing = () => {
        isDrawing = false;
    };
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', scratch, { passive: false });
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('mousemove', scratch);
      canvas.removeEventListener('touchmove', scratch);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isRevealed, onScratched]);

  return (
    <div className="relative w-full aspect-[16/9] rounded-xl shadow-lg overflow-hidden">
      {/* Prize Layer */}
      <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white",
          isWon ? "bg-gradient-to-br from-green-500 to-teal-600" : "bg-gradient-to-br from-gray-600 to-gray-800"
      )}>
        {isWon ? <Star className="h-12 w-12 text-yellow-300 animate-pulse mb-2" /> : <Gift className="h-12 w-12 text-gray-400 mb-2" />}
        <h3 className="text-2xl font-bold drop-shadow-md">{prize}</h3>
      </div>

      {/* Scratch Layer */}
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 w-full h-full cursor-pointer transition-opacity duration-700",
          isRevealed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      />
    </div>
  );
}
