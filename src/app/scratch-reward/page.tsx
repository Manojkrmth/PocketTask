'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2 } from 'lucide-react';
import { ScratchCard } from '@/components/scratch-card';

const initialCards = [
  { id: 1, prize: 'You Won ₹5!', isScratched: false },
  { id: 2, prize: 'Better Luck Next Time', isScratched: false },
  { id: 3, prize: 'You Won ₹10!', isScratched: false },
];

export default function ScratchRewardPage() {
  const [availableCards, setAvailableCards] = useState(3);
  const [scratchCards, setScratchCards] = useState(initialCards);
  const [isResetting, setIsResetting] = useState(false);
  const [key, setKey] = useState(Date.now()); // Used to force-remount the component

  const handleCardScratched = (cardId: number) => {
    setScratchCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId ? { ...card, isScratched: true } : card
      )
    );
    setAvailableCards((prev) => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => {
        setScratchCards(initialCards.map(c => ({...c, isScratched: false})));
        setAvailableCards(initialCards.length);
        setKey(Date.now()); // Change key to remount ScratchCard components
        setIsResetting(false);
    }, 500);
  }

  return (
    <div>
      <PageHeader title="Scratch & Win" description="Scratch cards to reveal your prize!" />
      <main className="p-4 space-y-6">
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 text-primary" />
              <p className="font-semibold">Available Cards</p>
            </div>
            <p className="text-2xl font-bold">{availableCards}</p>
          </CardContent>
        </Card>

        <div key={key} className="grid grid-cols-1 gap-6">
            {scratchCards.map((card) => (
                <ScratchCard
                key={card.id}
                prize={card.prize}
                onScratched={() => handleCardScratched(card.id)}
                isScratched={card.isScratched}
                />
            ))}
        </div>
        
        {availableCards === 0 && (
            <div className="text-center space-y-4">
                <p className="text-muted-foreground">You have used all your scratch cards.</p>
                <Button onClick={handleReset} disabled={isResetting}>
                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Reset Cards
                </Button>
            </div>
        )}

      </main>
    </div>
  );
}
