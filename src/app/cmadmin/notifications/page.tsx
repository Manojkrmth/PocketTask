'use client';

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// --- Dummy Data ---
const dummySentNotifications = [
    { id: 'notif1', title: 'Welcome Bonus!', text: 'All new users get a welcome bonus.', startDate: new Date() },
    { id: 'notif2', title: 'New Tasks Added', text: 'High-reward tasks are now available.', startDate: new Date(Date.now() - 86400000) },
];
// --- End Dummy Data ---

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [sentNotifications, setSentNotifications] = useState(dummySentNotifications);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    
    startTransition(() => {
        // Simulate API call
        setTimeout(() => {
            toast({ title: "Notification Sent!", description: `Successfully sent notification titled "${title}".` });
            (event.target as HTMLFormElement).reset();
        }, 1000);
    });
  };
  
  const handleDelete = (notificationId: string) => {
    setSentNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast({ title: "Notification Deleted" });
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Send Notification</h1>

      <Card>
        <CardHeader>
          <CardTitle>Compose Notification</CardTitle>
          <CardDescription>This message will be sent as a notification to all users.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Notification Title</Label>
              <Input id="title" name="title" placeholder="e.g., New Bonus Available!" required />
            </div>
            <div>
              <Label htmlFor="message">Notification Message</Label>
              <Textarea id="message" name="message" placeholder="Describe the notification in detail..." required />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isPending ? "Sending..." : "Send Notification"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
              <CardTitle>Sent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
             <ul className="divide-y">
                {sentNotifications?.map(notif => (
                    <li key={notif.id} className="py-3 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{notif.title}</p>
                            <p className="text-sm text-muted-foreground">{notif.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.startDate)}</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                           <AlertDialogContent className="max-w-sm">
                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(notif.id)} className={cn(buttonVariants({variant: 'destructive'}))}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </li>
                ))}
             </ul>
          </CardContent>
      </Card>

    </div>
  );
}
