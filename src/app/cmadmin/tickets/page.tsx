
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ListFilter, Eye, Trash2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAdmin } from '../layout';

type TicketStatus = 'Open' | 'In Progress' | 'Closed';

interface SupportTicket {
  id: number;
  subject: string;
  status: TicketStatus;
  created_at: string;
  user_id: string;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function AdminTicketsPage() {
  const { isViewOnly } = useAdmin();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilters, setStatusFilters] = useState<TicketStatus[]>(['Open', 'In Progress']);

  const [isDeleting, startDelete] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        id,
        subject,
        status,
        created_at,
        user_id,
        users (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch support tickets." });
    } else {
      setTickets(data as SupportTicket[]);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchTickets();
  }, [toast]);

  const handleDeleteTicket = () => {
    if (!selectedTicket) return;

    startDelete(async () => {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', selectedTicket.id);
      
      if (error) {
        toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
      } else {
        toast({ title: 'Success', description: `Ticket #${selectedTicket.id} has been deleted.` });
        await fetchTickets(); // Refresh the list
      }
      setDialogOpen(false);
      setSelectedTicket(null);
    });
  };

  const openDeleteDialog = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setDialogOpen(true);
  };

  const toggleFilter = (status: TicketStatus) => {
    setStatusFilters(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(ticket.status);
        const matchesSearch = !filter ||
            (ticket.users?.full_name?.toLowerCase().includes(filter.toLowerCase())) ||
            (ticket.users?.email?.toLowerCase().includes(filter.toLowerCase())) ||
            (ticket.subject.toLowerCase().includes(filter.toLowerCase())) ||
            (ticket.user_id.toLowerCase().includes(filter.toLowerCase()));
            
        return matchesStatus && matchesSearch;
    });
  }, [tickets, filter, statusFilters]);

  const getStatusBadgeVariant = (status: TicketStatus) => {
    switch (status) {
      case 'Open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Closed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'outline';
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground">
              Manage and respond to user support requests.
            </p>
          </div>
          <div className="flex gap-2">
              <Input
                placeholder="Filter by user, subject..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span>Filter</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={statusFilters.includes('Open')} onCheckedChange={() => toggleFilter('Open')}>Open</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={statusFilters.includes('In Progress')} onCheckedChange={() => toggleFilter('In Progress')}>In Progress</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={statusFilters.includes('Closed')} onCheckedChange={() => toggleFilter('Closed')}>Closed</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket Subject</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="font-medium">{ticket.subject}</div>
                      <div className="text-xs text-muted-foreground">ID: #{ticket.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{ticket.users?.full_name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{ticket.users?.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(getStatusBadgeVariant(ticket.status))}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting && selectedTicket?.id === ticket.id}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => router.push(`/cmadmin/tickets/${ticket.id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> View/Reply
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className={cn("text-destructive", isViewOnly && "text-muted-foreground opacity-50")}
                            onSelect={() => !isViewOnly && openDeleteDialog(ticket)}
                            disabled={isViewOnly}
                          >
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete Ticket
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No tickets found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
               This action cannot be undone. This will permanently delete the ticket
               <span className="font-bold"> #{selectedTicket?.id}</span> and all its replies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTicket} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
