
'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, SkipForward, LogOut, ShieldCheck, User as UserIcon, KeyRound, Mail, AtSign, Fingerprint } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/loading-screen';

const getTaskConfig = (taskType: string, allSettings: any[]) => {
    const config = allSettings.find(t => t.id === taskType);
    if (!config) return null;
    
    let fields: string[] = [];
    switch (taskType) {
        case 'hot-mail':
        case 'outlook-mail':
            fields = ['name', 'email', 'password', 'recoveryMail'];
            break;
        case 'facebook':
        case 'instagram':
            fields = ['uid', 'password', 'twoFactor', 'webMail'];
            break;
    }

    return {
        id: `${taskType.toUpperCase()}-${Date.now()}`,
        title: config.name,
        reward: config.reward,
        description: config.description,
        fields: fields,
    };
};

function SocialTaskComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const taskType = searchParams.get('type') || '';
    
    const [user, setUser] = useState<User | null>(null);
    const [taskSettings, setTaskSettings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formState, setFormState] = useState<{[key: string]: string}>({});

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
                .select('settings_data->taskSettings')
                .eq('id', 1)
                .single();

            if (error || !settings || !settings.taskSettings) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load task configuration.' });
                router.push('/tasks');
                return;
            }
            setTaskSettings(settings.taskSettings as any[]);
            setIsLoading(false);
        };
        initialize();
    }, [router, toast]);

    const handleInputChange = (field: string, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!task || !user) return;
        
        const isFormValid = task.fields.every((field: string) => {
            if (field === 'recoveryMail') return true; // Optional field
            return formState[field] && formState[field].trim() !== '';
        });

        if (!isFormValid) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill all required fields.' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const submissionData = {
                user_id: user.id,
                task_type: taskType,
                reward: task.reward,
                status: 'Pending',
                submission_data: formState
            };

            const { error } = await supabase.from('usertasks').insert(submissionData);

            if (error) throw error;
            
            toast({ title: 'Task Submitted', description: `Your submission for ${task.title} is pending.` });
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

    const fieldComponents: {[key: string]: React.ReactNode} = {
        name: <><UserIcon /> Full Name</>,
        email: <><Mail /> Email Address</>,
        password: <><KeyRound /> Password</>,
        recoveryMail: <><AtSign /> Recovery Mail (Optional)</>,
        uid: <><UserIcon /> UID / Username</>,
        twoFactor: <><Fingerprint /> 2FA Code</>,
        webMail: <><Mail /> Email / WebMail</>,
    };

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
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <ShieldCheck className="h-5 w-5 text-primary"/>
                           Submit Your Account Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {task.fields.map((field: string) => (
                            <div key={field}>
                                <Label htmlFor={field} className="font-bold flex items-center gap-2 mb-1">{fieldComponents[field] || field}</Label>
                                <Input
                                    id={field}
                                    value={formState[field] || ''}
                                    onChange={(e) => handleInputChange(field, e.target.value)}
                                    placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                                    disabled={isSubmitting}
                                />
                            </div>
                        ))}
                        
                        <Button
                            className="w-full h-12 text-base font-bold bg-green-500 hover:bg-green-600"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
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

export default function SocialTaskPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <SocialTaskComponent />
        </Suspense>
    );
}
