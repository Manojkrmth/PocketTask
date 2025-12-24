'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Instagram,
  Facebook,
  Coins,
  Download,
  ShoppingBag,
  MapPin,
  ChevronRight,
  MousePointerClick,
  PlayCircle,
  UserCheck,
  AppWindow,
  MailOpen,
  Flame,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';

const taskTypes = [
  {
    name: 'Gmail',
    icon: <Mail className="h-8 w-8 text-red-500" />,
    href: '/tasks/gmail',
    description: 'Read emails & earn rewards.',
    badge: 'HOT',
  },
  {
    name: 'Used Mails',
    icon: <MailOpen className="h-8 w-8 text-gray-500" />,
    href: '#',
    description: 'Tasks for used mail accounts.',
    badge: 'NEW',
  },
  {
    name: 'Hot Mail',
    icon: <Flame className="h-8 w-8 text-orange-500" />,
    href: '#',
    description: 'High priority mail tasks.',
    badge: 'HOT',
  },
  {
    name: 'Outlook Mail',
    icon: <Mail className="h-8 w-8 text-blue-500" />,
    href: '#',
    description: 'Tasks for Outlook accounts.',
    badge: 'NEW',
  },
  {
    name: 'Instagram',
    icon: <Instagram className="h-8 w-8 text-pink-500" />,
    href: '#',
    description: 'Like, follow & comment.',
    badge: 'HOT',
  },
  {
    name: 'Facebook',
    icon: <Facebook className="h-8 w-8 text-blue-600" />,
    href: '#',
    description: 'Engage with posts & pages.',
    badge: 'POPULAR',
  },
   {
    name: 'Visit & Earn',
    icon: <MousePointerClick className="h-8 w-8 text-indigo-500" />,
    href: '#',
    description: 'Visit websites to earn.',
    badge: 'NEW',
  },
  {
    name: 'Watch & Earn',
    icon: <PlayCircle className="h-8 w-8 text-red-600" />,
    href: '#',
    description: 'Watch videos for rewards.',
    badge: 'HOT',
  },
  {
    name: 'KYC Task',
    icon: <UserCheck className="h-8 w-8 text-teal-500" />,
    href: '#',
    description: 'Complete KYC verification.',
    badge: 'HIGH PAY',
  },
   {
    name: 'App Install Task',
    icon: <AppWindow className="h-8 w-8 text-cyan-500" />,
    href: '#',
    description: 'Install apps and get paid.',
    badge: 'POPULAR',
  },
  {
    name: 'Niva Coin',
    icon: <Coins className="h-8 w-8 text-yellow-500" />,
    href: '#',
    description: 'Special coin tasks.',
    badge: 'HOT',
  },
  {
    name: 'Top Coin',
    icon: <Coins className="h-8 w-8 text-amber-600" />,
    href: '#',
    description: 'High value coin offers.',
  },
  {
    name: 'Google Map Review',
    icon: <MapPin className="h-8 w-8 text-green-600" />,
    href: '#',
    description: 'Review places you have visited.',
  },
  {
    name: 'Playstore App Review',
    icon: <Download className="h-8 w-8 text-sky-500" />,
    href: '#',
    description: 'Review apps on Playstore.',
  },
  {
    name: 'Amazon Product Review',
    icon: <ShoppingBag className="h-8 w-8 text-orange-500" />,
    href: '#',
    description: 'Review products on Amazon.',
  },
  {
    name: 'Survey',
    icon: <ClipboardList className="h-8 w-8 text-purple-500" />,
    href: '#',
    description: 'Share your opinion & earn.',
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
      <PageHeader title="Choose Task Type" description="Select a category to find available tasks" />

      <main className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {taskTypes.map((task) => (
            <Link href={task.href} key={task.name} className="group">
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
