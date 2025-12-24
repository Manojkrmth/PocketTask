
'use client';

import { useEffect, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, ListTodo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TaskSetting {
    id: string;
    name: string;
    description: string;
    badge: string | null;
    enabled: boolean;
    reward: number;
    rules: string; // Semicolon-separated rules
    receiverId?: string;
}

export default function TaskSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<any>(null);
    const [taskSettings, setTaskSettings] = useState<TaskSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, startSaving] = useTransition();

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('settings')
                .select('settings_data')
                .eq('id', 1)
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch app settings.' });
            } else {
                setSettings(data.settings_data);
                // Ensure default values if fields are missing
                const initializedSettings = (data.settings_data.taskSettings || []).map((task: any) => ({
                    reward: 0,
                    rules: '',
                    ...task
                }));
                setTaskSettings(initializedSettings);
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
            const updatedSettings = {
                ...settings,
                taskSettings: taskSettings
            };

            const { error } = await supabase
                .from('settings')
                .update({ settings_data: updatedSettings })
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
            <div>
                <h1 className="text-3xl font-bold">Task Settings</h1>
                <p className="text-muted-foreground">Enable, disable, and configure all task categories for users.</p>
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
                                        <Label>Reward (INR)</Label>
                                        <Input type="number" value={task.reward} onChange={(e) => handleFieldChange(task.id, 'reward', parseFloat(e.target.value) || 0)} disabled={isSaving} />
                                    </div>
                                </div>
                                { (task.id === 'niva-coin' || task.id === 'top-coin') && (
                                     <div className="space-y-2">
                                        <Label>Receiver ID</Label>
                                        <Input value={task.receiverId || ''} onChange={(e) => handleFieldChange(task.id, 'receiverId', e.target.value)} disabled={isSaving} placeholder="Enter Receiver ID" />
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
