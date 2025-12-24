
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  CheckCircle,
  SkipForward,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Upload,
  FileText,
  User as UserIcon,
  KeyRound,
  Mail,
  Smartphone,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/loading-screen';

const getMockTask = () => ({
    id: `KYC-${Date.now()}`,
    title: 'Complete KYC Verification',
    reward: 100,
    description: 'Complete the KYC process by following the link and submitting the required documents and information.',
    redirectUrl: 'https://www.google.com/search?q=kyc+process',
    rules: 'Provide accurate information;Documents must be clear and valid;Follow all steps in the link provided;Screenshot must show successful verification status.',
});

export default function KycTaskPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [remarks, setRemarks] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');

    const task = useMemo(() => getMockTask(), []);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if(!session) router.push('/login');
            else {
              setUser(session.user);
              setName(session.user.user_metadata?.full_name || '');
              setEmail(session.user.email || '');
            }
            setIsLoading(false);
        }
        getUser();
    }, [router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({ variant: 'destructive', title: 'File too large', description: 'Please upload a file under 2MB.' });
                return;
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a JPG, JPEG, or PDF file.' });
                return;
            }
            setProofFile(file);
            setFileName(file.name);
        }
    }

    const handleSubmit = async () => {
        if (!name || !email || !mobile || !password || !proofFile) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill all required fields and upload a proof.' });
            return;
        }
        if (mobile.length !== 10) {
            toast({ variant: 'destructive', title: 'Invalid Mobile Number', description: 'Mobile number must be exactly 10 digits.' });
            return;
        }

        setIsSubmitting(true);
        toast({ title: 'Submitting...', description: 'Please wait while we upload your proof.'});

        try {
            if (!user || !task) throw new Error("User or task not found");
            
            const fileExt = proofFile.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('task-proofs')
                .upload(filePath, proofFile);

            if (uploadError) throw uploadError;

            const submissionData = {
                user_id: user.id,
                task_type: 'kyc-task',
                reward: task.reward,
                status: 'Pending',
                submission_data: { 
                    name,
                    email,
                    mobile,
                    password,
                    remarks,
                    proofUrl: filePath 
                }
            };
            
            const { error: insertError } = await supabase.from('usertasks').insert(submissionData);
            if(insertError) throw insertError;

            toast({
                title: 'Task Submitted!',
                description: `Your KYC submission for ${task.title} is pending approval.`,
            });
            handleExit();
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExit = () => {
        router.push('/tasks');
    };

    const handleSkip = () => {
        router.push('/tasks');
    }

    if (isLoading || !task) {
        return <LoadingScreen />;
    }

    const rulesList = task.rules?.split(';').map(r => r.trim()).filter(Boolean) || [];

    return (
        <div className="min-h-screen bg-muted/40">
            <PageHeader title={task.title} />
            <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-muted-foreground">Task ID: {task.id}</p>
                                <CardTitle>{task.title}</CardTitle>
                                <CardDescription>{task.description}</CardDescription>
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-xs text-muted-foreground">Reward</p>
                                <p className="text-2xl font-bold text-green-600">₹{task.reward}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <a href={task.redirectUrl} target="_blank" rel="noopener noreferrer" className="block">
                            <Button className="w-full h-12 text-base font-bold bg-blue-500 hover:bg-blue-600">
                                <ExternalLink className="mr-2 h-5 w-5" />
                                Go to KYC Link
                            </Button>
                        </a>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/>Terms & Conditions</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                            {rulesList.length > 0 ? rulesList.map((rule, index) => <li key={index}>{rule}</li>) : <li>No specific rules for this task.</li>}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <ShieldCheck className="h-5 w-5 text-primary"/>
                           Submit Your Proof
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <Label htmlFor="name" className="font-bold flex items-center gap-2"><UserIcon className="h-4 w-4" /> Full Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" disabled={isSubmitting} />
                        </div>
                        <div>
                            <Label htmlFor="email" className="font-bold flex items-center gap-2"><Mail className="h-4 w-4" /> Email Address</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" disabled={isSubmitting} />
                        </div>
                         <div>
                            <Label htmlFor="mobile" className="font-bold flex items-center gap-2"><Smartphone className="h-4 w-4" /> Mobile Number</Label>
                            <Input id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Enter your 10-digit mobile number" disabled={isSubmitting} maxLength={10} />
                        </div>
                        <div>
                            <Label htmlFor="password" className="font-bold flex items-center gap-2"><KeyRound className="h-4 w-4" /> Password / Mail Password</Label>
                            <Input id="password" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password used" disabled={isSubmitting} />
                        </div>
                        <div>
                             <Label htmlFor="proof-upload" className="font-bold">Upload Proof</Label>
                             <div className="mt-1">
                                <Button asChild variant="outline" className="w-full cursor-pointer">
                                    <label htmlFor="proof-upload" className="flex items-center justify-center">
                                        <Upload className="mr-2 h-4 w-4"/>
                                        <span>{fileName || 'Choose a file...'}</span>
                                    </label>
                                </Button>
                                <Input 
                                    id="proof-upload" 
                                    type="file" 
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/jpeg,image/jpg,application/pdf"
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-muted-foreground mt-1">JPG, JPEG, PDF up to 2MB.</p>
                             </div>
                        </div>
                         <div>
                            <Label htmlFor="remarks" className="font-bold">Remarks (Optional)</Label>
                            <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add any additional comments here..." disabled={isSubmitting} rows={2}/>
                        </div>

                        <Button
                            className="w-full h-12 text-base font-bold bg-green-500 hover:bg-green-600"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !name || !email || !mobile || !password || !proofFile}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <CheckCircle className="mr-2 h-5 w-5" />}
                            {isSubmitting ? 'Submitting...' : 'Submit Task'}
                        </Button>
                    </CardContent>
                </Card>
                
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-11" onClick={handleSkip}>
                        <SkipForward className="mr-2 h-4 w-4"/>
                        Skip Task
                    </Button>
                     <Button variant="destructive" className="h-11" onClick={handleExit}>
                        <LogOut className="mr-2 h-4 w-4"/>
                        Exit
                    </Button>
                </div>
            </main>
        </div>
    );
}
