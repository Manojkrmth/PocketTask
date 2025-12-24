'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

// This is a dummy settings structure. In a real app, you'd fetch this from your database.
const initialSettings = {
  general: {
    appName: 'CookieMail',
    supportEmail: 'manojmukhiyamth@gmail.com',
  },
  withdrawal: {
    minAmount: 500,
    chargesPercent: 2,
    upiEnabled: true,
    bankEnabled: true,
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
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
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
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="upi-enabled">UPI Enabled</Label>
              <Switch
                id="upi-enabled"
                checked={settings.withdrawal.upiEnabled}
                onCheckedChange={(checked) =>
                  handleInputChange('withdrawal', 'upiEnabled', checked)
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="bank-enabled">Bank Transfer Enabled</Label>
              <Switch
                id="bank-enabled"
                checked={settings.withdrawal.bankEnabled}
                onCheckedChange={(checked) =>
                  handleInputChange('withdrawal', 'bankEnabled', checked)
                }
              />
            </div>
          </CardContent>
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
