
'use client';

import { useEffect, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Megaphone, Image as ImageIcon, Link as LinkIcon, Text } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';


interface AdConfig {
    id: string;
    name: string;
    isEnabled: boolean;
    script: {
        key: string;
        format: 'iframe';
        height: number;
        width: number;
        invokeJs: string;
    },
    customAd: {
        imageUrl: string;
        text: string;
        externalLink: string;
    }
}

const defaultAdScript = {
    key: '424fa6466dbb5ba0acc3357b75ce0e6e',
    format: 'iframe' as const,
    height: 50,
    width: 320,
    invokeJs: 'https://www.highperformanceformat.com/424fa6466dbb5ba0acc3357b75ce0e6e/invoke.js'
};

const defaultAdLocations: AdConfig[] = [
    { id: 'home', name: 'Home Page', isEnabled: true, script: {key: '', format: 'iframe', height: 50, width: 320, invokeJs: ''}, customAd: { imageUrl: 'https://placehold.co/320x50/eee/31343C?text=My+Custom+Ad', text: 'Special Offer!', externalLink: 'https://google.com' } },
    { id: 'notifications', name: 'Notifications Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'team', name: 'Team Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks', name: 'Tasks Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'task-history', name: 'Task History Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'withdraw', name: 'Withdraw Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'wallet-history', name: 'Wallet History Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'profile', name: 'Profile Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'support-ticket', name: 'Support Ticket Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'support-history', name: 'Support History Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'change-password', name: 'Change Password Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'currency', name: 'Currency Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'edit-profile', name: 'Edit Profile Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'contact', name: 'Contact Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'spin-reward', name: 'Spin & Win Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-start', name: 'Start Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-gmail', name: 'Gmail Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-social', name: 'Social Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-coin', name: 'Coin Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-used-mails', name: 'Used Mails Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-visit-earn', name: 'Visit & Earn Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-watch-earn', name: 'Watch & Earn Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
];

export default function AdsManagerPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<any>(null);
    const [adConfigs, setAdConfigs] = useState<AdConfig[]>(defaultAdLocations);
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
                const savedAds = data.settings_data.ads || [];
                const mergedAds = defaultAdLocations.map(defaultAd => {
                    const savedAd = savedAds.find((ad: AdConfig) => ad.id === defaultAd.id);
                    return savedAd ? { ...defaultAd, ...savedAd } : defaultAd;
                });
                setAdConfigs(mergedAds);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [toast]);
    
    const handleAdChange = (id: string, field: string, value: any) => {
        setAdConfigs(prev => 
            prev.map(ad => 
                ad.id === id ? { ...ad, [field]: value } : ad
            )
        );
    };

    const handleScriptChange = (id: string, field: string, value: any) => {
        setAdConfigs(prev =>
            prev.map(ad => 
                ad.id === id ? { ...ad, script: { ...ad.script, [field]: value } } : ad
            )
        );
    }
    
    const handleCustomAdChange = (id: string, field: string, value: any) => {
        setAdConfigs(prev =>
            prev.map(ad => 
                ad.id === id ? { ...ad, customAd: { ...ad.customAd, [field]: value } } : ad
            )
        );
    }

    const handleSaveChanges = () => {
        startSaving(async () => {
            const updatedSettings = {
                ...settings,
                ads: adConfigs
            };

            const { error } = await supabase
                .from('settings')
                .update({ settings_data: updatedSettings })
                .eq('id', 1);

            if (error) {
                toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
            } else {
                toast({ title: 'Success', description: 'Ad settings have been updated.' });
            }
        });
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Ads Manager</h1>
                <p className="text-muted-foreground">Control ads displayed across the application.</p>
            </div>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
                {adConfigs.map(ad => (
                <Card key={ad.id} className="overflow-hidden">
                    <AccordionItem value={ad.id} className="border-b-0">
                    <AccordionTrigger className="p-4 hover:no-underline hover:bg-muted/50">
                        <div className="flex items-center justify-between w-full">
                            <div className="text-left">
                                <h3 className="font-semibold text-lg">{ad.name}</h3>
                                <p className="text-sm text-muted-foreground">ID: {ad.id}</p>
                            </div>
                            <Badge className={cn(ad.isEnabled ? 'bg-green-500' : 'bg-destructive')}>
                                {ad.isEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                         <div className="space-y-6 border-t pt-6">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <Label htmlFor={`enabled-${ad.id}`} className="font-medium">Enable Ad on this Page</Label>
                                <Switch
                                    id={`enabled-${ad.id}`}
                                    checked={ad.isEnabled}
                                    onCheckedChange={(checked) => handleAdChange(ad.id, 'isEnabled', checked)}
                                    disabled={isSaving}
                                />
                            </div>
                           
                           {ad.isEnabled && (
                            <div className="space-y-6">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Script Ad</CardTitle>
                                    <CardDescription>Use this for ad networks like Google AdSense, etc.</CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                      <div className="space-y-2">
                                          <Label>Ad Key</Label>
                                          <Input value={ad.script.key} onChange={(e) => handleScriptChange(ad.id, 'key', e.target.value)} disabled={isSaving} />
                                      </div>
                                      <div className="space-y-2">
                                          <Label>Invoke.js URL</Label>
                                          <Input value={ad.script.invokeJs} onChange={(e) => handleScriptChange(ad.id, 'invokeJs', e.target.value)} disabled={isSaving} />
                                      </div>
                                  </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Custom Ad</CardTitle>
                                        <CardDescription>If no script is provided, this custom ad will be shown.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                       <div className="space-y-2">
                                          <Label className="flex items-center gap-2"><ImageIcon/> Image URL</Label>
                                          <Input value={ad.customAd.imageUrl} onChange={(e) => handleCustomAdChange(ad.id, 'imageUrl', e.target.value)} disabled={isSaving} />
                                      </div>
                                       <div className="space-y-2">
                                          <Label className="flex items-center gap-2"><LinkIcon/> External Link</Label>
                                          <Input value={ad.customAd.externalLink} onChange={(e) => handleCustomAdChange(ad.id, 'externalLink', e.target.value)} disabled={isSaving} />
                                      </div>
                                       <div className="space-y-2">
                                          <Label className="flex items-center gap-2"><Text/> Ad Text (Optional)</Label>
                                          <Textarea value={ad.customAd.text} onChange={(e) => handleCustomAdChange(ad.id, 'text', e.target.value)} disabled={isSaving} />
                                      </div>
                                    </CardContent>
                                </Card>
                            </div>
                           )}

                         </div>
                    </AccordionContent>
                    </AccordionItem>
                </Card>
                ))}
            </Accordion>

            <div className="flex justify-end gap-2 mt-6">
                <Button onClick={handleSaveChanges} disabled={isSaving || loading}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save All Ad Settings
                </Button>
            </div>
        </div>
    );
}
