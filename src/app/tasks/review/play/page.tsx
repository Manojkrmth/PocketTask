
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  CheckCircle,
  SkipForward,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Upload,
  FileText,
  Copy,
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/loading-screen';
import { CopyButton } from '@/components/copy-button';

const getTaskDetails = (taskType: string) => {
    const baseDetails = {
        'google-map-review': {
            title: 'Google Map Review Task',
            reward: 10,
            description: 'Click the link to review the location on Google Maps. Follow the terms, submit your review URL/remarks, and upload a screenshot proof.',
            redirectUrl: 'https://maps.google.com',
            terms: 'Your review must be at least 50 characters long;Include a 5-star rating;Your review must be public;Screenshot must clearly show your review and the location name.',
        },
        'playstore-app-review': {
            title: 'Playstore App Review Task',
            reward: 8,
            description: 'Click the link to review the app on the Playstore. Follow the terms, submit your review URL/remarks, and upload a screenshot proof.',
            redirectUrl: 'https://play.google.com',
            terms: 'Your review must be at least 30 characters long;Include a 5-star rating;Your review must be public;Screenshot must clearly show your review and the app name.',
        }
    };
    // @ts-ignore
    const taskData = baseDetails[taskType];
    if (!taskData) return null;

    return {
        id: `REVIEW-${Date.now()}`,
        ...taskData
    };
}

function ReviewTaskComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const taskType = searchParams.get('type') || '';

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [reviewUrl, setReviewUrl] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');

    const task = useMemo(() => getTaskDetails(taskType), [taskType]);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if(!session) router.push('/login');
            else setUser(session.user);
            setIsLoading(false);
        }
        if (!task) {
            router.push('/tasks');
        } else {
            getUser();
        }
    }, [router, task]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ variant: 'destructive', title: 'File too large', description: 'Please upload a screenshot under 2MB.' });
                return;
            }
            setProofFile(file);
            setFileName(file.name);
        }
    }

    const handleSubmit = async () => {
        if (!reviewUrl || !proofFile) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide the review URL/remarks and upload a proof screenshot.' });
            return;
        }

        setIsSubmitting(true);
        toast({ title: 'Submitting...', description: 'Please wait while we upload your proof.'});

        try {
            if (!user || !task) throw new Error("User or task not found");

            // Mock submission
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            toast({
                title: 'Task Submitted!',
                description: `Your submission for ${task.title} is pending approval.`,
            });
            handleExit();
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExit = () => {
        router.push('/tasks');
    };

    const handleSkip = () => {
        // In a real app, you might want to assign a new task.
        // For now, just go back to the task list.
        router.push('/tasks');
    }

    if (isLoading || !task) {
        return <LoadingScreen />;
    }

    const rulesList = task.terms?.split(';').map(r => r.trim()).filter(Boolean) || [];

    return (
        <div className="min-h-screen bg-muted/40">
            <PageHeader title={task.title} />
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
                        <div className="flex gap-2">
                             <a href={task.redirectUrl} target="_blank" rel="noopener noreferrer" className="flex-1 block">
                                <Button className="w-full h-12 text-base font-bold bg-blue-500 hover:bg-blue-600">
                                    <ExternalLink className="mr-2 h-5 w-5" />
                                    Go to Link
                                </Button>
                            </a>
                            <CopyButton value={task.redirectUrl} className="h-12 w-12 shrink-0">
                                <Copy className="h-5 w-5"/>
                            </CopyButton>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Terms & Conditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                            {rulesList.length > 0 ? rulesList.map((rule, index) => <li key={index}>{rule}</li>) : <li>No specific rules for this task.</li>}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <ShieldCheck className="h-5 w-5 text-primary"/>
                           Submit Your Proof
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label htmlFor="review-url" className="font-bold">Review URL / Remarks</Label>
                            <Textarea
                                id="review-url"
                                value={reviewUrl}
                                onChange={(e) => setReviewUrl(e.target.value)}
                                placeholder="Paste the URL of your review or add any remarks here."
                                className="mt-1"
                                disabled={isSubmitting}
                                rows={3}
                            />
                        </div>
                        <div>
                             <Label htmlFor="proof-upload" className="font-bold">Upload Proof Screenshot</Label>
                             <div className="mt-1">
                                <Button asChild variant="outline" className="w-full cursor-pointer">
                                    <label htmlFor="proof-upload" className="flex items-center justify-center">
                                        <Upload className="mr-2 h-4 w-4"/>
                                        <span>{fileName || 'Choose a file...'}</span>
                                    </label>
                                </Button>
                                <Input 
                                    id="proof-upload" 
                                    type="file" 
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/png, image/jpeg, image/jpg"
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, JPEG up to 2MB.</p>
                             </div>
                        </div>

                        <Button
                            className="w-full h-12 text-base font-bold bg-green-500 hover:bg-green-600"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !reviewUrl || !proofFile}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckCircle className="mr-2 h-5 w-5" />}
                            {isSubmitting ? 'Submitting...' : 'Submit Task'}
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


export default function ReviewTaskPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <ReviewTaskComponent />
        </Suspense>
    );
}

