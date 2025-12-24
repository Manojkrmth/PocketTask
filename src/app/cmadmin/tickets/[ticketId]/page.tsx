
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, MessageSquare, User, Mail, Calendar, Info, CornerUpLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TicketStatus = 'Open' | 'In Progress' | 'Closed';

interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
  replies: { author: 'User' | 'Admin', message: string, timestamp: string }[] | null;
}

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, startUpdate] = useTransition();

  const [replyMessage, setReplyMessage] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus | null>(null);

  const fetchTicketDetails = async () => {
      if (!ticketId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
            *,
            users (
                full_name,
                email
            )
        `)
        .eq('id', ticketId)
        .single();

      if (error) {
        console.error('Error fetching ticket details:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch ticket details.' });
        router.push('/cmadmin/tickets');
      } else {
        setTicket(data as SupportTicket);
        setNewStatus(data.status);
      }
      setLoading(false);
    };

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId, router, toast]);

  const handleUpdate = () => {
    startUpdate(async () => {
      if (!ticket) return;

      const currentReplies = ticket.replies || [];
      const newReplies = replyMessage 
        ? [...currentReplies, { author: 'Admin', message: replyMessage, timestamp: new Date().toISOString() }] 
        : currentReplies;

      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus || ticket.status,
          replies: newReplies,
        })
        .eq('id', ticket.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
      } else {
        toast({ title: 'Success', description: "Ticket has been updated." });
        setReplyMessage('');
        await fetchTicketDetails(); // Refresh data
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) return null;

  const getStatusBadgeVariant = (status: TicketStatus) => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Closed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold">Ticket #{ticket.id}</h1>
            <p className="text-muted-foreground">{ticket.subject}</p>
        </div>
        
       <div className="grid md:grid-cols-3 gap-6">
           <div className="md:col-span-2 space-y-6">
               <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary"/>Conversation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      {/* Initial user message */}
                      <div className="p-4 rounded-md border bg-gray-50 text-sm">
                          <p className="font-bold flex items-center gap-2">
                             <User className="h-4 w-4"/> {ticket.users?.full_name || 'User'}
                          </p>
                          <p className="mt-1">{ticket.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(ticket.created_at), 'PPP p')}
                          </p>
                      </div>

                      {/* Replies */}
                      {ticket.replies && ticket.replies.map((reply, index) => (
                        <div key={index} className={cn(
                          "p-4 rounded-md border text-sm",
                          reply.author === 'Admin' 
                            ? "bg-blue-50 border-blue-200" 
                            : "bg-gray-50 border-gray-200"
                        )}>
                          <p className="font-bold flex items-center gap-2">
                            {reply.author === 'Admin' ? <CornerUpLeft className="h-4 w-4"/> : <User className="h-4 w-4"/>}
                            {reply.author}
                          </p>
                          <p className="mt-1">{reply.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(reply.timestamp), 'PPP p')}
                          </p>
                        </div>
                      ))}
                      
                      <div className="space-y-2 pt-4">
                          <Label htmlFor="reply-message" className="font-semibold">Add Reply</Label>
                          <Textarea 
                              id="reply-message"
                              placeholder="Type your response to the user..."
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              rows={4}
                              disabled={isUpdating}
                          />
                      </div>
                  </CardContent>
               </Card>
           </div>
           
           <div className="space-y-6">
               <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary"/>User Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                       <div className="flex flex-col">
                          <span className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4"/> Full Name</span>
                          <span className="font-semibold">{ticket.users?.full_name || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4"/> Email</span>
                          <span className="font-semibold">{ticket.users?.email}</span>
                      </div>
                  </CardContent>
               </Card>
                <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary"/>Ticket Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div>
                        <Label>Status</Label>
                         <Select value={newStatus || ticket.status} onValueChange={(value: TicketStatus) => setNewStatus(value)}>
                            <SelectTrigger disabled={isUpdating}>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-semibold">{format(new Date(ticket.created_at), 'PPP p')}</p>
                      </div>
                       <div className="text-sm">
                        <p className="text-muted-foreground">Last Updated</p>
                        <p className="font-semibold">{format(new Date(ticket.updated_at), 'PPP p')}</p>
                      </div>
                  </CardContent>
               </Card>
           </div>
       </div>

      <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={isUpdating}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={isUpdating || (!replyMessage && newStatus === ticket.status)}>
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
              Update Ticket
          </Button>
      </div>
    </div>
  );
}
