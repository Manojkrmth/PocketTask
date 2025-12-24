
'use client';

import { useState } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Mail, User, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ContactUsPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsLoading(false);
        toast({
            title: "Message Sent!",
            description: "Thanks for reaching out. We'll get back to you soon.",
        });

        // Clear form
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
    };

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
                            Fill out the form below and we'll get back to you as soon as possible.
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
                                    placeholder="Type your message here..." 
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
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-5 w-5" />
                                        Send Message
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
