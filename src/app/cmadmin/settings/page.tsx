'use client';

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Send, Loader2, PlusCircle, Trash2, ShieldAlert, Calendar as CalendarIcon, Banknote, HardHat } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";

// --- Dummy Data ---
const dummySettings = {
    referralLevel1Percentage: 10,
    referralLevel2Percentage: 5,
    referralLevel3Percentage: 2,
    referralLevel4Percentage: 1,
    referralLevel5Percentage: 0.5,
    noticeBoardText: "Welcome! We've added new high-reward tasks.",
    popupNotice: { isEnabled: true, imageUrl: "https://placehold.co/400x200", text: "Special Bonus!", redirectLink: "/tasks" },
    withdrawal: { chargesPercent: 2, minAmount: 500, methods: { upi: true, bank: true, usdt_bep20: false } },
    tasksEnabled: true,
    taskTimerSeconds: 300,
    socialLinks: { instagram: "#", whatsapp: "#", telegram: "#" },
    usdToInrRate: 83.5,
    howToWorks: { buttons: [{ text: "How to complete Task", link: "#" }] },
    maintenanceModeEnabled: false,
};
// --- End Dummy Data ---

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState<any>(dummySettings);
  
  const handleInputChange = (path: string, value: any) => {
    setSettings((prev: any) => {
        const newSettings = { ...prev };
        let current = newSettings;
        const keys = path.split('.');
        keys.slice(0, -1).forEach(key => {
            current[key] = { ...(current[key] || {}) };
            current = current[key];
        });
        current[keys[keys.length - 1]] = value;
        return newSettings;
    });
  };

  const handleSave = (section: string) => {
      startTransition(() => {
        setTimeout(() => {
            console.log(`Saving ${section} settings:`, settings);
            toast({ title: `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated!` });
        }, 1000);
      });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">System Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Notice Board (Running Text)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={settings.noticeBoardText || ''} onChange={(e) => handleInputChange('noticeBoardText', e.target.value)} className="mb-2" />
          <Button onClick={() => handleSave('notice')} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Update Notice</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Popup Notice</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center space-x-2"><Switch id="popup-enabled" checked={settings.popupNotice?.isEnabled || false} onCheckedChange={checked => handleInputChange('popupNotice.isEnabled', checked)} /><Label>Enable Popup</Label></div>
            <div><Label>Popup Image URL</Label><Input value={settings.popupNotice?.imageUrl || ''} onChange={(e) => handleInputChange('popupNotice.imageUrl', e.target.value)} /></div>
            <div><Label>Popup Text</Label><Textarea value={settings.popupNotice?.text || ''} onChange={(e) => handleInputChange('popupNotice.text', e.target.value)}/></div>
            <div><Label>Redirect Link</Label><Input placeholder="/tasks" value={settings.popupNotice?.redirectLink || ''} onChange={(e) => handleInputChange('popupNotice.redirectLink', e.target.value)} /></div>
          <Button onClick={() => handleSave('popup')} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Update Popup Notice</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Referral Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(level => (
                <div key={level}><Label className="text-sm text-muted-foreground">Level {level} (%)</Label><Input type="number" value={settings[`referralLevel${level}Percentage`] || 0} onChange={e => handleInputChange(`referralLevel${level}Percentage`, parseFloat(e.target.value))} /></div>
            ))}
          </div>
          <Button onClick={() => handleSave('referral')} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Referral Settings</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader><CardTitle>Withdrawal Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div><Label>Withdrawal Charges (%)</Label><Input type="number" value={settings.withdrawal?.chargesPercent || 0} onChange={e => handleInputChange('withdrawal.chargesPercent', parseFloat(e.target.value))} /></div>
             <div><Label>Minimum Withdrawal Amount</Label><Input type="number" value={settings.withdrawal?.minAmount || 0} onChange={e => handleInputChange('withdrawal.minAmount', parseFloat(e.target.value))} /></div>
           </div>
          <div className="space-y-2"><Label>Withdrawal Methods</Label>
            <div className="flex items-center space-x-2"><Switch checked={settings.withdrawal?.methods?.upi || false} onCheckedChange={checked => handleInputChange('withdrawal.methods.upi', checked)} /><Label>UPI</Label></div>
            <div className="flex items-center space-x-2"><Switch checked={settings.withdrawal?.methods?.bank || false} onCheckedChange={checked => handleInputChange('withdrawal.methods.bank', checked)} /><Label>Bank Transfer</Label></div>
          </div>
          <Button onClick={() => handleSave('withdrawal')} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Withdrawal Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Task Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5"><Label>Task System</Label><p className="text-xs text-muted-foreground">Turn off to prevent new tasks.</p></div>
                <Switch checked={settings.tasksEnabled || false} onCheckedChange={checked => handleInputChange('tasksEnabled', checked)} />
            </div>
           <div><Label>Task Timer (seconds)</Label><Input type="number" value={settings.taskTimerSeconds || 0} onChange={e => handleInputChange('taskTimerSeconds', parseInt(e.target.value))} /></div>
          <Button onClick={() => handleSave('task')} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Task Settings</Button>
        </CardContent>
      </Card>

       <Card>
        <CardHeader><CardTitle>Social Media Links</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div><Label>Instagram</Label><Input placeholder="https://instagram.com/..." value={settings.socialLinks?.instagram || ''} onChange={e => handleInputChange('socialLinks.instagram', e.target.value)} /></div>
            <div><Label>WhatsApp</Label><Input placeholder="https://wa.me/..." value={settings.socialLinks?.whatsapp || ''} onChange={e => handleInputChange('socialLinks.whatsapp', e.target.value)} /></div>
            <div><Label>Telegram</Label><Input placeholder="https://t.me/..." value={settings.socialLinks?.telegram || ''} onChange={e => handleInputChange('socialLinks.telegram', e.target.value)} /></div>
            <Button onClick={() => handleSave('social')} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Social Links</Button>
        </CardContent>
       </Card>

       <Card>
        <CardHeader><CardTitle>Maintenance Mode</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5"><Label className="flex items-center gap-2"><HardHat />App Under Construction</Label><p className="text-xs text-muted-foreground">If enabled, users will see a maintenance page.</p></div>
            <Switch checked={settings.maintenanceModeEnabled || false} onCheckedChange={checked => handleInputChange('maintenanceModeEnabled', checked)} />
          </div>
          <Button onClick={() => handleSave('maintenance')} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save Maintenance Status</Button>
        </CardContent>
      </Card>
    </div>
  );
}
