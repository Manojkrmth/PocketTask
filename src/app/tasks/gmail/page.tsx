
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
            setTask(newTask);
            setCurrentGmail(newTask.prefilledData.gmail);
            setExpiryTimestamp(Date.now() + 10 * 60 * 1000); // 10 minutes from now
            setSubmitCooldownExpiryTimestamp(Date.now() + 1 * 60 * 1000); // 1 minute from now
            setIsLoading(false);
        }, 500);
    };

    useEffect(() => {
        loadNewTask();
    }, []);

    const handleTaskComplete = () => {
        // This function is called when a task is submitted or skipped.
        // It should load the next task.
        loadNewTask();
    };

    const handleGmailRegenerate = (newGmail: string) => {
        setCurrentGmail(newGmail);
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
