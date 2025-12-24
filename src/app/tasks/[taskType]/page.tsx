
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

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

// Mock data, replace with actual API calls
const getTaskTypeDetails = (taskType: string) => {
    const details: { [key: string]: { name: string, available: boolean } } = {
        'gmail': { name: 'Gmail Task', available: true },
        'instagram': { name: 'Instagram Task', available: true },
        'facebook': { name: 'Facebook Task', available: true },
        'used-mails': { name: 'Used Mails Task', available: true },
        'hot-mail': { name: 'Hot Mail Task', available: true },
        'outlook-mail': { name: 'Outlook Mail Task', available: true },
        'visit-earn': { name: 'Visit & Earn Task', available: true },
        'watch-earn': { name: 'Watch & Earn Task', available: true },
        'niva-coin': { name: 'Niva Coin Task', available: true },
        'top-coin': { name: 'Top Coin Task', available: true },
    };
    return details[taskType] || { name: 'Unknown Task', available: false };
};


export default function StartTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskType = Array.isArray(params.taskType) ? params.taskType[0] : params.taskType;

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>({ tasksPaused: false, helpLinks: [] });

  const [profileLoading, setProfileLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        setUserProfile(profile);
      }
      setProfileLoading(false);

      // Mock settings
      setSettings({
        tasksPaused: false,
        helpLinks: [
            { text: 'How to create Gmail account?', link: '#' },
            { text: 'How to submit task proof?', link: '#' }
        ]
      });
      setSettingsLoading(false);
    };

    fetchData();
  }, []);

  const { name: taskName, available: tasksAvailable } = getTaskTypeDetails(taskType);

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
  const tasksPaused = settings.tasksPaused;
  const howToButtons = settings.helpLinks || [];


  return (
    <div>
      <PageHeader 
        title={taskName || "Start Task"}
       />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center p-4">
        {noTasksAvailable || tasksPaused || isUserBlocked ? (
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
                        : `You have completed all available tasks for ${taskName}! New tasks will be available soon.`}
                </p>
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
                disabled={isLoading || settingsLoading || profileLoading || isUserBlocked}
                >
                {isLoading || settingsLoading || profileLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                    <PlayCircle className="mr-2 h-6 w-6" />
                )}
                {isLoading ? 'Assigning...' : 'Start New Task'}
                </Button>
            </>
        )}
        
        <Card className="mt-8 w-full max-w-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2 justify-center"><HelpCircle className="h-5 w-5"/>How it Works?</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
                {settingsLoading ? <Loader2 className='mx-auto animate-spin' /> : howToButtons.map((button: any, index: number) => (
                    <Button key={index} variant="outline" className="w-full justify-between" asChild>
                    <Link href={button.link || '#'}>
                        {button.text}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    </Button>
                ))}
                {!settingsLoading && howToButtons.length === 0 && <p className="text-sm text-muted-foreground text-center">Admin has not added any help links yet.</p>}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
