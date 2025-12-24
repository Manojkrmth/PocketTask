
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, Award, Clock, Banknote } from 'lucide-react';
import { SpinWheel, type WheelSegment } from '@/components/spin-wheel';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';
import { LoadingScreen } from '@/components/loading-screen';
import { useRouter } from 'next/navigation';

const segments: WheelSegment[] = [
  { id: 'seg1', text: '5', color: '#D81B60' },
  { id: 'seg2', text: '10', color: '#43A047' },
  { id: 'seg3', text: '8', color: '#1E88E5' },
  { id: 'seg4', text: '12', color: '#6A1B9A' },
  { id: 'seg5', text: '7', color: '#FB8C00' },
  { id: 'seg6', text: '15', color: '#d32f2f' },
  { id: 'seg7', text: '6', color: '#00796b' },
  { id: 'seg8', text: '9', color: '#512da8' },
  { id: 'seg9', text: '11', color: '#c2185b' },
  { id: 'seg10', text: '14', color: '#fbc02d' },
];

const DAILY_SPIN_CHANCES = 50;
const COUNTDOWN_SECONDS = 10;
const MIN_TRANSFER_POINTS = 1000; // 1000 points = 10 INR

interface SpinRewardData {
  spin_points: number;
  last_spin_date: string;
  spins_used_today: number;
}

export default function SpinRewardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { width, height } = useWindowSize();
  
  const [user, setUser] = useState<User | null>(null);
  const [spinData, setSpinData] = useState<SpinRewardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [result, setResult] = useState<WheelSegment | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [showAd, setShowAd] = useState(false);
  const [adClicked, setAdClicked] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Load user and spin data from Supabase
  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const { data, error } = await supabase
        .from('spin_rewards')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      const today = new Date().toISOString().split('T')[0];

      if (data) {
        // If data exists, check if we need to reset daily spins
        if (data.last_spin_date !== today) {
          const { data: updatedData, error: updateError } = await supabase
            .from('spin_rewards')
            .update({ spins_used_today: 0, last_spin_date: today })
            .eq('user_id', session.user.id)
            .select()
            .single();
          if (updateError) {
             toast({ variant: "destructive", title: "Error", description: "Could not reset daily spins." });
             setSpinData(data); // Use stale data on error
          } else {
            setSpinData(updatedData);
          }
        } else {
          setSpinData(data);
        }
      } else if (error && error.code !== 'PGRST116') {
        // Handle actual errors, but ignore 'PGRST116' (no row found)
        toast({ variant: "destructive", title: "Error", description: "Could not fetch your spin data." });
      }
      // If no data is found (new user), spinData will remain null, which is fine.
      // The first spin will create the record via RPC.
      setIsLoading(false);
    };

    initialize();
  }, [router, toast]);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && result && spinData && spinData.spins_used_today < DAILY_SPIN_CHANCES) {
      // Countdown finished, show ad for next spin
      setShowAd(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, result, spinData]);

  const handleSpinClick = async () => {
    if (!user || isSpinning || (spinData && spinData.spins_used_today >= DAILY_SPIN_CHANCES) || countdown > 0 || (showAd && !adClicked)) return;

    setIsSpinning(true);
    setResult(null);
    setShowConfetti(false);
    setShowAd(false);
    setAdClicked(false);
    
    // Optimistically update spins used
    const newSpinsUsed = (spinData?.spins_used_today || 0) + 1;
    setSpinData(prev => ({ 
        ...(prev || { spin_points: 0, last_spin_date: new Date().toISOString().split('T')[0] }), 
        spins_used_today: newSpinsUsed 
    }));
  };
  
  const onSpinComplete = useCallback(async (selectedSegment: WheelSegment) => {
    if (!user) return;
    
    setIsSpinning(false);
    setResult(selectedSegment);
    setShowConfetti(true);

    const pointsWon = parseInt(selectedSegment.text, 10);
    
    if (!isNaN(pointsWon)) {
      const { data: rpcData, error } = await supabase.rpc('update_spin_reward', {
          p_user_id: user.id,
          p_points_to_add: pointsWon
      });
      
      if (error) {
         toast({ variant: "destructive", title: "Error", description: "Failed to update points." });
         console.error(error);
         // Revert optimistic update if DB fails
         setSpinData(prev => prev ? { ...prev, spins_used_today: prev.spins_used_today -1 } : null);
      } else {
         // Re-sync state with database response
         const updatedData = rpcData && rpcData.length > 0 ? rpcData[0] : null;
         if (updatedData) setSpinData(updatedData);

         setCountdown(COUNTDOWN_SECONDS);
      }
    }
  }, [user, toast]);

  const handleAdClick = () => {
      setShowAd(false);
      setResult(null); // Clear previous prize
      setAdClicked(true); // Mark ad as clicked
  }

  const handleTransfer = async () => {
    if (!user || !spinData || spinData.spin_points < MIN_TRANSFER_POINTS) return;

    setIsTransferring(true);
    const amountInr = (spinData.spin_points / 100) * 1; // 100 points = 1 INR

    try {
        const { error } = await supabase.rpc('transfer_spin_points_to_main_balance', {
            p_user_id: user.id,
            p_points_to_transfer: spinData.spin_points,
            p_amount_inr: amountInr
        });
        
        if (error) throw error;
        
        // Refresh spin data from DB
        const { data: updatedSpinData } = await supabase
            .from('spin_rewards')
            .select('*')
            .eq('user_id', user.id)
            .single();
        if(updatedSpinData) setSpinData(updatedSpinData);

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

  const spinsLeft = spinData ? DAILY_SPIN_CHANCES - spinData.spins_used_today : DAILY_SPIN_CHANCES;
  const allSpinsUsedToday = spinsLeft <= 0;
  
  const getButtonState = () => {
      if (isSpinning) return { text: 'Spinning...', disabled: true };
      if (allSpinsUsedToday && !isSpinning) return { text: 'Come back tomorrow', disabled: true };
      if (countdown > 0) return { text: `Next Spin in ${countdown}s`, disabled: true };
      if (showAd && !adClicked) return { text: 'Click Ad to Spin Again', disabled: true };
      return { text: 'SPIN NOW', disabled: false };
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  const buttonState = getButtonState();
  const canTransfer = spinData ? spinData.spin_points >= MIN_TRANSFER_POINTS : false;
  const currentPoints = spinData?.spin_points || 0;
  const transferAmountInr = (currentPoints / 100) * 1;

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
              <p className="text-2xl font-bold">{spinsLeft}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-100 border-green-200">
            <CardHeader className="p-2 pb-0">
                <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2"><Award className="h-4 w-4"/> Spin Points</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-1 flex items-center justify-between">
                 <p className="text-2xl font-bold text-green-900">{currentPoints}</p>
                 <Button size="sm" onClick={handleTransfer} disabled={!canTransfer || isTransferring} className="h-8">
                    {isTransferring ? <Loader2 className="h-4 w-4 animate-spin"/> : <Banknote className="h-4 w-4"/>}
                    <span className="ml-2">Transfer</span>
                 </Button>
            </CardContent>
          </Card>
        </div>
        
        <Alert>
          <AlertTitle className="font-bold">Note: 100 Points = 1 INR</AlertTitle>
          <AlertDescription>Minimum transfer is {MIN_TRANSFER_POINTS} points (₹{ (MIN_TRANSFER_POINTS/100) * 1 }).</AlertDescription>
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
