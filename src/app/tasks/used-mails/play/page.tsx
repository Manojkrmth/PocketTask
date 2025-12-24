'use client';

import { useState } from 'react';
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

interface UsedMailData {
    email: string;
    password?: string;
    recoveryMail?: string;
}

const RATE_PER_EMAIL = 2; // Example rate in INR

export default function UsedMailsPage() {
    const { toast } = useToast();
    const { formatCurrency } = useCurrency();

    // State for single submission
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [recoveryMail, setRecoveryMail] = useState('');
    const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

    // State for bulk submission
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const [parsedData, setParsedData] = useState<UsedMailData[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast({ variant: 'destructive', title: 'Email is required' });
            return;
        }
        setIsSubmittingSingle(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast({ title: 'Success', description: 'Used mail submitted successfully.' });
        setEmail('');
        setPassword('');
        setRecoveryMail('');
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
            setParsedData([]); // Reset previous data

            setIsParsing(true);
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const validData = results.data.filter((row: any) => row.email && typeof row.email === 'string' && row.email.includes('@')) as UsedMailData[];
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
        if (parsedData.length === 0) {
            toast({ variant: 'destructive', title: 'No data to submit' });
            return;
        }
        setIsSubmittingBulk(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast({ title: 'Success', description: `${parsedData.length} emails have been submitted.` });
        // Reset state
        setCsvFile(null);
        setFileName('');
        setParsedData([]);
        setIsSubmittingBulk(false);
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

    const totalEarning = parsedData.length * RATE_PER_EMAIL;

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
                                        <Input id="email" type="email" placeholder="used.email@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isSubmittingSingle} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="flex items-center gap-2"><KeyRound /> Password</Label>
                                        <Input id="password" type="text" placeholder="Account password (optional)" value={password} onChange={e => setPassword(e.target.value)} disabled={isSubmittingSingle} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="recoveryMail" className="flex items-center gap-2"><Mail /> Recovery Mail</Label>
                                        <Input id="recoveryMail" type="email" placeholder="recovery.email@example.com (optional)" value={recoveryMail} onChange={e => setRecoveryMail(e.target.value)} disabled={isSubmittingSingle} />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full" disabled={isSubmittingSingle || !email}>
                                        {isSubmittingSingle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Single Email
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
                                            disabled={isSubmittingBulk}
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
                                <Button className="w-full" onClick={handleBulkSubmit} disabled={isSubmittingBulk || parsedData.length === 0 || isParsing}>
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
