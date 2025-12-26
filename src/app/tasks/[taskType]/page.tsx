
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import BannerAd from '@/components/ads/banner-ad';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Rocket,
  PlayCircle,
  Loader2,
  XCircle,
  HelpCircle,
  ArrowRight,
  History,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StartTaskPage = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const taskType = Array.isArray(params.taskType) ? params.taskType[0] : params.taskType;

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [taskDetails, setTaskDetails] = useState<{ name: string; available: boolean } | null>(null);
  const [settings, setSettings] = useState<any>({ helpLinks: [] });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profile } = await supabase.from('users').select('status').eq('id', session.user.id).single();
        setUserProfile(profile);
      } else {
        router.push('/login');
        return;
      }
      
      const { data: settingsData, error } = await supabase
        .from('settings')
        .select('task_settings')
        .eq('id', 1)
        .single();
        
      if (error || !settingsData || !settingsData.task_settings) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load task configurations.' });
        setTaskDetails({ name: 'Unknown Task', available: false });
      } else {
        const allTasks = settingsData.task_settings as any[];
        const currentTaskConfig = allTasks.find(t => t.id === taskType);
        setTaskDetails({
          name: currentTaskConfig?.name || 'Unknown Task',
          available: !!currentTaskConfig?.enabled,
        });
      }

      setSettings({ helpLinks: [] }); // Assuming help links are static for now or fetched elsewhere
      setIsLoading(false);
    };

    fetchData();
  }, [taskType, router, toast]);

  const { name: taskName, available: tasksAvailable } = taskDetails || { name: 'Loading...', available: false };

  const assignTask = () => {
    setIsLoading(true);
    // In a real app, you would have logic here to assign a task
    // For now, we just simulate a delay and redirect
    setTimeout(() => {
      if (taskType === 'gmail') {
        router.push('/tasks/gmail/play');
      } else if (taskType === 'watch-earn') {
        router.push('/tasks/watch-earn/play');
      } else if (taskType === 'visit-earn') {
        router.push('/tasks/visit-earn/play');
      } else if (taskType === 'used-mails') {
        router.push('/tasks/used-mails/play');
      } else if (['hot-mail', 'outlook-mail', 'facebook', 'instagram'].includes(taskType)) {
        router.push(`/tasks/social/play?type=${taskType}`);
      } else if (['niva-coin', 'top-coin'].includes(taskType)) {
        router.push(`/tasks/coin/play?type=${taskType}`);
      }
      else {
        alert(`Task assignment for ${taskName} is not implemented yet.`);
        setIsLoading(false);
      }
    }, 1500);
  };

  const isUserBlocked = userProfile?.status === 'Blocked';
  const noTasksAvailable = !tasksAvailable;
  const tasksPaused = false; // Assuming tasks are not paused globally for now
  const howToButtons = settings.helpLinks || [];


  return (
    <div>
      <PageHeader 
        title={taskName || "Start Task"}
       />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center p-4">
        {isLoading ? (
            <Loader2 className="h-16 w-16 animate-spin" />
        ) : noTasksAvailable || tasksPaused || isUserBlocked ? (
            <div className="flex flex-col items-center text-center">
                <XCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {isUserBlocked ? 'Account Restricted' : tasksPaused ? 'Tasks Temporarily Paused' : 'No New Tasks Available'}
                </h2>
                <p className="text-muted-foreground mb-6 max-w-xs">
                    {isUserBlocked
                    ? 'Your account is blocked. You cannot start new tasks.'
                    : tasksPaused 
                        ? 'Our team is working on adding new tasks. Please check back later.' 
                        : `This task is currently not available.`}
                </p>
                 <Button onClick={() => router.push('/tasks')}>Back to Tasks</Button>
            </div>
        ) : (
            <>
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                    <Rocket className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready for a new {taskName}?</h2>
                <p className="text-muted-foreground mb-6">Click the button below to start.</p>
                <Button
                size="lg"
                className="h-14 text-lg px-8 rounded-full shadow-lg bg-green-500 hover:bg-green-600"
                onClick={assignTask}
                disabled={isLoading}
                >
                {isLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                    <PlayCircle className="mr-2 h-6 w-6" />
                )}
                {isLoading ? 'Loading...' : 'Start New Task'}
                </Button>
            </>
        )}
        
       { !isLoading && (
        <Card className="mt-8 w-full max-w-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 justify-center"><HelpCircle className="h-5 w-5"/>How it Works?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
                {howToButtons.length > 0 ? howToButtons.map((button: any, index: number) => (
                    <Button key={index} variant="outline" className="w-full justify-between" asChild>
                    <Link href={button.link || '#'}>
                        {button.text}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    </Button>
                )) : <p className="text-sm text-muted-foreground text-center">No help links available.</p>}
            </CardContent>
        </Card>
       )}
        <BannerAd adId="tasks-start" />
      </div>
    </div>
  );
}

export default StartTaskPage;

