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
  Copy,
  ShoppingCart,
  Phone,
  PlusSquare,
  Repeat,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useToast } from '@/hooks/use-toast';
import BannerAd from '@/components/ads/banner-ad';


export default function HomePage() {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const [systemSettings, setSystemSettings] = React.useState<any>(null);
  const [featuredOffers, setFeaturedOffers] = React.useState<any[]>([]);
  const [taskCounts, setTaskCounts] = React.useState({ approved: 0, pending: 0, rejected: 0 });
  const [balances, setBalances] = React.useState({ available: 0, hold: 0 });

  const autoplay = React.useRef(Autoplay({ delay: 2000, stopOnInteraction: false }));

  React.useEffect(() => {
    const fetchWalletBalances = async (userId: string) => {
        const { data: walletData, error: walletError } = await supabase
            .from('wallet_history')
            .select('amount, status')
            .eq('user_id', userId);

        let availableBalance = 0;
        if (walletData) {
            availableBalance = walletData.reduce((acc, item) => {
                // Only completed credits add to the balance
                if (item.status === 'Completed' && item.amount > 0) {
                    return acc + item.amount;
                }
                // All debits (withdrawals) are subtracted, regardless of status (as they are 'held' from balance)
                 if (item.amount < 0) {
                    return acc + item.amount; // amount is already negative
                }
                return acc;
            }, 0);
        }

        const { data: pendingTasks, error: pendingError } = await supabase
            .from('usertasks')
            .select('reward')
            .eq('user_id', userId)
            .eq('status', 'Pending');
            
        let holdBalance = 0;
        if (pendingTasks) {
            holdBalance = pendingTasks.reduce((acc, task) => acc + task.reward, 0);
        }
        
        setBalances({ available: availableBalance, hold: holdBalance });
    };

    const fetchNotificationCount = async () => {
        const { count, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true });

        if (error) {
            console.error('Error fetching notification count:', error);
        } else {
            setNotificationCount(count || 0);
        }
    };
    
    const fetchTaskCounts = async (userId: string) => {
      const { data, error } = await supabase
        .from('usertasks')
        .select('status')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching task counts:', error);
      } else if (data) {
        const counts = {
          approved: data.filter(t => t.status === 'Approved').length,
          pending: data.filter(t => t.status === 'Pending').length,
          rejected: data.filter(t => t.status === 'Rejected').length,
        };
        setTaskCounts(counts);
      }
    };

    const setupUser = async (sessionUser: User) => {
      setUser(sessionUser);
      // Fetch user profile to get referral code and name
      const { data: profile } = await supabase.from('users').select('full_name, referral_code, referral_earnings, status').eq('id', sessionUser.id).single();
      
      if (profile?.status === 'Blocked') {
        router.push('/blocked');
        return;
      }
      
      setUserProfile(profile);

      // Fetch system settings
      const { data: settings } = await supabase.from('settings').select('settings_data').single();
      setSystemSettings(settings?.settings_data || {});
      setFeaturedOffers(settings?.settings_data?.featuredOffers || []);


      await Promise.all([
        fetchWalletBalances(sessionUser.id),
        fetchNotificationCount(),
        fetchTaskCounts(sessionUser.id)
      ]);
      
      setLoading(false);
    }
    
    const checkSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      await setupUser(session.user);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && session.user) {
         await setupUser(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
        setNotificationCount(0);
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);


  const validFeaturedOffers = React.useMemo(() => {
    if (!featuredOffers) return [];
    return featuredOffers.filter(offer => 
      offer.imageUrl && offer.enabled
    );
  }, [featuredOffers]);

  const handleComingSoon = () => {
    toast({
      title: "Coming Soon!",
      description: "This feature is under development and will be available shortly.",
    });
  };

  const isLoading = loading;
  
  const socialLinks = systemSettings?.socialLinks || {};

  const getInitials = (name?: string, fallback?: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (fallback) {
      return fallback[0].toUpperCase();
    }
    return 'U';
  };
  
  const referralCode = (userProfile?.referral_code || user?.id.substring(0, 8) || '').toUpperCase();

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard.",
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-primary/90 p-4 rounded-b-3xl text-primary-foreground relative shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
             <Avatar className="h-12 w-12 border-2 border-white/50 flex items-center justify-center bg-primary/80">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-md font-semibold opacity-95">Welcome back,</p>
              <p className="text-sm font-medium truncate">{userProfile?.full_name || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center">
             <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20 relative h-9 w-9 rounded-full" asChild>
              <Link href="/notifications">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                   <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                     {notificationCount}
                   </span>
                )}
              </Link>
            </Button>
          </div>
        </div>

        <Card className="bg-white/10 border-0 p-3">
            <div className="flex justify-between items-center gap-2">
                <div>
                    <p className="text-xs font-medium text-white/80">Referral ID</p>
                    <p className="text-lg font-mono font-bold tracking-wider text-white">{referralCode}</p>
                </div>
                <InstallPWAButton />
            </div>
        </Card>

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
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{formatCurrency(balances.available)}</div>}
            </CardContent>
          </Card>
          <Card className="flex-1 bg-orange-400 text-white shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Lock /> On Hold Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{formatCurrency(balances.hold)}</div>}
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
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin"/> : <p className="text-2xl font-bold text-gray-800">{taskCounts.approved}</p>}
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
          <div className="grid grid-cols-2 gap-4">
            
            <Link href="/tasks" className="group block relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <Card className="relative p-4 flex items-center gap-4 transition-all duration-200 group-hover:scale-105 h-full bg-white">
                <div className="p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-md">
                  <Rocket className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-md text-gray-900">Start Earning</h4>
                  <p className="text-xs text-gray-600">Complete tasks</p>
                </div>
              </Card>
            </Link>

            <ShareReferralDialog referralCode={referralCode}>
                <div className="group block relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <Card className="relative p-4 flex items-center gap-4 transition-all duration-200 group-hover:scale-105 h-full bg-white">
                    <div className="p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-md">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-md text-gray-900">Invite & Earn</h4>
                      <div className="text-xs text-gray-600">
                        <Badge className="bg-red-500 text-white px-1.5 py-0">Lifetime</Badge> bonus
                      </div>
                    </div>
                  </Card>
                </div>
            </ShareReferralDialog>

            <Link href="/spin-reward" className="group block relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <Card className="relative p-4 flex items-center gap-4 h-full bg-white transition-all duration-200 group-hover:scale-105 overflow-visible">
                <div className="p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-md">
                  <Target className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-md text-gray-700">Spin &amp; Win</h4>
                  <p className="text-xs text-gray-500">Win prizes</p>
                </div>
              </Card>
            </Link>

            <Link href="/contact" className="group block relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
              <Card className="relative p-4 flex items-center gap-4 h-full bg-white transition-all duration-200 group-hover:scale-105 overflow-visible">
                <div className="p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-md">
                  <Phone className="h-6 w-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-md text-gray-700">Contact Us</h4>
                  <p className="text-xs text-gray-500">Get support</p>
                </div>
              </Card>
            </Link>

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

        <div className="my-6 grid grid-cols-2 gap-4">
          <a href={socialLinks?.whatsapp || '#'} target="_blank" rel="noopener noreferrer" className="group block relative"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-cyan-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <Button asChild className="relative w-full h-12 bg-green-500 hover:bg-green-600 text-white shadow-lg transition-transform group-hover:scale-105" disabled={isLoading}>
              <div className="flex items-center justify-center gap-2">
                <WhatsAppIcon className="h-6 w-6"/> 
                <span className="font-semibold">Join WhatsApp</span>
              </div>
            </Button>
          </a>
          <a href={socialLinks?.telegram || '#'} target="_blank" rel="noopener noreferrer" className="group block relative"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <Button asChild className="relative w-full h-12 bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-transform group-hover:scale-105" disabled={isLoading}>
              <div className="flex items-center justify-center gap-2">
                <TelegramIcon className="h-6 w-6"/>
                <span className="font-semibold">Join Telegram</span>
              </div>
            </Button>
          </a>
        </div>
        
        <BannerAd adId="home" />

      </main>
    </div>
  );
}
