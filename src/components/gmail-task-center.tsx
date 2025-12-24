'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Send,
  Loader2,
  FileText,
  RefreshCw,
  SkipForward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Confetti from 'react-confetti';
import { useCurrency } from '@/context/currency-context';
import { CopyButton } from '@/components/copy-button';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';


type Task = {
  id: string;
  title: string;
  reward: number;
  description: string;
  rules: string;
  batchId: string;
  prefilledData: {
      fullName: string;
      gmail: string;
      password: string;
      recoveryMail?: string;
  };
};

interface GmailTaskCenterProps {
  task: Task;
  currentGmail: string;
  expiryTimestamp: number;
  submitCooldownExpiryTimestamp: number;
  onTaskComplete: () => void;
  onGmailRegenerate: (newGmail: string) => void;
}

export function GmailTaskCenter({ task, currentGmail, expiryTimestamp, submitCooldownExpiryTimestamp, onTaskComplete, onGmailRegenerate }: GmailTaskCenterProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const { formatCurrency } = useCurrency();
  
  const [recoveryMail, setRecoveryMail] = useState(task.prefilledData.recoveryMail || '');
  const prefilledRecoveryMailExists = !!task.prefilledData.recoveryMail;


  const [timeLeft, setTimeLeft] = useState(Math.round((expiryTimestamp - Date.now()) / 1000));
  const [submitCooldown, setSubmitCooldown] = useState(Math.round((submitCooldownExpiryTimestamp - Date.now()) / 1000));

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

  useEffect(() => {
    const handleResize = () => {
      const el = document.querySelector('.max-w-md');
      if (el) {
        setWindowSize({ width: el.clientWidth, height: el.clientHeight });
      } else {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      toast({
        variant: 'destructive',
        title: "Time's up!",
        description: 'This task has expired. A new task will be assigned.',
      });
      onTaskComplete(); 
      return;
    }
    const timer = setInterval(() => {
      const newTimeLeft = Math.round((expiryTimestamp - Date.now()) / 1000);
      setTimeLeft(newTimeLeft > 0 ? newTimeLeft : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onTaskComplete, toast, expiryTimestamp]);

  useEffect(() => {
    if (submitCooldown > 0) {
      const cooldownTimer = setInterval(() => {
        const newCooldownTime = Math.round((submitCooldownExpiryTimestamp - Date.now()) / 1000);
        setSubmitCooldown(newCooldownTime > 0 ? newCooldownTime : 0);
      }, 1000);
      return () => clearInterval(cooldownTimer);
    }
  }, [submitCooldown, submitCooldownExpiryTimestamp]);

  const mainMinutes = Math.floor(Math.max(0, timeLeft) / 60);
  const mainSeconds = Math.max(0, timeLeft) % 60;
  
  const cooldownMinutes = Math.floor(Math.max(0, submitCooldown) / 60);
  const cooldownSeconds = Math.max(0, submitCooldown) % 60;

  const handleRegenerateGmail = () => {
    // ALWAYS use the original gmail from the task prop as the base.
    const [username] = task.prefilledData.gmail.split('@');
    
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let randomPrefix = '';
    for (let i = 0; i < 2; i++) {
      randomPrefix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const randomNumber = Math.floor(10 + Math.random() * 90);

    const newUsername = `${randomPrefix}${username}${randomNumber}`;
    const newGmail = `${newUsername}@gmail.com`;
    
    onGmailRegenerate(newGmail);

    toast({
      title: 'Gmail Regenerated!',
      description: `New Gmail ID: ${newGmail}`,
    });
  };

  const handleSubmit = () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You are not logged in.'});
        return;
    }
    if (!recoveryMail) {
      toast({ variant: 'destructive', title: 'Recovery Mail Required', description: 'Please enter the recovery mail to submit the task.'});
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    
    (async () => {
       try {
        const userTaskData = {
            userId: user.id,
            taskId: task.id,
            batchId: task.batchId,
            status: 'Pending',
            submissionTime: new Date().toISOString(),
            gmail: currentGmail, // Submit the currently displayed (potentially regenerated) Gmail
            reward: task.reward,
            recoveryMailSubmission: recoveryMail,
        };
        const { error: insertError } = await supabase.from('userTasks').insert(userTaskData);

        if (insertError) throw insertError;
        
        // To increment numeric fields, you need to use an RPC function in Supabase.
        // Let's assume you have an RPC function `increment_user_balances`.
        const { error: rpcError } = await supabase.rpc('increment_user_balances', {
            user_id_input: user.id,
            hold_increment: task.reward,
            pending_increment: 1,
        });

        if (rpcError) throw rpcError;
        
        toast({
          title: 'Task Submitted!',
          description: 'Your reward is on hold pending admin approval.',
        });

        setTimeout(() => {
            onTaskComplete();
        }, 5000);

      } catch (error: any) {
        console.error("Error submitting task:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to submit task.',
        });
        setIsSubmitting(false);
      }
    })();
  };
  
  const rulesList = task.rules?.split(';').map(r => r.trim()).filter(Boolean) || [];
  const isCooldownActive = submitCooldown > 0;

  if (isSubmitting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-400 to-cyan-500 text-white">
        <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />
        <div className="text-center animate-in fade-in-0 zoom-in-95">
          <h1 className="text-4xl font-bold tracking-tight">Task Submitted!</h1>
          <p className="mt-2 text-lg opacity-80">Your reward is pending approval.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-card p-2 rounded-lg text-center text-lg font-semibold text-primary flex items-center justify-center gap-2 border shadow-sm">
        <Clock className="h-5 w-5" />
        <span>
          Time Remaining: {String(mainMinutes).padStart(2, '0')}:
          {String(mainSeconds).padStart(2, '0')}
        </span>
      </div>

      <Card className="border-t-4 border-primary">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground">Task ID: {task.id}</p>
              <CardTitle className="text-xl">{task.title}</CardTitle>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Reward</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(task.reward)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground bg-muted p-3 rounded-md border mb-6">
            {task.description}
          </p>

          <div className="space-y-3">
              <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="flex gap-1">
                      <Input id="fullName" value={task.prefilledData.fullName} readOnly />
                      <CopyButton value={task.prefilledData.fullName} />
                  </div>
              </div>
               <div>
                  <Label htmlFor="gmail">Gmail</Label>
                  <div className="flex gap-1">
                      <Input id="gmail" value={currentGmail} readOnly />
                      <CopyButton value={currentGmail} />
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleRegenerateGmail} className="mt-2 w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Gmail
                  </Button>
              </div>
               <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="flex gap-1">
                      <Input id="password" value={task.prefilledData.password} readOnly type="text" />
                      <CopyButton value={task.prefilledData.password} />
                  </div>
              </div>
               <div>
                  <Label htmlFor="recoveryMail">Recovery Mail {prefilledRecoveryMailExists ? '' : <span className="text-destructive">*</span>}</Label>
                   <div className="flex gap-1">
                      <Input 
                        id="recoveryMail" 
                        value={recoveryMail} 
                        onChange={(e) => setRecoveryMail(e.target.value)} 
                        placeholder={prefilledRecoveryMailExists ? '' : "Enter recovery mail here"}
                        readOnly={prefilledRecoveryMailExists}
                      />
                      {prefilledRecoveryMailExists && <CopyButton value={recoveryMail} />}
                  </div>
              </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button
                  className="w-full h-12 text-base bg-green-500 hover:bg-green-600 text-white"
                  disabled={isCooldownActive}
                  >
                  {isCooldownActive ? (
                      <Clock className="mr-2 h-5 w-5" />
                  ) : (
                      <Send className="mr-2 h-5 w-5" />
                  )}

                  {isCooldownActive
                      ? `Submit in ${String(cooldownMinutes).padStart(2, '0')}:${String(cooldownSeconds).padStart(2, '0')}`
                      : 'I Have Completed The Task'}
                  </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                      <div className="space-y-3 pt-2">
                      <p>By clicking confirm, you agree that you have completed the task exactly as per the rules.</p>
                      </div>
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm & Submit
                  </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip Task
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the current task. You will not be able to complete it later. Are you sure you want to skip?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onTaskComplete} className="bg-destructive hover:bg-destructive/90">Confirm & Skip</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Task Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
             {rulesList.length > 0 ? rulesList.map((rule, index) => <li key={index}>{rule}</li>) : <li>No specific rules for this task.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
