
'use client';

import { useState, useTransition } from 'react';
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
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
}

// This is a dummy settings structure. In a real app, you'd fetch this from your database.
const initialSettings = {
  general: {
    appName: 'CookieMail',
    supportEmail: 'manojmukhiyamth@gmail.com',
  },
  withdrawal: {
    minAmount: 500,
    chargesPercent: 2,
    methods: [
      { id: 'upi', name: 'UPI', enabled: true },
      { id: 'bank', name: 'Bank Transfer', enabled: true },
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
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, startTransition] = useTransition();
  const { toast } = useToast();

  const handleInputChange = (
    section: keyof typeof settings,
    key: string,
    value: any
  ) => {
    setSettings((prev) => ({
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
      const newMethods = [...settings.withdrawal.methods, { id: newId, name: 'New Method', enabled: true }];
      handleInputChange('withdrawal', 'methods', newMethods);
  };

  const removePaymentMethod = (index: number) => {
      const newMethods = settings.withdrawal.methods.filter((_, i) => i !== index);
      handleInputChange('withdrawal', 'methods', newMethods);
  };


  const handleSave = () => {
    startTransition(() => {
      // In a real app, you would save this to your database (e.g., a 'settings' table)
      console.log('Saving settings:', settings);
      // Simulate API call
      setTimeout(() => {
        toast({
          title: 'Settings Saved',
          description: 'Your changes have been saved successfully.',
        });
      }, 1000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Settings</h1>
          <p className="text-muted-foreground">
            Manage global settings for your application.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
             {settings.withdrawal.methods.map((method, index) => (
                <div key={method.id} className="flex items-end gap-2 rounded-lg border p-3">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label htmlFor={`method-id-${index}`} className="text-xs">ID</Label>
                            <Input 
                                id={`method-id-${index}`}
                                value={method.id}
                                onChange={(e) => handlePaymentMethodChange(index, 'id', e.target.value)}
                                placeholder="e.g., upi"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor={`method-name-${index}`} className="text-xs">Display Name</Label>
                             <Input 
                                id={`method-name-${index}`}
                                value={method.name}
                                onChange={(e) => handlePaymentMethodChange(index, 'name', e.target.value)}
                                placeholder="e.g., UPI"
                            />
                        </div>
                    </div>
                    <Switch
                        checked={method.enabled}
                        onCheckedChange={(checked) => handlePaymentMethodChange(index, 'enabled', checked)}
                        aria-label={`${method.name} status`}
                    />
                     <Button variant="ghost" size="icon" onClick={() => removePaymentMethod(index)} className="text-destructive h-9 w-9">
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
