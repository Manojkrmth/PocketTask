

'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Wallet,
  IndianRupee,
  BadgePercent,
  UserRound,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { useCurrency } from '@/context/currency-context';
import { PageHeader } from '@/components/page-header';


interface LevelData {
  level: number;
  commission: number;
  members: number;
  earnings: number;
}

export default function TeamPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [teamStats, setTeamStats] = useState({
    totalTeamSize: 0,
    activeMembers: 0,
    myEarning: 0,
  });

  const [teamData, setTeamData] = useState<LevelData[]>([]);
  
  const fetchTeamData = useCallback(async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_user_team_data', { p_user_id: userId });

    if (error) {
        console.error("Error fetching team data:", error);
    } else if (data) {
        const fullTeamData = data.levelData;
        const levels = Array.from({ length: 5 }, (_, i) => i + 1);
        const processedTeamData = levels.map(level => {
            const foundLevel = fullTeamData.find((d: LevelData) => d.level === level);
            return foundLevel || {
                level: level,
                commission: [10, 5, 3, 2, 1][level - 1] || 0,
                members: 0,
                earnings: 0
            };
        });
        setTeamData(processedTeamData);
        setTeamStats(data.teamStats);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      setCurrentUser(session.user);
      
      const { data: profile } = await supabase
        .from('users')
        .select('status')
        .eq('id', session.user.id)
        .single();
        
      if (profile?.status === 'Blocked') {
        router.push('/blocked');
        return;
      }
      
      await fetchTeamData(session.user.id);
    };
    checkUserStatus();
  }, [router, fetchTeamData]);

  const statCards = [
    {
      label: 'Team Size',
      value: teamStats.totalTeamSize,
      color: 'bg-blue-500',
      icon: <Users className="w-8 h-8" />,
    },
    {
      label: 'Active Members',
      value: teamStats.activeMembers,
      color: 'bg-green-500',
      icon: <UserCheck className="w-8 h-8" />,
    },
    {
      label: 'My Earning',
      value: formatCurrency(teamStats.myEarning),
      color: 'bg-orange-500',
      icon: <Wallet className="w-8 h-8" />,
    },
  ];

  const earningPotential = {
    teamCalculation: [
      { label: "Level 1-4", value: "10 + 100 + 1,000 + 10,000", result: "11,110" },
      { label: "Level 5", value: "1,00,000", result: "1,00,000" },
    ],
    totalTeam: "1,11,110",
    dailyActive: "1,111", // 1% of 1,11,110
    dailyEarning: "5,555", // 1,111 * 5
    monthlyEarning: "1,66,650" // 5,555 * 30
  };

  return (
    <div className="flex flex-col bg-muted/40 min-h-screen">
      <PageHeader title="My Team" description="Manage your referral network" />

      <main className="p-4 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((card) => (
            <Card key={card.label} className={`${card.color} text-white`}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
                {card.icon}
                <div className="text-xl font-bold">{isLoading ? <Loader2 className="animate-spin" /> : card.value}</div>
                <div className="text-xs font-light">{card.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold px-2">Team Levels Overview</h2>
            <div className="space-y-3">
              {teamData.map((levelData) => {
                return (
                  <Card key={levelData.level}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex items-center gap-4 flex-1 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-0 shrink-0">
                          <span className="text-primary font-bold">L{levelData.level}</span>
                        </div>
                        <div>
                          <p className="font-bold">Level {levelData.level}</p>
                          <div className="text-xs text-muted-foreground inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full mt-1">
                            <BadgePercent className="w-3 h-3" />
                            <span>{levelData.commission}% Commission</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <UserRound className="w-4 h-4 text-muted-foreground" />
                            <p className="font-bold">
                               {isLoading ? <Loader2 className="animate-spin h-4 w-4"/> : levelData.members}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">Members</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <IndianRupee className="w-4 h-4 text-muted-foreground" />
                            <p className="font-bold">
                               {isLoading ? <Loader2 className="animate-spin h-4 w-4"/> : formatCurrency(levelData.earnings)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">Earning</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Referral Earning Potential</CardTitle>
                <CardDescription>
                    Understand the power of your network. Here's a simple calculation.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><CheckCircle className="w-5 h-5 text-green-500" /> Assumption</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-outside pl-5 space-y-2 text-sm text-muted-foreground">
                            <li>You refer 10 people.</li>
                            <li>Everyone in your team also refers 10 people.</li>
                            <li>Only <strong>1%</strong> of your total team is active daily, which means they are doing some tasks.</li>
                            <li>You get just <strong>₹5</strong> from each active user daily.</li>
                        </ul>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h3 className="font-semibold flex items-center text-lg"><Users className="w-5 h-5 mr-2 text-primary"/> Team Size Calculation (5 Levels)</h3>
                    <div className="text-sm space-y-3 pt-2">
                        {earningPotential.teamCalculation.map((item, index) => (
                           <div key={index} className="flex justify-between items-center border-b pb-2 gap-2">
                               <span className="font-medium">{item.label}</span>
                               <div className="flex items-center gap-2 text-muted-foreground">
                                 <span className="font-mono text-center text-xs hidden sm:inline">{item.value} =</span>
                                 <span className="font-bold text-right text-foreground">{item.result}</span>
                               </div>
                           </div>
                        ))}
                         <div className="flex justify-between items-center pt-2 font-bold text-base">
                            <span>Total Team Size</span>
                            <span className="text-primary">{earningPotential.totalTeam}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold flex items-center text-lg"><IndianRupee className="w-5 h-5 mr-2 text-primary"/>Daily Earning Calculation</h3>
                     <div className="text-sm space-y-2 pt-2">
                        <div className="flex justify-between items-center border-b pb-2">
                           <span className="text-muted-foreground">Total Team x 1% (Active)</span>
                           <span className="font-bold text-right text-foreground">{earningPotential.dailyActive}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 font-bold text-base">
                            <span>Your Daily Earning (x ₹5)</span>
                            <span className="text-green-600">₹{earningPotential.dailyEarning}</span>
                        </div>
                    </div>
                </div>

                 <div className="space-y-2 text-center bg-muted p-4 rounded-lg">
                    <h3 className="font-bold text-lg">Total Monthly Earning</h3>
                    <p className="text-sm text-muted-foreground">Your potential monthly income from referrals</p>
                    <p className="text-3xl font-bold text-primary">₹{earningPotential.monthlyEarning}</p>
                 </div>

            </CardContent>
        </Card>
      </main>
    </div>
  );
}
