
'use client';

import { useEffect, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, Wallet, IndianRupee, Percent, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

interface MethodSetting {
    id: string;
    name: string;
    enabled: boolean;
}

interface WithdrawalSettings {
    minAmount: number;
    chargesPercent: number;
    methods: MethodSetting[];
}

export default function WithdrawalSettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [withdrawalSettings, setWithdrawalSettings] = useState<WithdrawalSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, startSaving] = useTransition();

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('settings')
                .select('withdrawal_settings')
                .eq('id', 1)
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch app settings.' });
            } else if (data) {
                setWithdrawalSettings(data.withdrawal_settings || { minAmount: 0, chargesPercent: 0, methods: [] });
            }
            setLoading(false);
        };
        fetchSettings();
    }, [toast]);

    const handleMethodToggle = (methodId: string, enabled: boolean) => {
        if (!withdrawalSettings) return;
        setWithdrawalSettings(prev => ({
            ...prev!,
            methods: prev!.methods.map(method => 
                method.id === methodId ? { ...method, enabled } : method
            )
        }));
    };
    
    const handleInputChange = (field: 'minAmount' | 'chargesPercent', value: string) => {
         if (!withdrawalSettings) return;
         const numValue = parseFloat(value);
         if (isNaN(numValue)) return;
         
         setWithdrawalSettings(prev => ({
             ...prev!,
             [field]: numValue
         }));
    };

    const handleSaveChanges = () => {
        if (!withdrawalSettings) return;

        startSaving(async () => {
            const { error } = await supabase
                .from('settings')
                .update({ withdrawal_settings: withdrawalSettings })
                .eq('id', 1);

            if (error) {
                toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
            } else {
                toast({ title: 'Success', description: 'Withdrawal settings have been updated.' });
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
                    <h1 className="text-3xl font-bold">Withdrawal Settings</h1>
                    <p className="text-muted-foreground">Control all aspects of user withdrawals.</p>
                </div>
                 <Button variant="outline" onClick={() => router.push('/cmadmin/settings')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Settings
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="minAmount" className="flex items-center gap-2"><IndianRupee /> Minimum Withdrawal Amount (INR)</Label>
                        <Input
                            id="minAmount"
                            type="number"
                            value={withdrawalSettings?.minAmount ?? ''}
                            onChange={(e) => handleInputChange('minAmount', e.target.value)}
                            disabled={isSaving}
                            placeholder="e.g., 500"
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="chargesPercent" className="flex items-center gap-2"><Percent /> Withdrawal Charges (%)</Label>
                        <Input
                            id="chargesPercent"
                            type="number"
                            value={withdrawalSettings?.chargesPercent ?? ''}
                            onChange={(e) => handleInputChange('chargesPercent', e.target.value)}
                            disabled={isSaving}
                            placeholder="e.g., 5"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wallet /> Manage Withdrawal Methods</CardTitle>
                    <CardDescription>Use the toggles to enable or disable payment methods for users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {withdrawalSettings?.methods && withdrawalSettings.methods.length > 0 ? (
                        withdrawalSettings.methods.map(method => (
                             <div key={method.id} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor={`method-${method.id}`} className="text-base font-medium">{method.name}</Label>
                                </div>
                                <Switch
                                    id={`method-${method.id}`}
                                    checked={method.enabled}
                                    onCheckedChange={(checked) => handleMethodToggle(method.id, checked)}
                                    disabled={isSaving}
                                />
                            </div>
                        ))
                    ) : (
                        <p>No withdrawal methods found. Please initialize them in the database.</p>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button onClick={handleSaveChanges} disabled={isSaving || loading}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Withdrawal Settings
                </Button>
            </div>
        </div>
    );
}
