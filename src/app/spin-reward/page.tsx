
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, Award, Clock } from 'lucide-react';
import { SpinWheel, type WheelSegment } from '@/components/spin-wheel';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const segments: WheelSegment[] = [
  { text: '₹10', color: '#FFD700' },
  { text: 'Try Again', color: '#E0E0E0' },
  { text: '₹5', color: '#C0C0C0' },
  { text: 'Bonus Spin', color: '#CD7F32' },
  { text: '₹20', color: '#FFD700' },
  { text: 'Try Again', color: '#E0E0E0' },
  { text: '₹2', color: '#C0C0C0' },
  { text: '₹50', color: '#FFD700' },
];

const DAILY_SPIN_CHANCES = 3;
const SPIN_STORAGE_KEY = 'spinRewardData';

interface SpinData {
  lastSpinDate: string;
  spinsUsed: number;
}

export default function SpinRewardPage() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [spinChances, setSpinChances] = useState(DAILY_SPIN_CHANCES);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedData = localStorage.getItem(SPIN_STORAGE_KEY);
    
    if (storedData) {
      const data: SpinData = JSON.parse(storedData);
      if (data.lastSpinDate === today) {
        const chancesLeft = DAILY_SPIN_CHANCES - data.spinsUsed;
        setSpinChances(chancesLeft);
        if(chancesLeft <= 0) {
            setIsFinished(true);
        }
      } else {
        // It's a new day, reset.
        localStorage.removeItem(SPIN_STORAGE_KEY);
        setSpinChances(DAILY_SPIN_CHANCES);
      }
    } else {
      setSpinChances(DAILY_SPIN_CHANCES);
    }
  }, []);

  const handleSpinClick = () => {
    if (isSpinning || spinChances <= 0) return;

    setIsSpinning(true);
    setResult(null);
    setShowConfetti(false);
    
    // Logic to update local storage
    const today = new Date().toISOString().split('T')[0];
    const storedData = localStorage.getItem(SPIN_STORAGE_KEY);
    let currentSpins = 0;
    if(storedData) {
        const data: SpinData = JSON.parse(storedData);
        if(data.lastSpinDate === today) {
            currentSpins = data.spinsUsed;
        }
    }
    const newSpinsUsed = currentSpins + 1;
    localStorage.setItem(SPIN_STORAGE_KEY, JSON.stringify({ lastSpinDate: today, spinsUsed: newSpinsUsed }));
    setSpinChances(DAILY_SPIN_CHANCES - newSpinsUsed);
    if(DAILY_SPIN_CHANCES - newSpinsUsed <= 0) {
        setTimeout(() => setIsFinished(true), 5000); // Set finished after spin animation
    }
  };
  
  const onSpinComplete = (selectedSegment: WheelSegment) => {
    setIsSpinning(false);
    setResult(selectedSegment);
    if (selectedSegment.text !== 'Try Again') {
      setShowConfetti(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} onConfettiComplete={() => setShowConfetti(false)} />}
      <PageHeader title="Spin &amp; Win" description="Spin the wheel to win exciting prizes!" />
      <main className="p-4 space-y-6 flex-1 flex flex-col">
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 text-primary" />
              <p className="font-semibold">Spins Left Today</p>
            </div>
            <p className="text-2xl font-bold">{spinChances}</p>
          </CardContent>
        </Card>

        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <SpinWheel segments={segments} isSpinning={isSpinning} onSpinComplete={onSpinComplete} />

          {result && (
             <Alert className={`max-w-sm animate-in fade-in-50 ${result.text === 'Try Again' ? 'bg-gray-100' : 'bg-yellow-100 border-yellow-300'}`}>
                <Award className="h-4 w-4" />
                <AlertTitle>You Won:</AlertTitle>
                <AlertDescription className="text-lg font-bold">
                    {result.text}
                </AlertDescription>
            </Alert>
          )}

        </div>
        
        <div className="text-center space-y-4 pt-4">
            {!isFinished ? (
                 <Button onClick={handleSpinClick} size="lg" className="w-full max-w-sm h-14 text-xl font-bold" disabled={isSpinning || spinChances <= 0}>
                    {isSpinning ? <Loader2 className="h-6 w-6 animate-spin"/> : 'SPIN'}
                </Button>
            ) : (
                <Alert className="max-w-sm mx-auto">
                    <Clock className="h-4 w-4" />
                    <AlertTitle>All Spins Used!</AlertTitle>
                    <AlertDescription>
                        You have used all your spins for today. Please come back tomorrow for more chances.
                    </AlertDescription>
                </Alert>
            )}
        </div>
      </main>
    </div>
  );
}

    