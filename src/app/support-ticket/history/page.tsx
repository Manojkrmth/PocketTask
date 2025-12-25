'use client';

import { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MessageSquare, PlusCircle, CornerUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import BannerAd from '@/components/ads/banner-ad';

interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Closed';
  created_at: string;
  updated_at: string;
  replies: { author: 'User' | 'Admin', message: string, timestamp: string }[] | null;
}

function AddReply({ ticket, onReplyAdded }: { ticket: SupportTicket, onReplyAdded: () => void }) {
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmitting, startSubmit] = useTransition();
    const { toast } = useToast();

    const handleAddReply = () => {
        if (!replyMessage.trim()) {
            toast({ variant: 'destructive', title: 'Reply cannot be empty' });
            return;
        }

        startSubmit(async () => {
            const currentReplies = ticket.replies || [];
            const newReply = {
                author: 'User',
                message: replyMessage,
                timestamp: new Date().toISOString()
            };
            const updatedReplies = [...currentReplies, newReply];

            const { error } = await supabase
                .from('support_tickets')
                .update({ replies: updatedReplies })
                .eq('id', ticket.id);

            if (error) {
                toast({ variant: 'destructive', title: 'Failed to add reply', description: error.message });
            } else {
                toast({ title: 'Reply Added', description: 'Your reply has been sent to the support team.' });
                setReplyMessage('');
                onReplyAdded(); // Refresh the list
            }
        });
    };

    return (
        <div className="mt-4 space-y-2 border-t pt-4">
            <h4 className="font-semibold text-sm">Add a Reply</h4>
            <Textarea 
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                disabled={isSubmitting || ticket.status === 'Closed'}
            />
            <Button onClick={handleAddReply} disabled={isSubmitting || ticket.status === 'Closed'}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CornerUpRight className="mr-2 h-4 w-4" />}
                Submit Reply
            </Button>
            {ticket.status === 'Closed' && <p className="text-xs text-destructive">You cannot reply to a closed ticket.</p>}
        </div>
    );
}

export default function TicketHistoryPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const fetchTickets = async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
    } else {
      setTickets(data as SupportTicket[]);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            fetchTickets(user.id);
        } else {
            setIsLoading(false);
        }
    };
    getUser();
  }, []);
  
  const getStatusBadgeVariant = (status: SupportTicket['status']) => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Closed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'outline';
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <PageHeader title="My Support Tickets" />
      <main className="p-4 space-y-4 flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length > 0 ? (
           <Accordion type="single" collapsible className="w-full space-y-4">
              {tickets.map((ticket) => (
                <AccordionItem value={`item-${ticket.id}`} key={ticket.id} className="bg-background rounded-lg border shadow-sm">
                  <AccordionTrigger className="p-4 hover:no-underline">
                     <div className='flex flex-col items-start text-left w-full gap-1'>
                        <div className="flex justify-between items-center w-full">
                           <p className="font-semibold text-base text-foreground truncate pr-2">{ticket.subject}</p>
                           <Badge variant="outline" className={cn("whitespace-nowrap", getStatusBadgeVariant(ticket.status))}>
                              {ticket.status}
                           </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Ticket #{ticket.id} &bull; {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                        </p>
                     </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 pt-0">
                    <div className="space-y-4">
                       <div>
                         <p className="text-sm font-semibold mb-1">Your Message:</p>
                         <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md border">{ticket.message}</p>
                       </div>

                       {ticket.replies && ticket.replies.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2">Replies:</p>
                            <div className="space-y-3">
                              {ticket.replies.map((reply, index) => (
                                <div key={index} className={cn(
                                  "p-3 rounded-md border text-sm",
                                  reply.author === 'Admin' 
                                    ? "bg-blue-50 border-blue-200" 
                                    : "bg-gray-50 border-gray-200"
                                )}>
                                  <p className="font-bold">{reply.author}</p>
                                  <p>{reply.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true })}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                       )}

                       {(!ticket.replies || ticket.replies.length === 0) && (
                         <p className="text-xs text-center text-muted-foreground py-2">No replies yet. Our team will get back to you soon.</p>
                       )}

                       <AddReply ticket={ticket} onReplyAdded={() => user && fetchTickets(user.id)} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 rounded-lg bg-background text-center p-6">
            <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold">No tickets found</h3>
            <p className="text-muted-foreground mb-4">You haven't created any support tickets yet.</p>
            <Button asChild>
                <Link href="/support-ticket">
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Create a New Ticket
                </Link>
            </Button>
          </div>
        )}
        <BannerAd adId="support-history" />
      </main>
    </div>
  );
}
