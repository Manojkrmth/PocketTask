
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, PlusCircle, Trash2, Eye, EyeOff } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
  deletable: boolean;
}

const initialSettings = {
  general: {
    appName: 'CookieMail',
    supportEmail: 'manojmukhiyamth@gmail.com',
  },
  withdrawal: {
    minAmount: 500,
    chargesPercent: 2,
    methods: [
      { id: 'upi', name: 'UPI', enabled: true, deletable: false },
      { id: 'bank', name: 'Bank Transfer', enabled: true, deletable: false },
      { id: 'usdt_bep20', name: 'USDT (BEP20)', enabled: true, deletable: false },
      { id: 'binance', name: 'Binance', enabled: true, deletable: false },
    ],
  },
  referral: {
    bonusAmount: 10,
    level1Commission: 10,
    level2Commission: 5,
  },
  tasks: {
    gmailReward: 10,
    instagramReward: 5,
  },
  ui: {
    noticeBoardText: 'Welcome! Complete tasks and earn big rewards.',
  },
  socialLinks: {
    whatsapp: 'https://whatsapp.com',
    telegram: 'https://telegram.org',
    instagram: 'https://instagram.com',
  },
  popupNotice: {
    isEnabled: false,
    displayType: 'text',
    text: '',
    imageUrl: '',
    redirectLink: '',
    styles: { container: '', text: '' }
  }
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(initialSettings);
  const [isSaving, startSaving] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('settings_data')
        .single();
      
      if (data && data.settings_data) {
        // Merge fetched data with initial settings to ensure all keys exist
        setSettings((prev: any) => ({
          ...prev,
          ...data.settings_data,
          withdrawal: { ...prev.withdrawal, ...(data.settings_data.withdrawal || {}) },
          referral: { ...prev.referral, ...(data.settings_data.referral || {}) },
          ui: { ...prev.ui, ...(data.settings_data.ui || {}) },
          socialLinks: { ...prev.socialLinks, ...(data.settings_data.socialLinks || {}) },
          popupNotice: { ...prev.popupNotice, ...(data.settings_data.popupNotice || {}) },
        }));
      } else if (error && error.code !== 'PGRST116') {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load settings.' });
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, [toast]);

  const handleInputChange = (
    section: keyof typeof settings,
    key: string,
    value: any
  ) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };
  
  const handlePaymentMethodChange = (index: number, key: keyof PaymentMethod, value: any) => {
      const newMethods = [...settings.withdrawal.methods];
      (newMethods[index] as any)[key] = value;
      handleInputChange('withdrawal', 'methods', newMethods);
  };
  
  const addNewPaymentMethod = () => {
      const newId = `method_${Date.now()}`;
      const newMethods = [...settings.withdrawal.methods, { id: newId, name: 'New Method', enabled: true, deletable: true }];
      handleInputChange('withdrawal', 'methods', newMethods);
  };

  const removePaymentMethod = (index: number) => {
      const newMethods = settings.withdrawal.methods.filter((_: any, i: number) => i !== index);
      handleInputChange('withdrawal', 'methods', newMethods);
  };


  const handleSave = () => {
    startSaving(async () => {
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 1, settings_data: settings }, { onConflict: 'id' });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error Saving Settings',
          description: error.message,
        });
      } else {
        toast({
          title: 'Settings Saved',
          description: 'Your changes have been saved successfully.',
        });
      }
    });
  };
  
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Settings</h1>
          <p className="text-muted-foreground">
            Manage global settings for your application.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          {(isSaving || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Popup Notice</CardTitle>
            <CardDescription>Configure a promotional popup for users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center space-x-2">
                <Switch 
                  id="popup-enabled" 
                  checked={settings.popupNotice?.isEnabled || false}
                  onCheckedChange={(checked) => handleInputChange('popupNotice', 'isEnabled', checked)}
                />
                <Label htmlFor="popup-enabled" className="text-lg">
                  {settings.popupNotice?.isEnabled ? <span className='flex items-center gap-2'><Eye/> Visible</span> : <span className='flex items-center gap-2'><EyeOff/> Hidden</span>}
                </Label>
            </div>
             {settings.popupNotice?.isEnabled && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg'>
                  <div className="space-y-2">
                      <Label htmlFor="popup-type">Display Type</Label>
                      <Select
                          value={settings.popupNotice?.displayType || 'text'}
                          onValueChange={(value) => handleInputChange('popupNotice', 'displayType', value)}
                      >
                          <SelectTrigger id="popup-type">
                              <SelectValue placeholder="Select display type" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="text">Text Only</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                   <div className="space-y-2">
                        <Label htmlFor="popup-redirect">Redirect Link (Optional)</Label>
                        <Input
                            id="popup-redirect"
                            value={settings.popupNotice?.redirectLink || ''}
                            onChange={(e) => handleInputChange('popupNotice', 'redirectLink', e.target.value)}
                            placeholder="https://example.com"
                        />
                    </div>
                  {settings.popupNotice?.displayType === 'image' ? (
                     <div className="space-y-2 col-span-full">
                        <Label htmlFor="popup-image">Image URL</Label>
                        <Input
                            id="popup-image"
                            value={settings.popupNotice?.imageUrl || ''}
                            onChange={(e) => handleInputChange('popupNotice', 'imageUrl', e.target.value)}
                            placeholder="https://your-image-url.com/image.png"
                        />
                         {settings.popupNotice?.imageUrl && <img src={settings.popupNotice.imageUrl} alt="preview" className="mt-2 rounded-lg max-h-48"/>}
                    </div>
                  ) : (
                    <>
                       <div className="space-y-2">
                          <Label htmlFor="popup-text">Popup Text</Label>
                          <Textarea
                              id="popup-text"
                              value={settings.popupNotice?.text || ''}
                              onChange={(e) => handleInputChange('popupNotice', 'text', e.target.value)}
                              placeholder="BIG SALE! 50% OFF!"
                          />
                      </div>
                       <div className="space-y-2">
                          <Label>Styling</Label>
                           <Alert>
                              <AlertDescription>
                                For advanced styling, use Tailwind CSS classes below.
                              </AlertDescription>
                          </Alert>
                           <Input
                              value={settings.popupNotice?.styles?.container || ''}
                              onChange={(e) => handleInputChange('popupNotice', 'styles', {...settings.popupNotice?.styles, container: e.target.value})}
                              placeholder="Container classes (e.g., bg-blue-500)"
                          />
                           <Input
                              value={settings.popupNotice?.styles?.text || ''}
                              onChange={(e) => handleInputChange('popupNotice', 'styles', {...settings.popupNotice?.styles, text: e.target.value})}
                              placeholder="Text classes (e.g., text-white font-bold)"
                          />
                      </div>
                    </>
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Withdrawal Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="min-withdrawal">Minimum Withdrawal (INR)</Label>
              <Input
                id="min-withdrawal"
                type="number"
                value={settings.withdrawal.minAmount}
                onChange={(e) =>
                  handleInputChange(
                    'withdrawal',
                    'minAmount',
                    Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-charges">
                Withdrawal Charges (%)
              </Label>
              <Input
                id="withdrawal-charges"
                type="number"
                value={settings.withdrawal.chargesPercent}
                onChange={(e) =>
                  handleInputChange(
                    'withdrawal',
                    'chargesPercent',
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
                Add and manage withdrawal payment methods.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {settings.withdrawal.methods.map((method: any, index: number) => (
                <div key={method.id} className="flex items-end gap-2 rounded-lg border p-3">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label htmlFor={`method-id-${index}`} className="text-xs">ID</Label>
                            <Input 
                                id={`method-id-${index}`}
                                value={method.id}
                                onChange={(e) => handlePaymentMethodChange(index, 'id', e.target.value)}
                                placeholder="e.g., upi"
                                readOnly={!method.deletable}
                                className={!method.deletable ? 'bg-muted' : ''}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`method-name-${index}`} className="text-xs">Display Name</Label>
                             <Input 
                                id={`method-name-${index}`}
                                value={method.name}
                                onChange={(e) => handlePaymentMethodChange(index, 'name', e.target.value)}
                                placeholder="e.g., UPI"
                                readOnly={!method.deletable}
                                className={!method.deletable ? 'bg-muted' : ''}
                            />
                        </div>
                    </div>
                    <Switch
                        checked={method.enabled}
                        onCheckedChange={(checked) => handlePaymentMethodChange(index, 'enabled', checked)}
                        aria-label={`${method.name} status`}
                    />
                     <Button variant="ghost" size="icon" onClick={() => removePaymentMethod(index)} className="text-destructive h-9 w-9" disabled={!method.deletable}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            ))}
          </CardContent>
          <CardFooter>
              <Button variant="outline" onClick={addNewPaymentMethod} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Method
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referral-bonus">Referral Bonus (INR)</Label>
              <Input
                id="referral-bonus"
                type="number"
                value={settings.referral.bonusAmount}
                onChange={(e) =>
                  handleInputChange(
                    'referral',
                    'bonusAmount',
                    Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level1-commission">
                Level 1 Commission (%)
              </Label>
              <Input
                id="level1-commission"
                type="number"
                value={settings.referral.level1Commission}
                onChange={(e) =>
                  handleInputChange(
                    'referral',
                    'level1Commission',
                    Number(e.target.value)
                  )
                }
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="level2-commission">
                Level 2 Commission (%)
              </Label>
              <Input
                id="level2-commission"
                type="number"
                value={settings.referral.level2Commission}
                onChange={(e) =>
                  handleInputChange(
                    'referral',
                    'level2Commission',
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>UI & Social Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="notice-board">Notice Board Text</Label>
                        <Textarea
                            id="notice-board"
                            value={settings.ui.noticeBoardText}
                            onChange={(e) => handleInputChange('ui', 'noticeBoardText', e.target.value)}
                            placeholder="Text to show on the dashboard notice board."
                        />
                    </div>
                </div>
                 <div className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="whatsapp-link">WhatsApp Group Link</Label>
                        <Input
                            id="whatsapp-link"
                            value={settings.socialLinks.whatsapp}
                            onChange={(e) => handleInputChange('socialLinks', 'whatsapp', e.target.value)}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="telegram-link">Telegram Channel Link</Label>
                        <Input
                            id="telegram-link"
                            value={settings.socialLinks.telegram}
                            onChange={(e) => handleInputChange('socialLinks', 'telegram', e.target.value)}
                        />
                    </div>
                      <div className="space-y-2">
                        <Label htmlFor="instagram-link">Instagram Profile Link</Label>
                        <Input
                            id="instagram-link"
                            value={settings.socialLinks.instagram}
                            onChange={(e) => handleInputChange('socialLinks', 'instagram', e.target.value)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    