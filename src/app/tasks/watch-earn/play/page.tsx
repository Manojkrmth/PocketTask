
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
  Loader2,
  CheckCircle,
  SkipForward,
  LogOut,
  ExternalLink,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/loading-screen';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-mobile';


const TASK_STORAGE_KEY = 'watchEarnTask';


export default function WatchAndEarnPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { width, height } = useWindowSize();

    const [user, setUser] = useState<User | null>(null);
    const [task, setTask] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [noTasksAvailable, setNoTasksAvailable] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');

    const loadNewTask = async (userId: string) => {
        setIsLoading(true);
        setNoTasksAvailable(false);
        setTask(null);
        sessionStorage.removeItem(TASK_STORAGE_KEY);
        
        const { data, error } = await supabase.rpc('get_and_assign_watch_earn_task', {
            user_id_input: userId
        });

        if (error) {
            console.error("Error fetching watch-earn task:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch a new task.' });
            setNoTasksAvailable(true);
            setIsLoading(false);
            return;
        }

        const newTask = data;

        if (newTask && newTask.id) {
            sessionStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(newTask));
            setTask(newTask);
        } else {
            setNoTasksAvailable(true);
        }
        setIsLoading(false);
    };
    
    useEffect(() => {
        const initialize = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if(!session) {
                router.push('/login');
                return;
            }
            
            setUser(session.user);
            const storedTask = sessionStorage.getItem(TASK_STORAGE_KEY);
            
            if (storedTask) {
                try {
                    setTask(JSON.parse(storedTask));
                    setIsLoading(false);
                } catch {
                    await loadNewTask(session.user.id);
                }
            } else {
                await loadNewTask(session.user.id);
            }
        };
        initialize();
    }, [router]);


    const handleVerify = async () => {
        if (!verificationCode) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a verification code.' });
            return;
        }

        if (verificationCode.trim().toUpperCase() !== task.correct_code.toUpperCase()) {
            toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: 'The code you entered is incorrect. Please try again.',
            });
            return;
        }

        setIsVerifying(true);
        setIsSubmitting(true);
        
        try {
            if (!user) throw new Error("User not found");

            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('balance_available')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            const newBalance = profile.balance_available + task.reward;

            const { error: balanceError } = await supabase
                .from('users')
                .update({ balance_available: newBalance })
                .eq('id', user.id);

            if (balanceError) throw balanceError;
            
            const { error: taskError } = await supabase.from('usertasks').insert({
                user_id: user.id,
                task_type: 'watch-earn',
                reward: task.reward,
                status: 'Approved',
                submission_data: { code: verificationCode.trim().toUpperCase(), taskId: task.id }
            });

            if (taskError) throw taskError;

            const { error: walletError } = await supabase.from('wallet_history').insert({
                user_id: user.id,
                amount: task.reward,
                type: 'task_reward',
                status: 'Completed',
                description: `Reward for ${task.title}`
            });

            if (walletError) throw walletError;

            toast({
                title: 'Verification Successful!',
                description: `Reward of ₹${task.reward} has been added to your balance.`,
            });
            
            await new Promise(resolve => setTimeout(resolve, 4000));
            if (user) handleSkip();

        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
             setIsSubmitting(false);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSkip = () => {
        setVerificationCode('');
        setIsSubmitting(false);
        if (user) {
            loadNewTask(user.id);
        }
    };

    const handleExit = () => {
        sessionStorage.removeItem(TASK_STORAGE_KEY);
        router.push('/tasks');
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (noTasksAvailable) {
      return (
        <div>
            <PageHeader title="Watch &amp; Earn" />
            <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-center p-4">
                <XCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No New Tasks Available</h2>
                <p className="text-muted-foreground mb-6">You have completed all available videos for now. Please check back later.</p>
                <Button onClick={() => router.push('/tasks')}>Back to Tasks</Button>
            </div>
        </div>
      );
    }
    
     if (isSubmitting) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-400 to-cyan-500 text-white">
                <Confetti width={width || 0} height={height || 0} recycle={false} numberOfPieces={500} onConfettiComplete={() => {}} />
                <div className="text-center animate-in fade-in-0 zoom-in-95">
                    <h1 className="text-4xl font-bold tracking-tight">Task Approved!</h1>
                    <p className="mt-2 text-lg opacity-80">Your reward has been added to your balance.</p>
                </div>
            </div>
        );
    }

    if (!task) {
        return <LoadingScreen />;
    }


    return (
        <div className="min-h-screen bg-muted/40">
            <PageHeader title="Watch &amp; Earn" />
            <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-muted-foreground">Task ID: {task.id}</p>
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
                        <a href={task.redirect_url} target="_blank" rel="noopener noreferrer" className="block">
                            <Button className="w-full h-12 text-base font-bold bg-blue-500 hover:bg-blue-600">
                                <ExternalLink className="mr-2 h-5 w-5" />
                                Go to Video &amp; Get Code
                            </Button>
                        </a>
                        <Alert>
                            <AlertTitle>Instructions</AlertTitle>
                            <AlertDescription>
                                Click the link, watch the content, and find the code to complete the task.
                            </AlertDescription>
                        </Alert>
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
                            {isVerifying ? 'Verifying...' : 'Verify &amp; Claim Reward'}
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
