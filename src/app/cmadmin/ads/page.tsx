
'use client';

import { useEffect, useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Image as ImageIcon, Link as LinkIcon, Text, Megaphone } from 'lucide-react';
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
    { id: 'home', name: 'Home Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhDUVY6cE92FlqnkRm_X5EP55svi1fHG4KAsDJC92ivsR47SqAAZ0UL1P-NTjMBn2OYEJfPnmH-No5qiUM04PZ6wyzyGD3FYB5JoUKOt3jMF9_wG2zfIjd22J3K2HhHq7Aq_c9JiKv0wlg0YQrvhbqOyIORisDRg4w6ZFzPWaD6N7SFu46dCj9MSNC_YsY/s320/vwdC8pCsnzM-HD.jpg', text: '', externalLink: '' } },
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
    { id: 'tasks-start', name: 'Start Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-gmail', name: 'Gmail Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-social', name: 'Social Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-coin', name: 'Coin Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-used-mails', name: 'Used Mails Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-visit-earn', name: 'Visit & Earn Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'tasks-watch-earn', name: 'Watch & Earn Task Page', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'spin-reward', name: 'Spin Reward Page (Main Banner)', isEnabled: true, script: defaultAdScript, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'spin-reward-interstitial', name: 'Spin Reward Page (After Spin Ad)', isEnabled: true, script: { key: 'b31c5dc255761c9f094798ba3a76e1c2', format: 'iframe', height: 250, width: 300, invokeJs: 'https://www.highperformanceformat.com/b31c5dc255761c9f094798ba3a76e1c2/invoke.js'}, customAd: { imageUrl: '', text: '', externalLink: '' } },
    { id: 'spin-reward-button', name: 'Spin Reward Page (Button Ad)', isEnabled: true, script: { key: '9b25ac22cc9ae57f98a864d22c893580', format: 'iframe', height: 90, width: 728, invokeJs: 'https://pl28325955.effectivegatecpm.com/9b25ac22cc9ae57f98a864d22c893580/invoke.js'}, customAd: { imageUrl: '', text: '', externalLink: '' } },
];

export default function AdsManagerPage() {
    const { toast } = useToast();
    const [adConfigs, setAdConfigs] = useState<AdConfig[]>(defaultAdLocations);
    const [areAdsGloballyEnabled, setAreAdsGloballyEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [isSaving, startSaving] = useTransition();

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('settings')
                .select('ad_configs, are_ads_globally_enabled')
                .eq('id', 1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching ad settings:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch ad settings.' });
            } else if (data) {
                const savedAds = (data.ad_configs || []) as AdConfig[];
                
                // Merge saved ads with defaults, adding new defaults if they don't exist
                const allAdIds = new Set(defaultAdLocations.map(ad => ad.id));
                const finalAds = defaultAdLocations.map(defaultAd => {
                    const savedAd = savedAds.find((ad: AdConfig) => ad.id === defaultAd.id);
                    return savedAd ? { ...defaultAd, ...savedAd } : defaultAd;
                });

                // Add any saved ads that are no longer in the default list (for backwards compatibility)
                savedAds.forEach((savedAd: AdConfig) => {
                    if (!allAdIds.has(savedAd.id)) {
                        finalAds.push(savedAd);
                    }
                });
                
                setAdConfigs(finalAds);
                setAreAdsGloballyEnabled(data.are_ads_globally_enabled ?? true);
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
            prev.map(ad => {
                if (ad.id === id) {
                    const newScript = { ...ad.script, [field]: value };
                     // Convert height/width to numbers
                    if (field === 'height' || field === 'width') {
                        newScript[field] = parseInt(String(value), 10) || 0;
                    }
                    return { ...ad, script: newScript };
                }
                return ad;
            })
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
            const { error } = await supabase
                .from('settings')
                .update({ 
                    ad_configs: adConfigs,
                    are_ads_globally_enabled: areAdsGloballyEnabled,
                })
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
            
            <Card>
                <CardHeader>
                    <CardTitle>Global Ad Control</CardTitle>
                    <CardDescription>Use this master switch to enable or disable all ads throughout the app at once.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
                        <Label htmlFor="global-ads-enabled" className="font-semibold text-lg flex items-center gap-2">
                           <Megaphone />
                           Enable All Ads Globally
                        </Label>
                        <Switch
                            id="global-ads-enabled"
                            checked={areAdsGloballyEnabled}
                            onCheckedChange={setAreAdsGloballyEnabled}
                            disabled={isSaving}
                        />
                    </div>
                </CardContent>
            </Card>

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
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Height (px)</Label>
                                            <Input type="number" value={ad.script.height} onChange={(e) => handleScriptChange(ad.id, 'height', e.target.value)} disabled={isSaving} />
                                        </div>
                                         <div className="space-y-2">
                                            <Label>Width (px)</Label>
                                            <Input type="number" value={ad.script.width} onChange={(e) => handleScriptChange(ad.id, 'width', e.target.value)} disabled={isSaving} />
                                        </div>
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
