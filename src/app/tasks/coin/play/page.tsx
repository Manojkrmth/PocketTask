
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import BannerAd from '@/components/ads/banner-ad';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, SkipForward, LogOut, ShieldCheck, FileText, Coins, User as UserIcon, Copy, Info, Hash, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/loading-screen';
import { CopyButton } from '@/components/copy-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MIN_COIN_SUBMISSION = 1000;

const getTaskConfig = (taskType: string, allSettings: any[]) => {
    const config = allSettings.find(t => t.id === taskType);
    if (!config) return null;
    
    return {
        id: `${taskType.toUpperCase()}-${Date.now()}`,
        title: config.name,
        description: config.description,
        rewardRate: config.reward,
        rules: config.rules,
        receiverId: config.receiverId || 'RECEIVER-ID-NOT-SET',
    };
};

function CoinTaskComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const taskType = searchParams.get('type') || '';
    
    const [user, setUser] = useState<User | null>(null);
    const [taskSettings, setTaskSettings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [instaId, setInstaId] = useState('');
    const [coinAmount, setCoinAmount] = useState('');
    const [orderId, setOrderId] = useState('');
    const [dateTime, setDateTime] = useState('');

    const task = useMemo(() => getTaskConfig(taskType, taskSettings), [taskType, taskSettings]);

    useEffect(() => {
        const initialize = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            setUser(session.user);

            const { data: settings, error } = await supabase
                .from('settings')
                .select('task_settings')
                .eq('id', 1)
                .single();

            if (error || !settings || !settings.task_settings) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load task configuration.' });
                router.push('/tasks');
                return;
            }
            setTaskSettings(settings.task_settings as any[]);
            setIsLoading(false);
        };
        initialize();
    }, [router, toast]);

    const handleSubmit = async () => {
        if (!task || !user) return;
        
        const amount = parseInt(coinAmount);

        if (!instaId || !coinAmount || amount <= 0 || !orderId || !dateTime) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill all the required fields.' });
            return;
        }

        if (amount < MIN_COIN_SUBMISSION) {
             toast({ variant: 'destructive', title: 'Amount Too Low', description: `Minimum coin submission is ${MIN_COIN_SUBMISSION}.` });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const submissionData = {
                user_id: user.id,
                task_id: task.id,
                coin_type: taskType,
                insta_id: instaId,
                coin_amount: amount,
                reward_inr: (amount / 1000) * task.rewardRate,
                order_id: orderId,
                submission_time: new Date(dateTime).toISOString(),
                status: 'Pending',
            };

            const { error } = await supabase.from('coinsubmissions').insert(submissionData);
            if (error) throw error;

            toast({ title: 'Task Submitted', description: `Your submission of ${coinAmount} coins is pending.` });
            router.push('/tasks');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleSkip = () => router.push('/tasks');
    const handleExit = () => router.push('/tasks');

    if (isLoading || !task) {
        return <LoadingScreen />;
    }
    
    const rulesList = task.rules?.split(';').map((r: string) => r.trim()).filter(Boolean) || [];
    const calculatedReward = (parseInt(coinAmount) || 0) > 0 ? ((parseInt(coinAmount) / 1000) * task.rewardRate) : 0;

    return (
        <div className="min-h-screen bg-muted/40">
            <PageHeader title={task.title} />
            <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{task.title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Coin Rate</AlertTitle>
                            <AlertDescription>
                                1000 Coins = ₹{task.rewardRate} INR
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <ShieldCheck className="h-5 w-5 text-primary"/>
                           Submit Your Coins
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="receiverId" className="font-bold">Receiver ID</Label>
                            <div className="flex gap-1 mt-1">
                                <Input id="receiverId" value={task.receiverId} readOnly className="font-mono bg-muted"/>
                                <CopyButton value={task.receiverId} className="h-10 w-10 shrink-0">
                                   <Copy className="h-4 w-4"/>
                                </CopyButton>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="orderId" className="font-bold flex items-center gap-2"><Hash className="h-4 w-4" /> Order ID</Label>
                            <Input
                                id="orderId"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="Enter the Order ID"
                                disabled={isSubmitting}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="dateTime" className="font-bold flex items-center gap-2"><Calendar className="h-4 w-4" /> Date & Time</Label>
                            <Input
                                id="dateTime"
                                type="datetime-local"
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                                disabled={isSubmitting}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="instaId" className="font-bold flex items-center gap-2"><UserIcon className="h-4 w-4" /> Insta ID</Label>
                            <Input
                                id="instaId"
                                value={instaId}
                                onChange={(e) => setInstaId(e.target.value)}
                                placeholder="Enter your Instagram ID"
                                disabled={isSubmitting}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="coinAmount" className="font-bold flex items-center gap-2"><Coins className="h-4 w-4" /> Coin Amount</Label>
                            <Input
                                id="coinAmount"
                                type="number"
                                value={coinAmount}
                                onChange={(e) => setCoinAmount(e.target.value)}
                                placeholder={`e.g., ${MIN_COIN_SUBMISSION}`}
                                disabled={isSubmitting}
                                className="mt-1"
                            />
                        </div>
                        
                         {calculatedReward > 0 && (
                            <Alert variant="default" className="bg-green-50 border-green-200">
                                <AlertTitle className="text-green-800">Estimated Earning</AlertTitle>
                                <AlertDescription className="font-bold text-green-700">
                                    You will earn approximately ₹{calculatedReward.toFixed(2)} for {coinAmount} coins.
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        <Button
                            className="w-full h-12 text-base font-bold"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !instaId || !coinAmount || !orderId || !dateTime}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckCircle className="mr-2 h-5 w-5" />}
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                            <li>Minimum coin submission is {MIN_COIN_SUBMISSION}.</li>
                            {rulesList.length > 0 ? rulesList.map((rule: string, index: number) => <li key={index}>{rule}</li>) : <li>No specific rules for this task.</li>}
                        </ul>
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
                <BannerAd adId="tasks-coin" />
            </main>
        </div>
    );
}


export default function CoinTaskPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <CoinTaskComponent />
        </Suspense>
    );
}
