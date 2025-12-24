
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

const menuItems = [
  { href: '/profile/task-history', icon: History, label: 'Task History' },
  { href: '/withdraw/history', icon: Wallet, label: 'Wallet History' },
  { href: '/profile/edit', icon: Edit, label: 'Edit Profile' },
  { href: '/profile/currency', icon: Globe, label: 'Currency' },
  { href: '/update-password', icon: Lock, label: 'Change Password' },
];

const legalItems = [
  { href: '/contact', icon: Contact, label: 'Contact Us' },
  { href: '/disclaimer', icon: Info, label: 'Disclaimer' },
  { href: '/privacy', icon: Info, label: 'Privacy Policy' },
  { href: '/terms', icon: Info, label: 'Terms & Conditions' },
];

function ReferrerInfoCard({ referralCode }: { referralCode: string }) {
    const [referrer, setReferrer] = useState<{ full_name: string; referral_code: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!referralCode) {
            setIsLoading(false);
            return;
        }

        const fetchReferrer = async () => {
            const upperCaseCode = referralCode.toUpperCase();
            const { data, error } = await supabase
                .from('users')
                .select('full_name, referral_code')
                .eq('referral_code', upperCaseCode)
                .single();
            
            if (error) {
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
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarFallback className={cn("font-bold")}>
                              {referrer.full_name ? referrer.full_name.substring(0, 1).toUpperCase() : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="font-bold text-md">{referrer.full_name}</h4>
                            <p className="text-xs text-muted-foreground">{referrer.referral_code}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Could not load referrer information.</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [systemSettings, setSystemSettings] = useState<any>({
      socialLinks: {
        instagram: "#",
        whatsapp: "#",
        telegram: "#",
      }
  });

  const fetchProfileData = useCallback(async (sessionUser: SupabaseUser) => {
    setIsLoading(true);
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    } else {
      setUserProfile(profile);
    }
    setIsLoading(false);
  }, []);


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

  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: "Coming Soon!",
      description: "This feature is under development.",
    });
  };
  
  const hasReferrer = !!userProfile?.referred_by;
  const socialLinks = systemSettings?.socialLinks || {};

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
                  <AddReferralDialog onFinished={() => fetchProfileData(user)} />
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
                <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </Link>
            ))}
             <div className="flex items-center py-4 text-md font-medium" onClick={handleComingSoon}>
                <PlusSquare className="h-5 w-5 mr-4 text-primary" />
                <span className="flex-1">Post a Task</span>
                 <Badge variant="destructive" className="text-xs mr-2">Soon</Badge>
                <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connect with Us</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-around">
             <a href={socialLinks?.instagram || '#'} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full">
                    <InstagramIcon className="h-7 w-7 text-[#E1306C]" />
                </div>
                <span className="text-xs font-medium">Instagram</span>
            </a>
             <a href={socialLinks?.whatsapp || '#'} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
                 <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full">
                    <WhatsAppIcon className="h-7 w-7 text-[#25D366]"/>
                </div>
                <span className="text-xs font-medium">WhatsApp</span>
            </a>
             <a href={socialLinks?.telegram || '#'} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary">
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
      </main>
    </div>
  );
}
