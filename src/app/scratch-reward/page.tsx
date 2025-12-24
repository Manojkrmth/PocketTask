'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, Award } from 'lucide-react';
import { ScratchCard, type ScratchCardPrize } from '@/components/scratch-card';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';


const initialPrizes: ScratchCardPrize[] = [
  { prize: 'You Won ₹5!', isWon: true },
  { prize: 'Better Luck Next Time', isWon: false },
  { prize: 'You Won ₹10!', isWon: true },
  { prize: 'You Won ₹2!', isWon: true },
  { prize: 'Try Again!', isWon: false },
];

export default function ScratchRewardPage() {
  const [availableCards, setAvailableCards] = useState(initialPrizes.length);
  const [prizes] = useState(initialPrizes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const { width, height } = useWindowSize();

  const currentPrize = useMemo(() => prizes[currentIndex], [prizes, currentIndex]);

  const handleCardScratched = () => {
    setIsRevealed(true);
    if (currentPrize.isWon) {
      setShowConfetti(true);
    }
  };

  const handleNextCard = () => {
    if (currentIndex < prizes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setAvailableCards(prev => Math.max(0, prev - 1));
      setIsRevealed(false);
      setShowConfetti(false);
    }
  };
  
  const handleReset = () => {
    setCurrentIndex(0);
    setAvailableCards(prizes.length);
    setIsRevealed(false);
    setShowConfetti(false);
  }

  const allCardsScratched = isRevealed && currentIndex === prizes.length - 1;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {showConfetti && <Confetti width={width} height={height} recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
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
                    key={currentIndex} // Force re-mount for new card
                    prize={currentPrize}
                    onScratched={handleCardScratched}
                    isRevealed={isRevealed}
                />
            ) : null}
        </div>
        
        <div className="text-center space-y-4 pt-4">
            {isRevealed && !allCardsScratched && (
                <Button onClick={handleNextCard} size="lg" className="w-full max-w-sm h-12 text-lg">
                    Scratch Next Card
                </Button>
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
