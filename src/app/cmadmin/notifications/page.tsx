
'use client';

import { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, BellRing, Send, Trash2, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
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

interface Notification {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
}

export default function NotificationsAdminPage() {
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, startSubmitting] = useTransition();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [isDeleting, startDeleting] = useTransition();

    const fetchNotifications = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch notifications.' });
        } else {
            setNotifications(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications();
    }, [toast]);

    const handleCreateNotification = () => {
        if (!title) {
            toast({ variant: 'destructive', title: 'Title is required' });
            return;
        }

        startSubmitting(async () => {
            const { error } = await supabase
                .from('notifications')
                .insert({ title, description });

            if (error) {
                toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
            } else {
                toast({ title: 'Success', description: 'Notification has been sent to all users.' });
                setTitle('');
                setDescription('');
                await fetchNotifications();
            }
        });
    };

    const openDeleteDialog = (notification: Notification) => {
        setSelectedNotification(notification);
        setDialogOpen(true);
    };
    
    const handleDeleteNotification = () => {
        if (!selectedNotification) return;

        startDeleting(async () => {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', selectedNotification.id);
            
            if (error) {
                 toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
            } else {
                 toast({ title: 'Success', description: 'Notification has been deleted.' });
                 await fetchNotifications();
            }
            setDialogOpen(false);
            setSelectedNotification(null);
        });
    }

    return (
        <>
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Notifications</h1>
                <p className="text-muted-foreground">Create and manage notifications for all users.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 text-primary" /> Create Notification</CardTitle>
                        <CardDescription>This notification will be sent to all users.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input 
                                id="title" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Important Maintenance"
                                disabled={isSubmitting}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea 
                                id="description" 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., The app will be down for maintenance..."
                                disabled={isSubmitting}
                                rows={4}
                            />
                        </div>
                        <Button className="w-full" onClick={handleCreateNotification} disabled={isSubmitting || !title}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Send Notification
                        </Button>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Sent Notifications</CardTitle>
                        <CardDescription>A list of all previously sent notifications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                       {loading ? (
                           <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                       ) : notifications.length > 0 ? (
                            notifications.map((notification) => (
                               <div key={notification.id} className="border-b pb-3 last:border-b-0">
                                   <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold">{notification.title}</p>
                                            <p className="text-sm text-muted-foreground">{notification.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                                            onClick={() => openDeleteDialog(notification)}
                                            disabled={isDeleting && selectedNotification?.id === notification.id}
                                        >
                                           {isDeleting && selectedNotification?.id === notification.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                   </div>
                               </div>
                            ))
                       ) : (
                           <p className="text-center text-muted-foreground py-10">No notifications sent yet.</p>
                       )}
                    </CardContent>
                </Card>

            </div>
        </div>
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the notification.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteNotification} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Delete
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
