
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Bell,
  Wallet,
  Lock,
  LineChart,
  Gift,
  Loader2,
  Rocket,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WhatsAppIcon, TelegramIcon } from '@/components/icons';
import { ShareReferralDialog } from '@/components/share-referral-dialog';
import { InstallPWAButton } from '@/components/install-pwa-button';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import * as React from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from '@/components/loading-screen';
import { useCurrency } from '@/context/currency-context';

export default function HomePage() {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [systemSettings, setSystemSettings] = React.useState<any>(null);
  const [featuredOffers, setFeaturedOffers] = React.useState<any[]>([]);

  const autoplay = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  React.useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data;
    }

    const setupUser = async (sessionUser: User) => {
      setUser(sessionUser);
      const profile = await fetchUserProfile(sessionUser.id);
      if (profile) {
        setUserProfile(profile);
      }
      setLoading(false);
    }
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      await setupUser(session.user);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
         setupUser(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
        router.push('/login');
      }
    });

    // Mock data for settings and offers - can be replaced with real backend calls
    setSystemSettings({
      noticeBoardText: "Welcome to AuthNexus! Complete tasks and earn rewards.",
      socialLinks: {
        whatsapp: "#",
        telegram: "#",
      }
    });
    setFeaturedOffers([
      { id: '1', imageUrl: 'https://picsum.photos/seed/offer1/420/180', description: 'Special Offer 1', redirectLink: '#' },
      { id: '2', imageUrl: 'https://picsum.photos/seed/offer2/420/180', description: 'Special Offer 2', redirectLink: '#' }
    ]);

    return () => subscription.unsubscribe();
  }, [router]);


  const validFeaturedOffers = React.useMemo(() => {
    if (!featuredOffers) return [];
    return featuredOffers.filter(offer => 
      offer.imageUrl
    );
  }, [featuredOffers]);


  const isLoading = loading;
  
  const socialLinks = systemSettings?.socialLinks || {};

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-primary/90 p-6 rounded-b-3xl text-primary-foreground relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 overflow-hidden">
            <p className="text-sm opacity-90">Welcome back,</p>
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <h2 className="text-2xl font-bold truncate">{userProfile?.full_name || 'User'}</h2>}
            <p className="text-xs opacity-80 truncate">{user?.email || ''}</p>
            <p className="text-xs opacity-75">ID: {(userProfile?.referral_code || user?.id.substring(0, 8) || '').toUpperCase()}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
             <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20 relative" asChild>
              <Link href="#">
                <Bell className="h-6 w-6" />
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </Link>
            </Button>
            <InstallPWAButton />
          </div>
        </div>
        {systemSettings?.noticeBoardText && (
          <div className="relative mt-4 flex h-8 items-center overflow-hidden rounded-full bg-white/20 px-2 text-xs text-primary-foreground">
              <span className="flex-shrink-0 bg-red-500 text-white font-bold px-3 py-1 rounded-full text-xxs z-10">NOTICE</span>
              <div className="relative flex overflow-x-hidden w-full">
                <div className="animate-marquee whitespace-nowrap">
                  <span className="mx-4">{systemSettings.noticeBoardText}</span>
                </div>
                <div className="absolute top-0 animate-marquee2 whitespace-nowrap">
                   <span className="mx-4">{systemSettings.noticeBoardText}</span>
                </div>
              </div>
          </div>
        )}
      </header>

      <main className="px-4">
        <div className="mt-4 flex gap-4">
          <Card className="flex-1 bg-green-500 text-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Wallet /> Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{formatCurrency(userProfile?.balance_available || 0)}</div>}
            </CardContent>
          </Card>
          <Card className="flex-1 bg-orange-400 text-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Lock /> Hold Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{formatCurrency(userProfile?.balance_hold || 0)}</div>}
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex gap-4">
          <Card className="flex-1 bg-green-50 border border-green-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <div className='flex items-center gap-2'><LineChart className="h-4 w-4"/>Tasks Approved</div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <p className="text-2xl font-bold text-gray-800">{userProfile?.tasks_approved || 0}</p>}
            </CardContent>
          </Card>
          <Card className="flex-1 bg-orange-50 border border-orange-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <div className='flex items-center gap-2'><Gift className="h-4 w-4"/>Referral Earnings</div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <p className="text-2xl font-bold text-gray-800">{formatCurrency(userProfile?.referral_earnings || 0)}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <h3 className="font-bold text-lg text-gray-800 ml-1 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="#" className="block">
              <Card className="p-3 flex flex-col items-center justify-center gap-1 text-center hover:bg-muted/50 transition-colors cursor-pointer h-full bg-primary/10">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm">Start Earning</h4>
                <p className="text-xs text-muted-foreground">Complete tasks & earn</p>
              </Card>
            </Link>

            <ShareReferralDialog referralCode={userProfile?.referral_code}>
              <Card className="p-3 flex flex-col items-center justify-center gap-1 text-center hover:bg-muted/50 transition-colors cursor-pointer h-full bg-accent/10">
                <div className="p-2 bg-accent/20 rounded-full">
                  <Users className="h-5 w-5 text-accent-foreground" />
                </div>
                <h4 className="font-semibold text-sm">Invite Friends</h4>
                <p className="text-xs text-muted-foreground">Earn referral bonuses</p>
              </Card>
            </ShareReferralDialog>
          </div>
        </div>

        <div className="mt-6 mb-4">
          <h2 className="text-md font-semibold mb-2 ml-1">Featured Offers</h2>
            {isLoading ? (
                <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : validFeaturedOffers.length > 0 ? (
                <Carousel
                    opts={{
                        loop: true,
                    }}
                    plugins={[autoplay.current]}
                    className="w-full"
                >
                    <CarouselContent>
                        {validFeaturedOffers.map((offer) => (
                            <CarouselItem key={offer.id}>
                                <Link href={offer.redirectLink || '#'} target="_blank" rel="noopener noreferrer">
                                    <Card className="overflow-hidden rounded-xl relative aspect-[21/9] block hover:opacity-90 transition-opacity">
                                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                                            Ad
                                        </div>
                                        <Image
                                            src={offer.imageUrl}
                                            alt={offer.description || 'Featured offer'}
                                            fill
                                            className="object-cover"
                                            data-ai-hint="advertisement offer"
                                        />
                                    </Card>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    <p>No special offers available right now.</p>
                </div>
            )}
        </div>

        <div className="mb-6 bg-slate-100 rounded-lg p-1 flex gap-1">
          <Button asChild className="flex-1 bg-green-500 hover:bg-green-600 text-white shadow-sm" disabled={isLoading}>
            <a href={socialLinks?.whatsapp || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
              <WhatsAppIcon className="h-6 w-6"/> 
              <span className="font-semibold">Join WhatsApp</span>
            </a>
          </Button>
          <Button asChild className="flex-1 bg-blue-500 hover:bg-blue-600 text-white shadow-sm" disabled={isLoading}>
            <a href={socialLinks?.telegram || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
              <TelegramIcon className="h-6 w-6"/>
              <span className="font-semibold">Join Telegram</span>
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
