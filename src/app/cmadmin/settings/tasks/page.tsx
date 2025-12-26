
'use client';

import { useEffect, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, ListTodo, Clock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

interface TaskSetting {
    id: string;
    name: string;
    description: string;
    badge: string | null;
    enabled: boolean;
    reward: number;
    rules: string; // Semicolon-separated rules
    receiverId?: string;
    taskDurationSeconds?: number;
    submitCooldownSeconds?: number;
}

const DEFAULT_TASKS: TaskSetting[] = [
    { id: 'gmail', name: 'Gmail Task', description: 'Create a Gmail account following the rules.', badge: 'POPULAR', enabled: true, reward: 5, rules: 'Use provided name; Do not use VPN; Submit recovery mail', taskDurationSeconds: 600, submitCooldownSeconds: 60 },
    { id: 'used-mails', name: 'Used Mails Task', description: 'Submit old, unused email accounts.', badge: 'EASY', enabled: true, reward: 2, rules: 'Must be at least 1 year old; Must not be in use' },
    { id: 'hot-mail', name: 'Hot Mail Task', description: 'Create a Hotmail/Outlook account.', badge: '', enabled: true, reward: 4, rules: '' },
    { id: 'outlook-mail', name: 'Outlook Mail Task', description: 'Create a new Outlook account.', badge: '', enabled: true, reward: 4, rules: '' },
    { id: 'instagram', name: 'Instagram Task', description: 'Create a new Instagram account.', badge: 'NEW', enabled: true, reward: 3, rules: 'Add a profile picture' },
    { id: 'facebook', name: 'Facebook Task', description: 'Create a new Facebook account.', badge: '', enabled: true, reward: 3, rules: 'Complete your profile' },
    { id: 'visit-earn', name: 'Visit & Earn Task', description: 'Visit a website and earn.', badge: '', enabled: true, reward: 0.5, rules: 'Stay on the page for 60 seconds' },
    { id: 'watch-earn', name: 'Watch & Earn Task', description: 'Watch a video to earn rewards.', badge: '', enabled: true, reward: 1, rules: 'Watch the full video' },
    { id: 'niva-coin', name: 'Niva Coin Task', description: 'Complete tasks to earn Niva Coins.', badge: 'HIGH PAY', enabled: true, reward: 10, rules: 'Follow all instructions carefully', receiverId: '' },
    { id: 'top-coin', name: 'Top Coin Task', description: 'Earn Top Coins by completing offers.', badge: 'HIGH PAY', enabled: true, reward: 10, rules: 'Follow all instructions carefully', receiverId: '' },
];


export default function TaskSettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [taskSettings, setTaskSettings] = useState<TaskSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, startSaving] = useTransition();

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('settings')
                .select('task_settings')
                .eq('id', 1)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch task settings.' });
                 setTaskSettings(DEFAULT_TASKS);
            } else if (data && data.task_settings) {
                // Merge saved settings with default tasks to handle new tasks being added
                const savedSettings = data.task_settings as TaskSetting[];
                const savedMap = new Map(savedSettings.map(item => [item.id, item]));
                const mergedSettings = DEFAULT_TASKS.map(defaultTask => 
                    savedMap.has(defaultTask.id) ? { ...defaultTask, ...savedMap.get(defaultTask.id) } : defaultTask
                );
                setTaskSettings(mergedSettings);
            } else {
                // No settings found in DB, use defaults
                setTaskSettings(DEFAULT_TASKS);
            }

            setLoading(false);
        };
        fetchSettings();
    }, [toast]);

    const handleFieldChange = (taskId: string, field: keyof TaskSetting, value: any) => {
        setTaskSettings(prev => 
            prev.map(task => 
                task.id === taskId ? { ...task, [field]: value } : task
            )
        );
    };

    const handleSaveChanges = () => {
        startSaving(async () => {
            const { error } = await supabase
                .from('settings')
                .update({ task_settings: taskSettings })
                .eq('id', 1);

            if (error) {
                toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
            } else {
                toast({ title: 'Success', description: 'Task settings have been updated.' });
            }
        });
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Task Settings</h1>
                    <p className="text-muted-foreground">Enable, disable, and configure all task categories for users.</p>
                </div>
                 <Button variant="outline" onClick={() => router.push('/cmadmin/settings')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Settings
                </Button>
            </div>

            <div className="space-y-6">
                {taskSettings.length > 0 ? (
                    taskSettings.map(task => (
                        <Card key={task.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="capitalize">{task.name}</CardTitle>
                                    <Switch
                                        checked={task.enabled}
                                        onCheckedChange={(checked) => handleFieldChange(task.id, 'enabled', checked)}
                                        disabled={isSaving}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input value={task.name} onChange={(e) => handleFieldChange(task.id, 'name', e.target.value)} disabled={isSaving} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Input value={task.description} onChange={(e) => handleFieldChange(task.id, 'description', e.target.value)} disabled={isSaving} />
                                    </div>
                                </div>
                                 <div className="grid md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label>Badge Text (Optional)</Label>
                                        <Input value={task.badge || ''} onChange={(e) => handleFieldChange(task.id, 'badge', e.target.value)} disabled={isSaving} placeholder="e.g., HOT, NEW" />
                                    </div>
                                     <div className="space-y-2">
                                        <Label>
                                           {(task.id === 'niva-coin' || task.id === 'top-coin') ? 'Reward per 1000 Coins (INR)' : 'Reward (INR)'}
                                        </Label>
                                        <Input type="number" value={task.reward} onChange={(e) => handleFieldChange(task.id, 'reward', parseFloat(e.target.value) || 0)} disabled={isSaving} />
                                    </div>
                                </div>
                                { (task.id === 'niva-coin' || task.id === 'top-coin') && (
                                     <div className="space-y-2">
                                        <Label>Receiver ID</Label>
                                        <Input value={task.receiverId || ''} onChange={(e) => handleFieldChange(task.id, 'receiverId', e.target.value)} disabled={isSaving} placeholder="Enter Receiver ID" />
                                    </div>
                                )}
                                { task.id === 'gmail' && (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Clock className="h-4 w-4"/> Task Duration (seconds)</Label>
                                            <Input 
                                                type="number" 
                                                value={task.taskDurationSeconds ?? 600} 
                                                onChange={(e) => handleFieldChange(task.id, 'taskDurationSeconds', parseInt(e.target.value) || 600)} 
                                                disabled={isSaving} 
                                                placeholder="e.g., 600"
                                            />
                                        </div>
                                         <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Clock className="h-4 w-4"/> Submit Cooldown (seconds)</Label>
                                            <Input 
                                                type="number" 
                                                value={task.submitCooldownSeconds ?? 60} 
                                                onChange={(e) => handleFieldChange(task.id, 'submitCooldownSeconds', parseInt(e.target.value) || 60)} 
                                                disabled={isSaving} 
                                                placeholder="e.g., 60"
                                            />
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Rules (separated by semicolon ';')</Label>
                                    <Textarea 
                                        value={task.rules} 
                                        onChange={(e) => handleFieldChange(task.id, 'rules', e.target.value)}
                                        placeholder="e.g., Rule 1; Rule 2; Rule 3"
                                        disabled={isSaving}
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p>No task settings found. Please initialize them in the database.</p>
                )}
            </div>

            <div className="flex justify-end gap-2">
                <Button onClick={handleSaveChanges} disabled={isSaving || loading}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save All Task Settings
                </Button>
            </div>
        </div>
    );
}
