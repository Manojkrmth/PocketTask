
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Mail, User, MessageSquare, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SupportTicketPage() {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mobile && mobile.length !== 10) {
            toast({
                variant: 'destructive',
                title: 'Invalid Mobile Number',
                description: 'Please enter a valid 10-digit mobile number.',
            });
            return;
        }

        setIsLoading(true);

        // Simulate API call to create a ticket
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsLoading(false);
        toast({
            title: "Ticket Created!",
            description: "Your support ticket has been submitted. Our team will get back to you soon.",
        });

        // Clear form
        setName('');
        setMobile('');
        setEmail('');
        setSubject('');
        setMessage('');
    };

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
                            Describe your issue below and our support team will assist you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2"><User className="h-4 w-4" /> Full Name</Label>
                                <Input 
                                    id="name" 
                                    type="text" 
                                    placeholder="e.g. Radhe Shyam" 
                                    required 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="flex items-center gap-2"><Phone className="h-4 w-4" /> Mobile Number</Label>
                                <Input 
                                    id="mobile" 
                                    type="tel" 
                                    placeholder="e.g. 9876543210" 
                                    value={mobile} 
                                    onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                                    disabled={isLoading}
                                    maxLength={10}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="e.g. user@gmail.com" 
                                    required 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
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
                            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isLoading}>
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
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
