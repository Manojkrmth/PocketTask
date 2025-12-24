
'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { UploadCloud, Loader2, FileDown, IndianRupee, FileCheck2, User, KeyRound, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/context/currency-context';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function UsedMailsPage() {
    const { toast } = useToast();
    const { formatCurrency } = useCurrency();
    const router = useRouter();

    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [taskConfig, setTaskConfig] = useState<any>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [recoveryMail, setRecoveryMail] = useState('');
    const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
            } else {
                router.push('/login');
            }
            
            const { data: settings, error } = await supabase
                .from('settings')
                .select('settings_data->taskSettings')
                .eq('id', 1)
                .single();

            if (error || !settings || !settings.taskSettings) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not load task configuration.' });
            } else {
                const config = (settings.taskSettings as any[]).find(t => t.id === 'used-mails');
                setTaskConfig(config || { reward: 2 }); // Fallback reward
            }
            
            setIsLoadingUser(false);
        };
        initialize();
    }, [router, toast]);
    
    const ratePerEmail = taskConfig?.reward || 0;

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast({ variant: 'destructive', title: 'Email is required' });
            return;
        }
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in' });
            return;
        }

        setIsSubmittingSingle(true);
        
        const submission = {
            user_id: user.id,
            reward: ratePerEmail,
            status: 'Pending',
            task_type: 'used-mail-single',
            submission_data: { 
                email, 
                password, 
                recovery_mail: recoveryMail,
                entry_count: 1
            }
        };

        const { error } = await supabase.from('usertasks').insert(submission);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Used mail submitted successfully.' });
            setEmail('');
            setPassword('');
            setRecoveryMail('');
        }
        setIsSubmittingSingle(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'text/csv') {
                toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a CSV file.' });
                return;
            }
            setCsvFile(file);
            setFileName(file.name);
            setParsedData([]);

            setIsParsing(true);
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const validData = results.data.filter((row: any) => row.email && typeof row.email === 'string' && row.email.includes('@'));
                    if (validData.length === 0) {
                        toast({ variant: 'destructive', title: 'No valid data found', description: 'Please check your CSV file. It must have an "email" column.' });
                    }
                    setParsedData(validData);
                    setIsParsing(false);
                },
                error: (error) => {
                    toast({ variant: 'destructive', title: 'CSV Parsing Error', description: error.message });
                    setIsParsing(false);
                }
            });
        }
    };

    const handleBulkSubmit = async () => {
        if (parsedData.length === 0 || !csvFile) {
            toast({ variant: 'destructive', title: 'No data to submit' });
            return;
        }
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in' });
            return;
        }

        setIsSubmittingBulk(true);
        
        const totalReward = parsedData.length * ratePerEmail;

        try {
            const { data: taskData, error: taskError } = await supabase
                .from('usertasks')
                .insert({
                    user_id: user.id,
                    reward: totalReward,
                    status: 'Pending',
                    task_type: 'used-mail-bulk',
                    submission_data: {
                        file_name: csvFile.name,
                        entry_count: parsedData.length
                    }
                })
                .select()
                .single();

            if (taskError) throw taskError;

            toast({ title: 'Success', description: `${parsedData.length} emails have been submitted for verification.` });
            setCsvFile(null);
            setFileName('');
            setParsedData([]);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Bulk Submission Failed', description: error.message });
        } finally {
            setIsSubmittingBulk(false);
        }
    };
    
    const handleDownloadSample = () => {
        const csvContent = "email,password,recoveryMail\nsample1@example.com,pass123,recovery1@example.com\nsample2@example.com,pass456,recovery2@example.com";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "sample_used_mails.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const totalEarning = parsedData.length * ratePerEmail;
    const isLoading = isLoadingUser || isSubmittingSingle || isSubmittingBulk || isParsing;

    return (
        <div>
            <PageHeader title="Used Mails Submission" />
            <main className="p-4 space-y-4">
                <Tabs defaultValue="single">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="single">Single Submit</TabsTrigger>
                        <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
                    </TabsList>
                    <TabsContent value="single">
                        <Card>
                            <CardHeader>
                                <CardTitle>Submit a Used Mail</CardTitle>
                                <CardDescription>Enter the details of a single used email account.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSingleSubmit}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="flex items-center gap-2"><User /> Email Address</Label>
                                        <Input id="email" type="email" placeholder="used.email@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="flex items-center gap-2"><KeyRound /> Password</Label>
                                        <Input id="password" type="text" placeholder="Account password (optional)" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="recoveryMail" className="flex items-center gap-2"><Mail /> Recovery Mail</Label>
                                        <Input id="recoveryMail" type="email" placeholder="recovery.email@example.com (optional)" value={recoveryMail} onChange={e => setRecoveryMail(e.target.value)} disabled={isLoading} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full" disabled={isLoading || !email || ratePerEmail === 0}>
                                        {isSubmittingSingle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Single Email ({formatCurrency(ratePerEmail)})
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </TabsContent>
                    <TabsContent value="bulk">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bulk Upload with CSV</CardTitle>
                                <CardDescription>Upload a CSV file with columns: email, password, recoveryMail.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="csv-upload">Upload your CSV File</Label>
                                    <div className="relative">
                                        <Button asChild variant="outline" className="w-full h-24 border-dashed border-2 flex-col gap-2 cursor-pointer">
                                            <label htmlFor="csv-upload">
                                                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                                                <span className="text-muted-foreground">{fileName || 'Click to upload or drag & drop'}</span>
                                            </label>
                                        </Button>
                                        <Input 
                                            id="csv-upload" 
                                            type="file" 
                                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" 
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                <Button variant="secondary" className="w-full" onClick={handleDownloadSample}>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Download Sample CSV
                                </Button>
                                
                                {isParsing && (
                                    <div className="flex items-center justify-center text-muted-foreground gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Parsing file...</span>
                                    </div>
                                )}
                                
                                {parsedData.length > 0 && (
                                    <Alert>
                                        <FileCheck2 className="h-4 w-4" />
                                        <AlertTitle>File Ready for Upload!</AlertTitle>
                                        <AlertDescription className="space-y-1 mt-2">
                                            <p>Found <strong>{parsedData.length}</strong> valid email entries.</p>
                                            <div className="flex items-center gap-2 font-bold text-green-600">
                                                <IndianRupee className="h-4 w-4" />
                                                <span>Estimated Earning: {formatCurrency(totalEarning)}</span>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                             <CardFooter>
                                <Button className="w-full" onClick={handleBulkSubmit} disabled={isLoading || parsedData.length === 0 || ratePerEmail === 0}>
                                    {isSubmittingBulk && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit {parsedData.length > 0 ? `${parsedData.length} Emails` : 'Emails'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
