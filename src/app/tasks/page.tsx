
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
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const taskTypes = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: <Mail className="h-8 w-8 text-red-500" />,
    description: 'Read emails & earn rewards.',
    badge: 'HOT',
  },
  {
    id: 'used-mails',
    name: 'Used Mails',
    icon: <MailOpen className="h-8 w-8 text-gray-500" />,
    description: 'Tasks for used mail accounts.',
    badge: 'NEW',
  },
  {
    id: 'hot-mail',
    name: 'Hot Mail',
    icon: <Flame className="h-8 w-8 text-orange-500" />,
    description: 'High priority mail tasks.',
    badge: 'HOT',
  },
  {
    id: 'outlook-mail',
    name: 'Outlook Mail',
    icon: <Mail className="h-8 w-8 text-blue-500" />,
    description: 'Tasks for Outlook accounts.',
    badge: 'NEW',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram className="h-8 w-8 text-pink-500" />,
    description: 'Like, follow & comment.',
    badge: 'HOT',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="h-8 w-8 text-blue-600" />,
    description: 'Engage with posts & pages.',
    badge: 'POPULAR',
  },
   {
    id: 'visit-earn',
    name: 'Visit & Earn',
    icon: <MousePointerClick className="h-8 w-8 text-indigo-500" />,
    description: 'Visit websites to earn.',
    badge: 'NEW',
  },
  {
    id: 'watch-earn',
    name: 'Watch & Earn',
    icon: <PlayCircle className="h-8 w-8 text-red-600" />,
    description: 'Watch videos for rewards.',
    badge: 'HOT',
  },
  {
    id: 'niva-coin',
    name: 'Niva Coin',
    icon: <Coins className="h-8 w-8 text-yellow-500" />,
    description: 'Special coin tasks.',
    badge: 'HOT',
  },
  {
    id: 'top-coin',
    name: 'Top Coin',
    icon: <Coins className="h-8 w-8 text-amber-600" />,
    description: 'High value coin offers.',
  },
];

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
        <div className="grid grid-cols-2 gap-4">
          {taskTypes.map((task) => (
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
                    {task.icon}
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
      </main>
    </div>
  );
}
