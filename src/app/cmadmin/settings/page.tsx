
'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Link as LinkIcon, Settings, Image as ImageIcon, Text, Info, ToggleLeft, IndianRupee, Megaphone, ListTodo, Wallet, Gift, AlertTriangle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InstagramIcon, TelegramIcon, WhatsAppIcon } from '@/components/icons';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [settings, setSettings] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [isSaving, startSaving] = useTransition();
    
    // Individual saving states for each card
    const [isFinancialSaving, startFinancialSaving] = useTransition();
    const [isNoticeSaving, startNoticeSaving] = useTransition();
    const [isSocialSaving, startSocialSaving] = useTransition();
    const [isPopupSaving, startPopupSaving] = useTransition();


    useEffect(() => {
        const fetchAllSettings = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from('settings')
                .select('settings_data')
                .eq('id', 1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching settings:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch app settings.' });
            } else if (data) {
                setSettings(data.settings_data || {});
            }

            setLoading(false);
        };
        
        fetchAllSettings();
    }, [toast]);

    const handleInputChange = (category: string, key: string, value: any) => {
        setSettings((prev: any) => ({
            ...prev,
            [category]: {
                ...(prev?.[category] || {}),
                [key]: value
            }
        }));
    };
    
    const handleTopLevelChange = (key: string, value: any) => {
         setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSaveSection = async (sectionKey: string | string[], startTransition: React.TransitionStartFunction) => {
        startTransition(async () => {
             const { data: currentSettingsData, error: fetchError } = await supabase
                .from('settings')
                .select('settings_data')
                .eq('id', 1)
                .single();

            if (fetchError) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch latest settings before saving.' });
                return;
            }

            let updatedSettingsData = { ...currentSettingsData.settings_data };
            
            if(Array.isArray(sectionKey)) {
                sectionKey.forEach(key => {
                    updatedSettingsData[key] = settings[key];
                });
            } else {
                 updatedSettingsData[sectionKey] = settings[sectionKey];
            }

            const { error } = await supabase
                .from('settings')
                .update({ settings_data: updatedSettingsData })
                .eq('id', 1);

            if (error) {
                toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
            } else {
                toast({ title: 'Success', description: 'Settings have been updated.' });
            }
        });
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!settings) {
        return <p>Could not load settings. Please ensure they are initialized in the database.</p>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">App Settings</h1>
                <p className="text-muted-foreground">Manage global settings for your application.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Referral Settings</CardTitle>
                    <CardDescription>Manage multi-level referral commission percentages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/cmadmin/settings/referrals')}>
                        Manage Referral Commissions
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" /> Featured Offers</CardTitle>
                    <CardDescription>Control the promotional offers carousel on the home page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/cmadmin/settings/offers')}>
                        Manage Featured Offers
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ListTodo className="h-5 w-5 text-primary" /> Task Settings</CardTitle>
                    <CardDescription>Enable, disable, or reorder task categories for users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/cmadmin/settings/tasks')}>
                        Manage Task Settings
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> Withdrawal Settings</CardTitle>
                    <CardDescription>Control withdrawal methods, minimums, and charges.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/cmadmin/settings/withdraw')}>
                        Manage Withdrawal Settings
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><IndianRupee className="h-5 w-5 text-primary" /> Financial Settings</CardTitle>
                    <CardDescription>Manage currency rates and other financial settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="usdRate" className="flex items-center gap-2">USD to INR Exchange Rate</Label>
                        <Input 
                            id="usdRate" 
                            type="number"
                            value={settings.usdToInrRate || ''} 
                            onChange={(e) => handleTopLevelChange('usdToInrRate', parseFloat(e.target.value) || 0)} 
                            disabled={isFinancialSaving}
                            placeholder="e.g., 85"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => handleSaveSection('usdToInrRate', startFinancialSaving)} disabled={isFinancialSaving}>
                        {isFinancialSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Financial Settings
                    </Button>
                </CardFooter>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Notice Board</CardTitle>
                    <CardDescription>This text scrolls across the top of the home page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="noticeBoardText">Scrolling Notice Text</Label>
                        <Input 
                            id="noticeBoardText" 
                            type="text"
                            value={settings.noticeBoardText || ''} 
                            onChange={(e) => handleTopLevelChange('noticeBoardText', e.target.value)} 
                            disabled={isNoticeSaving}
                            placeholder="e.g., Welcome! New tasks available."
                        />
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button onClick={() => handleSaveSection('noticeBoardText', startNoticeSaving)} disabled={isNoticeSaving}>
                        {isNoticeSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Notice Board
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5 text-primary" /> Social Media Links</CardTitle>
                    <CardDescription>These links appear on the home and profile pages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="flex items-center gap-2"><WhatsAppIcon className="h-4 w-4" /> WhatsApp Group Link</Label>
                        <Input id="whatsapp" value={settings.socialLinks?.whatsapp || ''} onChange={(e) => handleInputChange('socialLinks', 'whatsapp', e.target.value)} disabled={isSocialSaving} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="telegram" className="flex items-center gap-2"><TelegramIcon className="h-4 w-4" /> Telegram Channel Link</Label>
                        <Input id="telegram" value={settings.socialLinks?.telegram || ''} onChange={(e) => handleInputChange('socialLinks', 'telegram', e.target.value)} disabled={isSocialSaving} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="instagram" className="flex items-center gap-2"><InstagramIcon className="h-4 w-4" /> Instagram Profile Link</Label>
                        <Input id="instagram" value={settings.socialLinks?.instagram || ''} onChange={(e) => handleInputChange('socialLinks', 'instagram', e.target.value)} disabled={isSocialSaving} />
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button onClick={() => handleSaveSection('socialLinks', startSocialSaving)} disabled={isSocialSaving}>
                        {isSocialSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Social Links
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Pop-up Notice</CardTitle>
                    <CardDescription>Configure the promotional pop-up shown to users on launch.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label htmlFor="popup-enabled" className="text-base">Enable Pop-up</Label>
                            <p className="text-sm text-muted-foreground">
                                If enabled, this pop-up will be shown to users once per session.
                            </p>
                        </div>
                        <Switch
                            id="popup-enabled"
                            checked={settings.popupNotice?.isEnabled || false}
                            onCheckedChange={(checked) => handleInputChange('popupNotice', 'isEnabled', checked)}
                            disabled={isPopupSaving}
                        />
                    </div>
                     
                    {settings.popupNotice?.isEnabled && (
                        <div className="space-y-4 pt-4 border-t">
                             <div className="space-y-2">
                                <Label className="flex items-center gap-2"><ToggleLeft /> Display Type</Label>
                                <Select value={settings.popupNotice?.displayType || 'text'} onValueChange={(value) => handleInputChange('popupNotice', 'displayType', value)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text Only</SelectItem>
                                        <SelectItem value="image">Image Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {settings.popupNotice?.displayType === 'text' && (
                                <div className="space-y-2">
                                    <Label htmlFor="popup-text" className="flex items-center gap-2"><Text /> Pop-up Text</Label>
                                    <Input id="popup-text" value={settings.popupNotice?.text || ''} onChange={(e) => handleInputChange('popupNotice', 'text', e.target.value)} disabled={isPopupSaving} />
                                </div>
                            )}

                             {settings.popupNotice?.displayType === 'image' && (
                                <div className="space-y-2">
                                    <Label htmlFor="popup-image" className="flex items-center gap-2"><ImageIcon /> Image URL</Label>
                                    <Input id="popup-image" value={settings.popupNotice?.imageUrl || ''} onChange={(e) => handleInputChange('popupNotice', 'imageUrl', e.target.value)} disabled={isPopupSaving} />
                                </div>
                            )}

                             <div className="space-y-2">
                                <Label htmlFor="popup-redirect" className="flex items-center gap-2"><LinkIcon /> Redirect Link (Optional)</Label>
                                <Input id="popup-redirect" placeholder="https://example.com" value={settings.popupNotice?.redirectLink || ''} onChange={(e) => handleInputChange('popupNotice', 'redirectLink', e.target.value)} disabled={isPopupSaving} />
                            </div>
                        </div>
                    )}
                </CardContent>
                 <CardFooter>
                    <Button onClick={() => handleSaveSection('popupNotice', startPopupSaving)} disabled={isPopupSaving}>
                        {isPopupSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Pop-up Notice
                    </Button>
                </CardFooter>
            </Card>
            
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle /> Danger Zone</CardTitle>
                    <CardDescription>Advanced settings that can have major effects on the application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" onClick={() => router.push('/cmadmin/settings/danger')}>
                        Go to Danger Zone
                    </Button>
                </CardContent>
            </Card>

        </div>
    );
}
