'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BellRing, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import BannerAd from '@/components/ads/banner-ad';

interface Notification {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data);
      }
      setIsLoading(false);
    };

    fetchNotifications();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <PageHeader title="Notifications" />
      <main className="p-4 space-y-4 flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card key={notification.id} className="shadow-sm border-l-4 border-primary">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <BellRing className="h-5 w-5 text-primary" />
                    {notification.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </CardHeader>
              {notification.description && (
                <CardContent>
                  <CardDescription>{notification.description}</CardDescription>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 rounded-lg bg-background text-center">
            <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold">No new notifications</h3>
            <p className="text-muted-foreground">You're all caught up!</p>
          </div>
        )}
      </main>
      <BannerAd adId="notifications" />
    </div>
  );
}
