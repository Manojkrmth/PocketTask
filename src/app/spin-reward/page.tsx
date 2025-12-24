
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, Award, Clock, Banknote, IndianRupee } from 'lucide-react';
import { SpinWheel, type WheelSegment } from '@/components/spin-wheel';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

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
const SPIN_DATA_KEY = 'spinRewardData';
const SPIN_POINTS_KEY = 'spinPointsBalance';
const COUNTDOWN_SECONDS = 15;
const MIN_TRANSFER_POINTS = 1000; // 1000 points = 10 INR

interface SpinData {
  lastSpinDate: string;
  spinsUsed: number;
}

export default function SpinRewardPage() {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [spinChances, setSpinChances] = useState(DAILY_SPIN_CHANCES);
  const [showAd, setShowAd] = useState(false);
  const [adClicked, setAdClicked] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [spinPoints, setSpinPoints] = useState(0);
  const [isLoadingPoints, setIsLoadingPoints] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);

  // Load user and persistent data from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Load spin chances
    const storedSpinData = localStorage.getItem(SPIN_DATA_KEY);
    if (storedSpinData) {
      try {
        const data: SpinData = JSON.parse(storedSpinData);
        if (data.lastSpinDate === today) {
          setSpinChances(DAILY_SPIN_CHANCES - data.spinsUsed);
        } else {
          localStorage.removeItem(SPIN_DATA_KEY);
        }
      } catch (e) {
        localStorage.removeItem(SPIN_DATA_KEY);
      }
    }
    
    // Load spin points
    const storedPoints = localStorage.getItem(SPIN_POINTS_KEY);
    if (storedPoints) {
      setSpinPoints(parseInt(storedPoints, 10));
    }
    setIsLoadingPoints(false);

    // Get Supabase user
    const getUser = async () => {
        const {data: {user}} = await supabase.auth.getUser();
        setUser(user);
    }
    getUser();

  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && result) {
      // Countdown finished, and we have a result from the last spin
      const chancesLeft = spinChances; // check current chances
      if (chancesLeft > 0) {
        setShowAd(true);
      }
    }
    return () => clearTimeout(timer);
  }, [countdown, result, spinChances]);

  const handleSpinClick = () => {
    if (isSpinning || spinChances <= 0 || countdown > 0 || (showAd && !adClicked)) return;

    setIsSpinning(true);
    setResult(null);
    setShowConfetti(false);
    setShowAd(false);
    setAdClicked(false);
    
    const today = new Date().toISOString().split('T')[0];
    const storedData = localStorage.getItem(SPIN_DATA_KEY);
    let currentSpins = 0;
    if(storedData) {
        try {
            const data: SpinData = JSON.parse(storedData);
            if(data.lastSpinDate === today) currentSpins = data.spinsUsed;
        } catch (e) { currentSpins = 0; }
    }
    const newSpinsUsed = currentSpins + 1;
    localStorage.setItem(SPIN_DATA_KEY, JSON.stringify({ lastSpinDate: today, spinsUsed: newSpinsUsed }));
    setSpinChances(DAILY_SPIN_CHANCES - newSpinsUsed);
  };
  
  const onSpinComplete = useCallback((selectedSegment: WheelSegment) => {
    setIsSpinning(false);
    setResult(selectedSegment);
    setShowConfetti(true);

    const pointsWon = parseInt(selectedSegment.text, 10);
    if (!isNaN(pointsWon)) {
      const newTotalPoints = spinPoints + pointsWon;
      setSpinPoints(newTotalPoints);
      localStorage.setItem(SPIN_POINTS_KEY, newTotalPoints.toString());
    }
    
    const chancesLeft = spinChances - 1;
    if (chancesLeft > 0) {
        setCountdown(COUNTDOWN_SECONDS); // Start countdown immediately
    }
  }, [spinChances, spinPoints]);

  const handleAdClick = () => {
      setShowAd(false);
      setResult(null); // Clear previous prize
      setAdClicked(true); // Mark ad as clicked
  }

  const handleTransfer = async () => {
    if (!user || spinPoints < MIN_TRANSFER_POINTS) return;

    setIsTransferring(true);
    const amountInr = (spinPoints / 1000) * 10;

    try {
        const { data: profile, error: fetchError } = await supabase
            .from('users')
            .select('balance_available')
            .eq('id', user.id)
            .single();

        if (fetchError || !profile) throw fetchError || new Error("Profile not found");

        const newBalance = profile.balance_available + amountInr;

        const { error: updateError } = await supabase
            .from('users')
            .update({ balance_available: newBalance })
            .eq('id', user.id);

        if (updateError) throw updateError;
        
        setSpinPoints(0);
        localStorage.setItem(SPIN_POINTS_KEY, '0');

        toast({
            title: "Transfer Successful!",
            description: `₹${amountInr.toFixed(2)} has been added to your main balance.`,
        });

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Transfer Failed",
            description: error.message || "An unknown error occurred.",
        });
    } finally {
        setIsTransferring(false);
    }
  };

  const allSpinsUsedToday = spinChances <= 0;
  
  const getButtonState = () => {
      if (isSpinning) return { text: 'Spinning...', disabled: true };
      if (allSpinsUsedToday && !isSpinning) return { text: 'Come back tomorrow', disabled: true};
      if (countdown > 0) return { text: `Next Spin in ${countdown}s`, disabled: true };
      if (showAd && !adClicked) return { text: 'Click Ad to Spin Again', disabled: true };
      return { text: 'SPIN NOW', disabled: false };
  }

  const buttonState = getButtonState();
  const canTransfer = spinPoints >= MIN_TRANSFER_POINTS;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {showConfetti && <Confetti width={width || 0} height={height || 0} recycle={false} numberOfPieces={400} onConfettiComplete={() => setShowConfetti(false)} />}
      <PageHeader title="Spin & Win" description="Spin the wheel to win exciting prizes!" />
      <main className="p-4 space-y-4 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 text-primary" />
                <p className="font-semibold">Spins Left Today</p>
              </div>
              <p className="text-2xl font-bold">{spinChances}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-100 border-green-200">
            <CardHeader className="p-2 pb-0">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2"><Award className="h-4 w-4"/> Spin Points</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-1 flex items-center justify-between">
                 <p className="text-2xl font-bold text-green-900">{isLoadingPoints ? <Loader2 className="h-6 w-6 animate-spin"/> : spinPoints}</p>
                 <Button size="sm" onClick={handleTransfer} disabled={!canTransfer || isTransferring} className="h-8">
                    {isTransferring ? <Loader2 className="h-4 w-4 animate-spin"/> : <Banknote className="h-4 w-4"/>}
                    <span className="ml-2">Transfer</span>
                 </Button>
            </CardContent>
          </Card>
        </div>
        
        <Alert>
          <AlertTitle className="font-bold">Note: 1000 Points = 10 INR</AlertTitle>
          <AlertDescription>Minimum transfer is 1000 points.</AlertDescription>
        </Alert>

        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
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
                    {isSpinning && <Loader2 className="h-6 w-6 animate-spin mr-2"/>}
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
