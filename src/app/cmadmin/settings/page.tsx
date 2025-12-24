
'use client';

import { useEffect, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Link as LinkIcon, Settings, Image as ImageIcon, Text, Info, ToggleLeft, IndianRupee, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InstagramIcon, TelegramIcon, WhatsAppIcon } from '@/components/icons';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<any>(null);
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
            }
            setLoading(false);
        };
        fetchSettings();
    }, [toast]);

    const handleInputChange = (category: string, key: string, value: any) => {
        setSettings((prev: any) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
    };
    
    const handleTopLevelChange = (key: string, value: any) => {
         setSettings((prev: any) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handlePopupStyleChange = (key: string, value: string) => {
         setSettings((prev: any) => ({
            ...prev,
            popupNotice: {
                ...prev.popupNotice,
                styles: {
                    ...prev.popupNotice.styles,
                    [key]: value
                }
            }
        }));
    }

    const handleSaveChanges = () => {
        startSaving(async () => {
            const { error } = await supabase
                .from('settings')
                .update({ settings_data: settings })
                .eq('id', 1);

            if (error) {
                toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
            } else {
                toast({ title: 'Success', description: 'App settings have been updated.' });
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
                    <CardTitle className="flex items-center gap-2"><IndianRupee className="h-5 w-5 text-primary" /> Financial Settings</CardTitle>
                    <CardDescription>Manage currency rates and withdrawal settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="usdRate" className="flex items-center gap-2">USD to INR Exchange Rate</Label>
                        <Input 
                            id="usdRate" 
                            type="number"
                            value={settings.usdToInrRate || ''} 
                            onChange={(e) => handleTopLevelChange('usdToInrRate', parseFloat(e.target.value) || 0)} 
                            disabled={isSaving}
                            placeholder="e.g., 85"
                        />
                    </div>
                </CardContent>
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
                            disabled={isSaving}
                            placeholder="e.g., Welcome! New tasks available."
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5 text-primary" /> Social Media Links</CardTitle>
                    <CardDescription>These links appear on the home and profile pages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="flex items-center gap-2"><WhatsAppIcon className="h-4 w-4" /> WhatsApp Group Link</Label>
                        <Input id="whatsapp" value={settings.socialLinks?.whatsapp || ''} onChange={(e) => handleInputChange('socialLinks', 'whatsapp', e.target.value)} disabled={isSaving} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="telegram" className="flex items-center gap-2"><TelegramIcon className="h-4 w-4" /> Telegram Channel Link</Label>
                        <Input id="telegram" value={settings.socialLinks?.telegram || ''} onChange={(e) => handleInputChange('socialLinks', 'telegram', e.target.value)} disabled={isSaving} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="instagram" className="flex items-center gap-2"><InstagramIcon className="h-4 w-4" /> Instagram Profile Link</Label>
                        <Input id="instagram" value={settings.socialLinks?.instagram || ''} onChange={(e) => handleInputChange('socialLinks', 'instagram', e.target.value)} disabled={isSaving} />
                    </div>
                </CardContent>
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
                            disabled={isSaving}
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
                                    <Input id="popup-text" value={settings.popupNotice?.text || ''} onChange={(e) => handleInputChange('popupNotice', 'text', e.target.value)} disabled={isSaving} />
                                </div>
                            )}

                             {settings.popupNotice?.displayType === 'image' && (
                                <div className="space-y-2">
                                    <Label htmlFor="popup-image" className="flex items-center gap-2"><ImageIcon /> Image URL</Label>
                                    <Input id="popup-image" value={settings.popupNotice?.imageUrl || ''} onChange={(e) => handleInputChange('popupNotice', 'imageUrl', e.target.value)} disabled={isSaving} />
                                </div>
                            )}

                             <div className="space-y-2">
                                <Label htmlFor="popup-redirect" className="flex items-center gap-2"><LinkIcon /> Redirect Link (Optional)</Label>
                                <Input id="popup-redirect" placeholder="https://example.com" value={settings.popupNotice?.redirectLink || ''} onChange={(e) => handleInputChange('popupNotice', 'redirectLink', e.target.value)} disabled={isSaving} />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button onClick={handleSaveChanges} disabled={isSaving || loading}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save All Settings
                </Button>
            </div>
        </div>
    );
}
