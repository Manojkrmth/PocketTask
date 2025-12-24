
'use client';

import { useEffect, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, ListTodo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TaskSetting {
    id: string;
    name: string;
    description: string;
    badge: string | null;
    enabled: boolean;
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
                setTaskSettings(data.settings_data.taskSettings || []);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [toast]);

    const handleToggleChange = (taskId: string, enabled: boolean) => {
        setTaskSettings(prev => 
            prev.map(task => 
                task.id === taskId ? { ...task, enabled } : task
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
                <p className="text-muted-foreground">Enable or disable different task categories for users.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Task Categories</CardTitle>
                    <CardDescription>Use the toggles to show or hide task types from the user's task list.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {taskSettings.length > 0 ? (
                        taskSettings.map(task => (
                             <div key={task.id} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor={`task-${task.id}`} className="text-base font-medium">{task.name}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {task.description}
                                    </p>
                                </div>
                                <Switch
                                    id={`task-${task.id}`}
                                    checked={task.enabled}
                                    onCheckedChange={(checked) => handleToggleChange(task.id, checked)}
                                    disabled={isSaving}
                                />
                            </div>
                        ))
                    ) : (
                        <p>No task settings found. Please initialize them in the database.</p>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button onClick={handleSaveChanges} disabled={isSaving || loading}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Task Settings
                </Button>
            </div>
        </div>
    );
}
