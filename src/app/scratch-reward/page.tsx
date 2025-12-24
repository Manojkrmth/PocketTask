'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, Award, Info, Play } from 'lucide-react';
import { ScratchCard, type ScratchCardPrize } from '@/components/scratch-card';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-mobile';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import Image from 'next/image';

const initialPrizes: ScratchCardPrize[] = [
  { prize: 'You Won ₹5!', isWon: true },
  { prize: 'Better Luck Next Time', isWon: false },
  { prize: 'You Won ₹10!', isWon: true },
  { prize: 'You Won ₹2!', isWon: true },
  { prize: 'Try Again!', isWon: false },
];

const COUNTDOWN_SECONDS = 15;

export default function ScratchRewardPage() {
  const [prizes] = useState(initialPrizes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [showAd, setShowAd] = useState(false);
  
  const { width, height } = useWindowSize();

  const currentPrize = useMemo(() => prizes[currentIndex], [prizes, currentIndex]);
  const availableCards = prizes.length - currentIndex;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isWaiting && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsWaiting(false);
      setShowAd(false);
    }
    return () => clearInterval(timer);
  }, [isWaiting, countdown]);

  const handleCardScratched = () => {
    setIsRevealed(true);
    if (currentPrize.isWon) {
      setShowConfetti(true);
    }
    
    // Start countdown for next card if there are more cards
    if (currentIndex < prizes.length - 1) {
        setIsWaiting(true);
        // Show ad after 1 second
        setTimeout(() => setShowAd(true), 1000);
    }
  };

  const handleNextCard = () => {
    if (currentIndex < prizes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsRevealed(false);
      setShowConfetti(false);
      setCountdown(COUNTDOWN_SECONDS); // Reset countdown
      setIsWaiting(false); // Make sure waiting is false to allow scratching
      setShowAd(false);
    }
  };
  
  const handleReset = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setShowConfetti(false);
    setCountdown(COUNTDOWN_SECONDS);
    setIsWaiting(false);
    setShowAd(false);
  }

  const allCardsScratched = isRevealed && currentIndex === prizes.length - 1;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} onConfettiComplete={() => setShowConfetti(false)} />}
      <PageHeader title="Scratch & Win" description="Scratch cards to reveal your prize!" />
      <main className="p-4 space-y-6 flex-1 flex flex-col">
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 text-primary" />
              <p className="font-semibold">Available Cards</p>
            </div>
            <p className="text-2xl font-bold">{availableCards}</p>
          </CardContent>
        </Card>

        <div className="flex-1 flex flex-col items-center justify-center">
            {currentPrize ? (
                 <ScratchCard
                    key={currentIndex}
                    prize={currentPrize}
                    onScratched={handleCardScratched}
                    isRevealed={isRevealed}
                    revealPercent={30}
                    isWaiting={isWaiting}
                />
            ) : null}
        </div>
        
        <div className="text-center space-y-4 pt-4">
            {isRevealed && !allCardsScratched && (
              <div className="w-full max-w-sm mx-auto space-y-3">
                {isWaiting && showAd && (
                  <Card className="bg-white border-2 border-dashed rounded-lg animate-pulse">
                     <Link href="#" target="_blank" rel="noopener noreferrer">
                      <CardContent className="p-3">
                         <div className="flex items-center gap-4">
                          <Image src="https://picsum.photos/seed/ad1/80/80" alt="Ad" width={80} height={80} className="rounded-lg" data-ai-hint="advertisement" />
                          <div className="text-left flex-1">
                            <p className="text-xs text-muted-foreground">Sponsored</p>
                            <h4 className="font-semibold text-md">Watch this Ad to Win!</h4>
                            <p className="text-sm text-green-600 font-bold flex items-center gap-1"><Play className="h-4 w-4"/> Watch Now</p>
                          </div>
                        </div>
                      </CardContent>
                     </Link>
                  </Card>
                )}
                
                {isWaiting && (
                   <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Next card unlocks in...</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-bold font-mono">{countdown}s</span>
                      </div>
                       <Progress value={(countdown / COUNTDOWN_SECONDS) * 100} className="h-2 w-full"/>
                   </div>
                )}
                
                <Button onClick={handleNextCard} size="lg" className="w-full h-12 text-lg" disabled={isWaiting}>
                    {isWaiting ? 'Please wait...' : 'Scratch Next Card'}
                </Button>
              </div>
            )}
            {allCardsScratched && (
                <div className='flex flex-col items-center gap-4'>
                    <p className="text-muted-foreground font-semibold text-lg">You have used all your scratch cards.</p>
                     <Button onClick={handleReset} size="lg" className="w-full max-w-sm h-12 text-lg">
                        Play Again
                    </Button>
                </div>
            )}
        </div>

      </main>
    </div>
  );
}
