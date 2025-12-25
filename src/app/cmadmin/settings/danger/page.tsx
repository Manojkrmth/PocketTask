
'use client';

import { useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';

const TABLES_TO_TRUNCATE = [
    'notifications',
    'wallet_history',
    'usertasks',
    'support_tickets',
    'spin_rewards',
    'payments',
    'admins',
    'coinsubmissions',
    'gmail_tasks',
    'gmail_task_batches',
    'visit_earn_tasks',
    'watch_earn_tasks',
    'users'
];

export default function DangerZonePage() {
    const { toast } = useToast();
    const [isResetting, startResetting] = useTransition();
    const [confirmationText, setConfirmationText] = useState('');

    const handleResetData = () => {
        if (confirmationText !== 'RESET ALL DATA') {
            toast({
                variant: 'destructive',
                title: 'Confirmation failed',
                description: 'Please type the exact confirmation phrase to proceed.'
            });
            return;
        }

        startResetting(async () => {
            try {
                // We need to call a Supabase function to do this securely
                const { error } = await supabase.rpc('truncate_tables', { tables: TABLES_TO_TRUNCATE });
                if (error) throw error;
                
                toast({
                    title: 'Application Reset Successful',
                    description: 'All user and transactional data has been cleared.'
                });
            } catch (error: any) {
                console.error("Error resetting data:", error);
                toast({
                    variant: 'destructive',
                    title: 'Reset Failed',
                    description: error.message || 'An error occurred while trying to reset the data. You may need to create the `truncate_tables` RPC function in your database.',
                });
            } finally {
                setConfirmationText('');
            }
        });
    };
    
    // Note for developer: You need to create the `truncate_tables` function in your Supabase SQL editor.
    // Go to Database -> Functions -> Create a new function.
    // Use the following SQL:
    /*
    CREATE OR REPLACE FUNCTION truncate_tables(tables text[])
    RETURNS void AS $$
    BEGIN
      EXECUTE 'TRUNCATE ' || array_to_string(tables, ', ') || ' RESTART IDENTITY CASCADE';
    END;
    $$ LANGUAGE plpgsql;
    */


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-destructive">Danger Zone</h1>
                <p className="text-muted-foreground">Be extremely careful. These actions are irreversible.</p>
            </div>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle>Reset Application Data</CardTitle>
                    <CardDescription>
                        This will permanently delete all users, tasks, submissions, wallets, tickets, and other transactional data. 
                        Your settings will NOT be affected. This action cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Reset All Application Data
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-6 w-6 text-destructive"/> Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action is permanent and will delete all user data. To confirm, please type <strong>RESET ALL DATA</strong> into the box below.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4">
                                <Input 
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    placeholder="RESET ALL DATA"
                                    className="font-mono"
                                />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleResetData}
                                    disabled={isResetting || confirmationText !== 'RESET ALL DATA'}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    I understand, reset all data
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}

