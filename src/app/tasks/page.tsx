
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Instagram,
  Facebook,
  Coins,
  ChevronRight,
  MousePointerClick,
  PlayCircle,
  MailOpen,
  Flame,
  History,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';


const iconMap: { [key: string]: React.ReactElement } = {
  gmail: <Mail className="h-8 w-8 text-red-500" />,
  'used-mails': <MailOpen className="h-8 w-8 text-gray-500" />,
  'hot-mail': <Flame className="h-8 w-8 text-orange-500" />,
  'outlook-mail': <Mail className="h-8 w-8 text-blue-500" />,
  instagram: <Instagram className="h-8 w-8 text-pink-500" />,
  facebook: <Facebook className="h-8 w-8 text-blue-600" />,
  'visit-earn': <MousePointerClick className="h-8 w-8 text-indigo-500" />,
  'watch-earn': <PlayCircle className="h-8 w-8 text-red-600" />,
  'niva-coin': <Coins className="h-8 w-8 text-yellow-500" />,
  'top-coin': <Coins className="h-8 w-8 text-amber-600" />,
};


const getBadgeVariant = (badgeText?: string) => {
  if (!badgeText) return 'outline';
  switch (badgeText.toUpperCase()) {
    case 'HOT':
      return 'destructive';
    case 'NEW':
      return 'default';
    case 'POPULAR':
      return 'secondary';
    case 'HIGH PAY':
       return 'default';
    default:
      return 'outline';
  }
};

const getBadgeClass = (badgeText?: string) => {
  if (!badgeText) return '';
  if (badgeText.toUpperCase() === 'HIGH PAY') {
    return 'bg-green-600 text-white';
  }
  return '';
}

export default function ChooseTaskTypePage() {
  const [taskSettings, setTaskSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('settings_data->taskSettings')
        .eq('id', 1)
        .single();
      
      if (error) {
        console.error("Error fetching task settings", error);
      } else if (data && data.taskSettings) {
        setTaskSettings(data.taskSettings as any[]);
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, []);

  const enabledTasks = taskSettings.filter(task => task.enabled);

  return (
    <div className="flex flex-col bg-muted/40 min-h-screen">
       <PageHeader 
        title="Choose Task Type" 
        description="Select a category to find available tasks"
        actionButton={
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-primary-foreground hover:bg-white/20" asChild>
            <Link href="/profile/task-history">
              <History className="h-5 w-5" />
            </Link>
          </Button>
        }
       />

      <main className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {enabledTasks.map((task) => (
              <Link href={`/tasks/${task.id}`} key={task.name} className="group">
                <Card className="hover:bg-primary/5 hover:border-primary/50 transition-all duration-200 h-full overflow-hidden relative">
                  {task.badge && (
                    <Badge 
                      variant={getBadgeVariant(task.badge)}
                      className={`absolute top-2 right-2 ${getBadgeClass(task.badge)}`}
                    >
                      {task.badge}
                    </Badge>
                  )}
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="p-3 bg-muted rounded-full w-max mb-3">
                      {iconMap[task.id] || <Mail className="h-8 w-8" />}
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{task.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{task.description}</p>
                    </div>
                    <div className="flex justify-end mt-2">
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
