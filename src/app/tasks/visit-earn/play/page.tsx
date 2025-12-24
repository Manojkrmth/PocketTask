
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PlayCircle,
  Loader2,
  CheckCircle,
  SkipForward,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/loading-screen';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-mobile';


const getMockTask = () => ({
    id: `VISIT-${Date.now()}`,
    title: 'Visit Website & Get Code',
    reward: 1.5,
    description: 'Click the link below to visit a website. Find the verification code on the page and enter it below to claim your reward.',
    redirectUrl: 'https://www.google.com', 
    correctCode: 'VISIT456',
});

const TASK_STORAGE_KEY = 'visitEarnTask';


export default function VisitAndEarnPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { width, height } = useWindowSize();

    const [user, setUser] = useState<User | null>(null);
    const [task, setTask] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const loadNewTask = () => {
        setIsLoading(true);
        setTimeout(() => {
            const newTask = getMockTask();
            sessionStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(newTask));
            setTask(newTask);
            setIsLoading(false);
        }, 500);
    };
    
    useEffect(() => {
        const storedTask = sessionStorage.getItem(TASK_STORAGE_KEY);
        if (storedTask) {
            try {
                setTask(JSON.parse(storedTask));
            } catch {
                sessionStorage.removeItem(TASK_STORAGE_KEY);
                loadNewTask();
            }
        } else {
            loadNewTask();
        }

        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if(!session) router.push('/login');
            else setUser(session.user);
        }
        getUser();
        setIsLoading(false);
    }, [router]);


    const handleVerify = async () => {
        if (!verificationCode) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a verification code.' });
            return;
        }

        setIsVerifying(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (verificationCode.trim().toUpperCase() === task.correctCode.toUpperCase()) {
            
            setIsSubmitting(true);
            try {
                if(!user) throw new Error("User not found");
                
                toast({
                    title: 'Verification Successful!',
                    description: `Reward of ₹${task.reward} will be added soon.`,
                });
                
                await new Promise(resolve => setTimeout(resolve, 4000));

                handleSkip();
            } catch (error: any) {
                 toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
            } finally {
                setIsSubmitting(false);
            }
            
        } else {
            toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: 'The code you entered is incorrect. Please try again.',
            });
        }

        setIsVerifying(false);
    };

    const handleSkip = () => {
        setVerificationCode('');
        sessionStorage.removeItem(TASK_STORAGE_KEY);
        loadNewTask();
    };

    const handleExit = () => {
        sessionStorage.removeItem(TASK_STORAGE_KEY);
        router.push('/tasks');
    };

    if (isLoading || !task) {
        return <LoadingScreen />;
    }
    
     if (isSubmitting) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-400 to-cyan-500 text-white">
                <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
                <div className="text-center animate-in fade-in-0 zoom-in-95">
                    <h1 className="text-4xl font-bold tracking-tight">Task Verified!</h1>
                    <p className="mt-2 text-lg opacity-80">Your reward is being processed.</p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-muted/40">
            <PageHeader title="Visit & Earn" />
            <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle>{task.title}</CardTitle>
                                <CardDescription>{task.description}</CardDescription>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-xs text-muted-foreground">Reward</p>
                                <p className="text-2xl font-bold text-green-600">₹{task.reward}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <a href={task.redirectUrl} target="_blank" rel="noopener noreferrer" className="block">
                            <Button className="w-full h-12 text-base font-bold bg-blue-500 hover:bg-blue-600">
                                <ExternalLink className="mr-2 h-5 w-5" />
                                Go to Link & Get Code
                            </Button>
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <ShieldCheck className="h-5 w-5 text-primary"/>
                           Verification
                        </CardTitle>
                        <CardDescription>
                           Enter the code you received from the link below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label htmlFor="verification-code" className="font-bold">Verification Code</Label>
                            <Input
                                id="verification-code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Enter code here"
                                className="h-12 text-center text-lg font-mono tracking-widest mt-1"
                                disabled={isVerifying}
                            />
                        </div>
                        <Button
                            className="w-full h-12 text-base font-bold bg-green-500 hover:bg-green-600"
                            onClick={handleVerify}
                            disabled={isVerifying || !verificationCode}
                        >
                            {isVerifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckCircle className="mr-2 h-5 w-5" />}
                            {isVerifying ? 'Verifying...' : 'Verify & Claim Reward'}
                        </Button>
                    </CardContent>
                </Card>
                
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-11" onClick={handleSkip}>
                        <SkipForward className="mr-2 h-4 w-4"/>
                        Skip Task
                    </Button>
                     <Button variant="destructive" className="h-11" onClick={handleExit}>
                        <LogOut className="mr-2 h-4 w-4"/>
                        Exit
                    </Button>
                </div>
            </main>
        </div>
    );
}
