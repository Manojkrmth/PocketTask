

'use client';

import Link from 'next/link';
import {
  Lock,
  ChevronRight,
  Info,
  Edit,
  Globe,
  Gift,
  LogOut,
  Loader2,
  Contact,
  PlusSquare,
  History,
  Wallet,
  Mail,
  MessageSquare,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstagramIcon, WhatsAppIcon, TelegramIcon } from '@/components/icons';
import { AddReferralDialog } from '@/components/add-referral-dialog';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useEffect, useState, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import BannerAd from '@/components/ads/banner-ad';

const menuItems = [
  { href: '/profile/task-history', icon: History, label: 'Task History' },
  { href: '/withdraw/history', icon: Wallet, label: 'Wallet History' },
  { href: '/profile/edit', icon: Edit, label: 'Edit Profile' },
  { href: '/profile/currency', icon: Globe, label: 'Currency' },
  { href: '/update-password', icon: Lock, label: 'Change Password' },
  { href: '/support-ticket', icon: Contact, label: 'Support Ticket', badge: 'NEW' },
];

const legalItems = [
  { href: '/disclaimer', icon: Info, label: 'Disclaimer' },
  { href: '/privacy', icon: Info, label: 'Privacy Policy' },
  { href: '/terms', icon: Info, label: 'Terms & Conditions' },
];

function ReferrerInfoCard({ referralCode }: { referralCode: string }) {
    const [referrer, setReferrer] = useState<{ full_name: string, email: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!referralCode) {
            setIsLoading(false);
            return;
        }

        const fetchReferrer = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('full_name, email')
                .eq('referral_code', referralCode)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching referrer data:", error);
            } else if (data) {
                setReferrer(data);
            }
            setIsLoading(false);
        };

        fetchReferrer();
    }, [referralCode]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><Contact className="h-5 w-5 text-primary"/> You Were Referred By</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : referrer ? (
                    <div className="flex items-center gap-3">
                       <div className="flex-shrink-0">
                           <Contact className="h-6 w-6 text-muted-foreground"/>
                       </div>
                       <div>
                           <p className="font-semibold text-md">{referrer.full_name}</p>
                           <p className="text-sm text-muted-foreground">{referrer.email}</p>
                       </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Could not load referrer information.</p>
                )}
            </CardContent>
        </Card>
    );
}

interface SavedPaymentMethod {
  id: number;
  method_name: string;
  details: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [settings, setSettings] = useState<any>(null);

  const fetchProfileData = useCallback(async (sessionUser: SupabaseUser) => {
    setIsLoading(true);
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (profile?.status === 'Blocked') {
      router.push('/blocked');
      return;
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    } else {
      setUserProfile(profile);
    }
    
    // Fetch system settings
    const { data: appSettings } = await supabase.from('settings').select('*').eq('id', 1).single();
    setSettings(appSettings || {});

    // Fetch saved payment methods
    const { data: methodsData } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', sessionUser.id);
    setSavedMethods(methodsData || []);

    setIsLoading(false);
  }, [router]);


  useEffect(() => {
      const checkSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
              router.push('/login');
              return;
          }
          setUser(session.user);
          await fetchProfileData(session.user);
      };
      checkSession();
  }, [router, fetchProfileData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  }
  
  const hasReferrer = !!userProfile?.referred_by;

  return (
    <div>
       <PageHeader title="My Profile" description="Manage your account and settings" />

      <main className="px-4 space-y-6 py-6">
        
        {isLoading ? <div className="flex justify-center"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></div> : 
          user && !hasReferrer ? (
             <Card>
               <CardHeader>
                 <CardTitle className='flex items-center gap-2'><Gift className="h-5 w-5 text-primary"/> Add a Referral Code</CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                      Were you referred by a friend? Add their code here to join their team and get a bonus!
                  </p>
                  <AddReferralDialog onFinished={() => user && fetchProfileData(user)} />
               </CardContent>
             </Card>
          ) : (
            userProfile?.referred_by && <ReferrerInfoCard referralCode={userProfile.referred_by} />
          )
        }

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
             {menuItems.map(item => (
              <Link href={item.href} key={item.label} className="flex items-center py-4 text-md font-medium">
                <item.icon className="h-5 w-5 mr-4 text-primary" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="destructive">{item.badge}</Badge>
                )}
                <ChevronRight className="h-5 w-5 ml-2 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {savedMethods.length > 0 && (
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-primary"/> Saved Accounts</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {savedMethods.map(method => (
                         <div key={method.id} className="text-sm p-3 border rounded-md bg-muted/50">
                            <p className="font-semibold">{method.method_name}</p>
                            <p className="text-muted-foreground break-all">{method.details}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Connect with Us</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-around">
             <a href={settings?.instagram_link || '#'} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full">
                    <InstagramIcon className="h-7 w-7 text-[#E1306C]" />
                </div>
                <span className="text-xs font-medium">Instagram</span>
            </a>
             <a href={settings?.whatsapp_link || '#'} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                 <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full">
                    <WhatsAppIcon className="h-7 w-7 text-[#25D366]"/>
                </div>
                <span className="text-xs font-medium">WhatsApp</span>
            </a>
             <a href={settings?.telegram_link || '#'} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                 <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full">
                    <TelegramIcon className="h-7 w-7 text-blue-500" />
                </div>
                <span className="text-xs font-medium">Telegram</span>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legal & Info</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
             {legalItems.map(item => (
              <Link href={item.href} key={item.label} className="flex items-center py-4 text-md font-medium">
                <item.icon className="h-5 w-5 mr-4 text-primary" />
                <span>{item.label}</span>
                <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
        
        <Button variant="destructive" className="w-full h-12 text-base font-bold" onClick={handleLogout}>
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>

        <div className="text-center text-xs text-muted-foreground pt-4 space-y-1">
            <p>App Version 1.0.0</p>
            <p className="animate-color-cycle">Made with ❤️ In Bharat</p>
            <p>&copy; 2026 CookieMail. All Rights Reserved.</p>
        </div>
        <BannerAd adId="profile" />
      </main>
    </div>
  );
}

    