'use client';

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadCloud, Check, X, Download, Trash2, Loader2, PlusCircle, Pause, Play, Eye, Search, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// --- Dummy Data ---
const dummyTaskBatches = [
    { id: 'batch01', name: 'June Gmail Tasks', reward: 5.00, isActive: true, createdAt: new Date() },
    { id: 'batch02', name: 'July Social Media', reward: 3.50, isActive: false, createdAt: new Date(Date.now() - 86400000 * 5) },
];

const dummyBatchStats = {
    'batch01': { total: 100, submitted: 50, approved: 30, rejected: 5, pendingVerification: 15 },
    'batch02': { total: 200, submitted: 180, approved: 150, rejected: 20, pendingVerification: 10 },
};
// --- End Dummy Data ---

function BatchCard({ batch, onDelete }: { batch: any, onDelete: (batchId: string) => void }) {
    const { toast } = useToast();
    const [isTransitioning, startTransition] = useTransition();
    const [stats, setStats] = useState({ total: 0, submitted: 0, approved: 0, rejected: 0, pendingVerification: 0 });
    const [confirmText, setConfirmText] = useState('');
    
    useEffect(() => {
        setStats(dummyBatchStats[batch.id] || { total: 0, submitted: 0, approved: 0, rejected: 0, pendingVerification: 0 });
    }, [batch.id]);

    const toggleBatchStatus = async () => {
        startTransition(() => {
            // Simulate API call
            setTimeout(() => {
                 toast({ title: 'Batch Updated', description: `Batch is now ${!batch.isActive ? 'Active' : 'Paused'}.` });
            }, 500);
        });
    };
    
    const isDeleteDisabled = confirmText !== 'DELETE';
    const progress = stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0;
    const pendingToSubmitCount = stats.total - stats.submitted;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="leading-tight flex items-center gap-2">{batch.name}</CardTitle>
                        <CardDescription>Reward: <span className="font-bold text-green-600">₹{batch.reward || '0'}</span> | Created: {batch.createdAt?.toLocaleDateString()}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={batch.isActive}
                            onCheckedChange={toggleBatchStatus}
                            disabled={isTransitioning}
                        />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" disabled={isTransitioning}><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This action will permanently delete the batch. <br/><br/>Please type <strong className="text-destructive">DELETE</strong> to confirm.</AlertDialogDescription>
                                </AlertDialogHeader>
                                 <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => { if (!isDeleteDisabled) onDelete(batch.id); }} disabled={isDeleteDisabled}>Delete Batch</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div>
                    <div className="mb-4">
                        <Progress value={progress} className="w-full" />
                        <div className="text-xs text-muted-foreground mt-1 text-right">{stats.submitted} / {stats.total} tasks submitted</div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-center">
                        <div><p className="text-xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
                        <div><p className="text-xl font-bold">{pendingToSubmitCount}</p><p className="text-xs text-muted-foreground">To-Do</p></div>
                         <div><p className="text-xl font-bold text-yellow-600">{stats.pendingVerification}</p><p className="text-xs text-muted-foreground">Pending</p></div>
                         <div><p className="text-xl font-bold text-green-600">{stats.approved}</p><p className="text-xs text-muted-foreground">Approved</p></div>
                         <div><p className="text-xl font-bold text-red-600">{stats.rejected}</p><p className="text-xs text-muted-foreground">Rejected</p></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AdminTasksPage() {
    const { toast } = useToast();
    const [taskBatches, setTaskBatches] = useState(dummyTaskBatches);
    
    const handleDeleteBatch = (batchId: string) => {
        setTaskBatches(prev => prev.filter(b => b.id !== batchId));
        toast({ title: "Batch Deleted", description: `Batch has been permanently deleted.` });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Task Manager</h1>
                    <p className="text-muted-foreground">Manage task batches and bulk verify submissions.</p>
                </div>
                 <div className="flex gap-2 flex-wrap">
                    <Button><UploadCloud className="mr-2 h-4 w-4" /> Upload New Batch</Button>
                 </div>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Global Actions</CardTitle>
                    <CardDescription>Perform actions across all batches.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download All Pending</Button>
                    <Button variant="outline"><UploadCloud className="mr-2 h-4 w-4" />Bulk Approve (All)</Button>
                    <Button variant="destructive"><UploadCloud className="mr-2 h-4 w-4" />Bulk Reject (All)</Button>
                </CardContent>
             </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Batches</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {taskBatches.map(batch => (
                            <BatchCard key={batch.id} batch={batch} onDelete={handleDeleteBatch} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
