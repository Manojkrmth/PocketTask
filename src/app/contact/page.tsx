
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Mail, User, MessageSquare, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function ContactUsPage() {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
            } else {
                toast({ variant: 'destructive', title: 'Not logged in', description: 'Please log in to create a ticket.' });
                router.push('/login');
            }
            setIsUserLoading(false);
        };

        getUser();
    }, [toast, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You are not logged in.' });
            return;
        }

        setIsLoading(true);

        const { error } = await supabase
            .from('support_tickets')
            .insert({
                user_id: user.id,
                subject: subject,
                message: message,
                status: 'Open',
            });

        setIsLoading(false);

        if (error) {
            toast({
                variant: "destructive",
                title: "Submission Failed",
                description: error.message,
            });
        } else {
            toast({
                title: "Ticket Created!",
                description: "Your support ticket has been submitted. Our team will get back to you soon.",
            });
            setSubject('');
            setMessage('');
            router.push('/support-ticket/history');
        }
    };

    const isSubmitDisabled = isLoading || isUserLoading || !subject || !message;

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <PageHeader title="Contact Us" description="We'd love to hear from you!" />
            <main className="p-4 space-y-6 flex-1">
                <Card className="shadow-lg border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Send className="h-6 w-6 text-primary"/>
                           Get in Touch
                        </CardTitle>
                        <CardDescription>
                            Fill out the form below and we'll get back to you as soon as possible. This will create a support ticket.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isUserLoading ? (
                             <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="subject" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Subject</Label>
                                <Input 
                                    id="subject" 
                                    type="text" 
                                    placeholder="e.g. Regarding my withdrawal" 
                                    required 
                                    value={subject} 
                                    onChange={(e) => setSubject(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Your Message</Label>
                                <Textarea 
                                    id="message" 
                                    placeholder="Please provide as much detail as possible..." 
                                    required 
                                    value={message} 
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={isLoading}
                                    rows={5}
                                />
                            </div>
                            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitDisabled}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-5 w-5" />
                                        Create Ticket
                                    </>
                                )}
                            </Button>
                        </form>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
