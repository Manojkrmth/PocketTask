'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, Award, Clock } from 'lucide-react';
import { SpinWheel, type WheelSegment } from '@/components/spin-wheel';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

const segments: WheelSegment[] = [
  { text: '5', color: '#D81B60' },
  { text: '10', color: '#43A047' },
  { text: '8', color: '#1E88E5' },
  { text: '12', color: '#6A1B9A' },
  { text: '7', color: '#FB8C00' },
  { text: '15', color: '#d32f2f' },
  { text: '6', color: '#00796b' },
  { text: '9', color: '#512da8' },
  { text: '11', color: '#c2185b' },
  { text: '14', color: '#fbc02d' },
];

const DAILY_SPIN_CHANCES = 50;
const SPIN_STORAGE_KEY = 'spinRewardData';
const COUNTDOWN_SECONDS = 15;

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
  const [showAd, setShowAd] = useState(false);
  const [adClicked, setAdClicked] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedData = localStorage.getItem(SPIN_STORAGE_KEY);
    
    if (storedData) {
      try {
        const data: SpinData = JSON.parse(storedData);
        if (data.lastSpinDate === today) {
          const chancesLeft = DAILY_SPIN_CHANCES - data.spinsUsed;
          setSpinChances(chancesLeft);
        } else {
          // Reset for the new day
          localStorage.removeItem(SPIN_STORAGE_KEY);
          setSpinChances(DAILY_SPIN_CHANCES);
        }
      } catch (e) {
        localStorage.removeItem(SPIN_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSpinClick = () => {
    if (isSpinning || spinChances <= 0) return;
    if (countdown > 0) return;
    if (showAd && !adClicked) return;


    setIsSpinning(true);
    setResult(null);
    setShowConfetti(false);
    
    const today = new Date().toISOString().split('T')[0];
    const storedData = localStorage.getItem(SPIN_STORAGE_KEY);
    let currentSpins = 0;
    if(storedData) {
        try {
            const data: SpinData = JSON.parse(storedData);
            if(data.lastSpinDate === today) {
                currentSpins = data.spinsUsed;
            }
        } catch (e) {
            currentSpins = 0;
        }
    }
    const newSpinsUsed = currentSpins + 1;
    localStorage.setItem(SPIN_STORAGE_KEY, JSON.stringify({ lastSpinDate: today, spinsUsed: newSpinsUsed }));
    setSpinChances(DAILY_SPIN_CHANCES - newSpinsUsed);
  };
  
  const onSpinComplete = useCallback((selectedSegment: WheelSegment) => {
    setIsSpinning(false);
    setResult(selectedSegment);
    setShowConfetti(true);

    const chancesLeft = spinChances - 1;
    if (chancesLeft > 0) {
      setTimeout(() => {
        setShowAd(true);
        setAdClicked(false);
        setCountdown(COUNTDOWN_SECONDS);
      }, 2000); // Wait for confetti
    }
  }, [spinChances]);

  const handleAdClick = () => {
      setShowAd(false);
      setResult(null); // Hide previous result
      setAdClicked(true); // Mark ad as clicked
  }

  const allSpinsUsedToday = spinChances <= 0;
  
  const getButtonState = () => {
      if (isSpinning) return { text: 'Spinning...', disabled: true };
      if (allSpinsUsedToday) return { text: 'Come back tomorrow', disabled: true};
      if (countdown > 0) return { text: `Next Spin in ${countdown}s`, disabled: true };
      if (showAd && !adClicked) return { text: 'Click Ad to Spin Again', disabled: true };
      return { text: 'SPIN NOW', disabled: false };
  }

  const buttonState = getButtonState();


  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {showConfetti && <Confetti width={width || 0} height={height || 0} recycle={false} numberOfPieces={400} onConfettiComplete={() => setShowConfetti(false)} />}
      <PageHeader title="Spin & Win" description="Spin the wheel to win exciting prizes!" />
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
        
        <Alert>
          <AlertTitle className="font-bold">Note: 1000 Points = 10 INR</AlertTitle>
        </Alert>

        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <SpinWheel segments={segments} isSpinning={isSpinning} onSpinComplete={onSpinComplete} />

          {result && !showAd && (
             <Alert className={'bg-yellow-100 border-yellow-300'}>
                <Award className="h-4 w-4" />
                <AlertTitle>You Won:</AlertTitle>
                <AlertDescription className="text-lg font-bold">
                    {`${result.text} Points`}
                </AlertDescription>
            </Alert>
          )}

          {showAd && (
            <div className="w-full max-w-sm space-y-2">
                <Card 
                    className="overflow-hidden border-2 border-primary shadow-lg cursor-pointer hover:border-green-500 transition-all"
                    onClick={handleAdClick}
                >
                    <div className="relative aspect-video">
                        <Image
                            src="https://picsum.photos/seed/ad1/600/340"
                            alt="Advertisement"
                            fill
                            className="object-cover"
                            data-ai-hint="advertisement banner"
                        />
                    </div>
                </Card>
                 <p className="text-center text-sm font-bold text-primary animate-pulse">
                    Click the ad to unlock your next spin!
                </p>
            </div>
          )}

        </div>
        
        <div className="text-center space-y-4 pt-4">
            {!allSpinsUsedToday ? (
                 <Button onClick={handleSpinClick} size="lg" className="w-full max-w-sm h-14 text-xl font-bold" disabled={buttonState.disabled}>
                    {isSpinning && <Loader2 className="h-6 w-6 animate-spin"/>}
                    {buttonState.text}
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
