
'use client';

import { useState, useEffect } from 'react';
import { GmailTaskCenter } from '@/components/gmail-task-center';
import { LoadingScreen } from '@/components/loading-screen';
import { PageHeader } from '@/components/page-header';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TASK_STORAGE_KEY = 'gmailTaskData';

export default function GmailTaskPage() {
    const [task, setTask] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [noTasksAvailable, setNoTasksAvailable] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [expiryTimestamp, setExpiryTimestamp] = useState(0);
    const [submitCooldownExpiryTimestamp, setSubmitCooldownExpiryTimestamp] = useState(0);
    const router = useRouter();
    const { toast } = useToast();

    const loadNewTask = async (user: User) => {
        setIsLoading(true);
        setNoTasksAvailable(false);

        // Fetch task settings first
        const { data: settingsData, error: settingsError } = await supabase
            .from('settings')
            .select('settings_data')
            .eq('id', 1)
            .single();
        
        if (settingsError || !settingsData) {
            toast({ variant: "destructive", title: "Error", description: "Could not load task configuration." });
            setNoTasksAvailable(true);
            setIsLoading(false);
            return;
        }

        const gmailTaskConfig = settingsData.settings_data.taskSettings.find((t: any) => t.id === 'gmail');

        if (!gmailTaskConfig) {
            toast({ variant: "destructive", title: "Configuration Error", description: "Gmail task is not configured in settings." });
            setNoTasksAvailable(true);
            setIsLoading(false);
            return;
        }

        const { data, error } = await supabase.rpc('get_and_assign_gmail_task', {
            user_id_input: user.id
        });

        if (error) {
            console.error("Error fetching/assigning task:", JSON.stringify(error, null, 2));
            setNoTasksAvailable(true);
            setIsLoading(false);
            return;
        }

        const newTask = data && data.length > 0 ? data[0] : null;

        if (newTask) {
            const formattedTask = {
              id: newTask.id,
              title: gmailTaskConfig.name,
              reward: gmailTaskConfig.reward,
              description: gmailTaskConfig.description,
              rules: gmailTaskConfig.rules,
              batchId: `BATCH-${newTask.id}`,
              prefilledData: {
                  fullName: newTask.full_name,
                  gmail: `${newTask.gmail_user}@gmail.com`, 
                  password: newTask.password,
                  recoveryMail: newTask.recovery_mail,
              },
            };
            
            const taskDurationMillis = (gmailTaskConfig.taskDurationSeconds || 600) * 1000;
            const submitCooldownMillis = (gmailTaskConfig.submitCooldownSeconds || 60) * 1000;

            const newExpiryTimestamp = Date.now() + taskDurationMillis;
            const newSubmitCooldownTimestamp = Date.now() + submitCooldownMillis;

            const taskData = {
                task: formattedTask,
                expiryTimestamp: newExpiryTimestamp,
                submitCooldownExpiryTimestamp: newSubmitCooldownTimestamp,
            };

            sessionStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(taskData));
            setTask(formattedTask);
            setExpiryTimestamp(taskData.expiryTimestamp);
            setSubmitCooldownExpiryTimestamp(taskData.submitCooldownExpiryTimestamp);
        } else {
            setNoTasksAvailable(true);
            sessionStorage.removeItem(TASK_STORAGE_KEY);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        const checkUserAndLoadTask = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/login');
                return;
            }
            
            setCurrentUser(session.user);

            const storedTaskData = sessionStorage.getItem(TASK_STORAGE_KEY);
            if (storedTaskData) {
                try {
                    const data = JSON.parse(storedTaskData);
                    if (data.expiryTimestamp > Date.now()) {
                        setTask(data.task);
                        setExpiryTimestamp(data.expiryTimestamp);
                        setSubmitCooldownExpiryTimestamp(data.submitCooldownExpiryTimestamp);
                        setIsLoading(false);
                        return;
                    }
                } catch (error) {
                    console.error("Failed to parse stored task data", error);
                }
            }
            await loadNewTask(session.user);
        };

        checkUserAndLoadTask();
    }, [router]);

    const handleTaskComplete = () => {
        sessionStorage.removeItem(TASK_STORAGE_KEY);
        if (currentUser) {
            loadNewTask(currentUser);
        }
    };
    
    if (isLoading) {
        return <LoadingScreen />;
    }

    if (noTasksAvailable) {
        return (
            <div>
                <PageHeader title="Gmail Task" />
                <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-center p-4">
                    <XCircle className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No New Tasks Available</h2>
                    <p className="text-muted-foreground mb-6">You have completed all available Gmail tasks! New tasks will be available soon.</p>
                    <Button onClick={() => router.push('/tasks')}>Back to Tasks</Button>
                </div>
            </div>
        );
    }

    if (!task) {
        return <LoadingScreen />;
    }

    return (
        <div>
            <PageHeader title={task.title || "Gmail Task"} />
            <GmailTaskCenter
                task={task}
                currentGmail={task.prefilledData.gmail}
                expiryTimestamp={expiryTimestamp}
                submitCooldownExpiryTimestamp={submitCooldownExpiryTimestamp}
                onTaskComplete={handleTaskComplete}
                onGmailRegenerate={(newGmail) => {
                    const updatedTask = { ...task, prefilledData: { ...task.prefilledData, gmail: newGmail } };
                    setTask(updatedTask);
                    const stored = JSON.parse(sessionStorage.getItem(TASK_STORAGE_KEY) || '{}');
                    stored.task = updatedTask;
                    sessionStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(stored));
                }}
            />
        </div>
    );
}
