
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function SupportTicketPage() {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchUserData = async (user: User) => {
            setEmail(user.email || '');
            
            const { data: profileData, error } = await supabase
                .from('users')
                .select('full_name, mobile')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setName(profileData.full_name || '');
                setMobile(profileData.mobile || '');
            }
            setIsUserLoading(false);
        };
        
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if(user) {
                fetchUserData(user);
            } else {
                setIsUserLoading(false);
                toast({ variant: 'destructive', title: 'Not logged in', description: 'Please log in to create a ticket.' });
            }
        };

        getUser();
    }, [toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);

        // Simulate API call to create a ticket
        console.log("Submitting ticket:", { name, mobile, email, subject, message });
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsLoading(false);
        toast({
            title: "Ticket Created!",
            description: "Your support ticket has been submitted. Our team will get back to you soon.",
        });

        // Clear form fields that user can edit
        setSubject('');
        setMessage('');
    };

    const isSubmitDisabled = isLoading || isUserLoading || !subject || !message;

    return (
        <div className="flex flex-col min-h-screen bg-muted/40">
            <PageHeader title="Create Support Ticket" description="Need help? Let us know." />
            <main className="p-4 space-y-6 flex-1">
                <Card className="shadow-lg border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Send className="h-6 w-6 text-primary"/>
                           Submit a Ticket
                        </CardTitle>
                        <CardDescription>
                            Describe your issue below and our support team will assist you. Your user details will be sent automatically.
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
                                        placeholder="e.g. Issue with withdrawal" 
                                        required 
                                        value={subject} 
                                        onChange={(e) => setSubject(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Describe Your Issue</Label>
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
