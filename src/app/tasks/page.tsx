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
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

const taskTypes = [
  {
    name: 'Gmail',
    icon: <Mail className="h-8 w-8 text-red-500" />,
    href: '#',
    description: 'Read emails & earn rewards.',
    badge: 'HOT',
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
    badge: 'NEW',
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
    badge: 'POPULAR',
  },
  {
    name: 'Google Map Review',
    icon: <MapPin className="h-8 w-8 text-green-600" />,
    href: '#',
    description: 'Write reviews for places you have visited recently.',
    badge: 'HOT',
  },
  {
    name: 'Playstore App Review',
    icon: <Download className="h-8 w-8 text-sky-500" />,
    href: '#',
    description: 'Review apps on Playstore.',
    badge: 'NEW',
  },
  {
    name: 'Amazon Product Review',
    icon: <ShoppingBag className="h-8 w-8 text-orange-500" />,
    href: '#',
    description: 'Review products on Amazon.',
    badge: 'HOT',
  },
];

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
                    variant={task.badge === 'HOT' ? 'destructive' : 'secondary'}
                    className="absolute top-2 right-2 transform rotate-[15deg]"
                  >
                    {task.badge}
                  </Badge>
                )}
                <CardContent className="p-4 flex items-center gap-4 h-full">
                  <div className="p-3 bg-muted rounded-full">
                    {task.icon}
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{task.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{task.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
