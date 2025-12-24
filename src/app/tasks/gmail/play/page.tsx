
'use client';

import { useState, useEffect } from 'react';
import { GmailTaskCenter } from '@/components/gmail-task-center';
import { LoadingScreen } from '@/components/loading-screen';
import { PageHeader } from '@/components/page-header';

// This is a mock task. In a real app, you would fetch this from your database.
const getMockTask = () => ({
  id: `TASK-${Date.now()}`,
  title: 'Create a New Gmail Account',
  reward: 5,
  description: 'Create a new Gmail account using the details provided below. Make sure to follow all the rules carefully.',
  rules: 'Do not use a VPN;Use the provided name;Set the recovery email correctly.',
  batchId: `BATCH-${Date.now()}`,
  prefilledData: {
      fullName: 'Rahul Sharma',
      gmail: 'rahulsharma7823@gmail.com',
      password: 'TaskPassword123!',
      recoveryMail: 'your-recovery-mail@example.com',
  },
});

const TASK_STORAGE_KEY = 'gmailTaskData';

export default function GmailTaskPage() {
    const [task, setTask] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentGmail, setCurrentGmail] = useState('');
    const [expiryTimestamp, setExpiryTimestamp] = useState(0);
    const [submitCooldownExpiryTimestamp, setSubmitCooldownExpiryTimestamp] = useState(0);

    const loadNewTask = () => {
        setIsLoading(true);
        // Simulate fetching a new task
        setTimeout(() => {
            const newTask = getMockTask();
            const newExpiryTimestamp = Date.now() + 10 * 60 * 1000; // 10 minutes from now
            const newSubmitCooldownTimestamp = Date.now() + 1 * 60 * 1000; // 1 minute from now
            
            const taskData = {
                task: newTask,
                currentGmail: newTask.prefilledData.gmail,
                expiryTimestamp: newExpiryTimestamp,
                submitCooldownExpiryTimestamp: newSubmitCooldownTimestamp,
            };

            sessionStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(taskData));

            setTask(newTask);
            setCurrentGmail(taskData.currentGmail);
            setExpiryTimestamp(taskData.expiryTimestamp);
            setSubmitCooldownExpiryTimestamp(taskData.submitCooldownExpiryTimestamp);
            setIsLoading(false);
        }, 500);
    };

    useEffect(() => {
        const storedTaskData = sessionStorage.getItem(TASK_STORAGE_KEY);
        if (storedTaskData) {
            try {
                const data = JSON.parse(storedTaskData);
                if (data.expiryTimestamp > Date.now()) {
                    setTask(data.task);
                    setCurrentGmail(data.currentGmail);
                    setExpiryTimestamp(data.expiryTimestamp);
                    setSubmitCooldownExpiryTimestamp(data.submitCooldownExpiryTimestamp);
                    setIsLoading(false);
                    return;
                }
            } catch (error) {
                console.error("Failed to parse stored task data", error);
            }
        }
        loadNewTask();
    }, []);

    const handleTaskComplete = () => {
        sessionStorage.removeItem(TASK_STORAGE_KEY);
        loadNewTask();
    };

    const handleGmailRegenerate = (newGmail: string) => {
        setCurrentGmail(newGmail);
        const storedTaskData = sessionStorage.getItem(TASK_STORAGE_KEY);
        if (storedTaskData) {
             try {
                const data = JSON.parse(storedTaskData);
                data.currentGmail = newGmail;
                sessionStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(data));
             } catch(e) {}
        }
    };

    if (isLoading || !task) {
        return <LoadingScreen />;
    }

    return (
        <div>
            <PageHeader title="Gmail Task" />
            <GmailTaskCenter
                task={task}
                currentGmail={currentGmail}
                expiryTimestamp={expiryTimestamp}
                submitCooldownExpiryTimestamp={submitCooldownExpiryTimestamp}
                onTaskComplete={handleTaskComplete}
                onGmailRegenerate={handleGmailRegenerate}
            />
        </div>
    );
}
