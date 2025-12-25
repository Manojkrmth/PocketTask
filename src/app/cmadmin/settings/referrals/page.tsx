
'use client';

import { useEffect, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, Users, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const MAX_LEVELS = 5;

export default function ReferralSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<any>(null);
    const [commissions, setCommissions] = useState<number[]>(Array(MAX_LEVELS).fill(0));
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
                const savedCommissions = data.settings_data.referralCommissions || [];
                // Ensure the array has exactly MAX_LEVELS elements
                const finalCommissions = Array.from({ length: MAX_LEVELS }, (_, i) => savedCommissions[i] || 0);
                setCommissions(finalCommissions);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [toast]);

    const handleCommissionChange = (levelIndex: number, value: string) => {
        const newCommissions = [...commissions];
        const numValue = parseFloat(value);
        newCommissions[levelIndex] = isNaN(numValue) ? 0 : Math.max(0, numValue); // Ensure non-negative
        setCommissions(newCommissions);
    };

    const handleSaveChanges = () => {
        startSaving(async () => {
            const updatedSettings = {
                ...settings,
                referralCommissions: commissions
            };

            const { error } = await supabase
                .from('settings')
                .update({ settings_data: updatedSettings })
                .eq('id', 1);

            if (error) {
                toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
            } else {
                toast({ title: 'Success', description: 'Referral commission settings have been updated.' });
            }
        });
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Referral Settings</h1>
                <p className="text-muted-foreground">Manage multi-level referral commission percentages.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users /> Referral Commissions</CardTitle>
                    <CardDescription>Set the commission percentage for each referral level. This is calculated based on the earnings of the referred user.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {commissions.map((commission, index) => (
                        <div key={index} className="space-y-2">
                            <Label htmlFor={`level-${index + 1}`} className="font-semibold">
                                Level {index + 1} Commission
                            </Label>
                            <div className="relative">
                                <Input
                                    id={`level-${index + 1}`}
                                    type="number"
                                    value={commission}
                                    onChange={(e) => handleCommissionChange(index, e.target.value)}
                                    disabled={isSaving}
                                    className="pl-8"
                                    min="0"
                                />
                                <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button onClick={handleSaveChanges} disabled={isSaving || loading}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Referral Settings
                </Button>
            </div>
        </div>
    );
}
