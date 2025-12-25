
'use client';

import { useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, AlertTriangle, Trash2, Database, ExternalLink } from 'lucide-react';
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
import { Alert, AlertTitle } from '@/components/ui/alert';
import { CopyButton } from '@/components/copy-button';

const TABLES_TO_TRUNCATE = [
    'public.notifications',
    'public.wallet_history',
    'public.usertasks',
    'public.support_tickets',
    'public.spin_rewards',
    'public.payments',
    'public.admins',
    'public.coinsubmissions',
    'public.gmail_tasks',
    'public.gmail_task_batches',
    'public.visit_earn_tasks',
    'public.watch_earn_tasks',
    'public.users'
];

const SQL_FUNCTION_CODE = `
CREATE OR REPLACE FUNCTION truncate_tables(tables text[])
RETURNS void AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if the user is a super-admin by checking against a known super-admin ID
  -- NOTE: Replace '7fa62eb6-4e08-4064-ace3-3f6116efa29f' with the actual super-admin user ID from your auth.users table
  SELECT u.id = '7fa62eb6-4e08-4064-ace3-3f6116efa29f'
  INTO is_admin
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF is_admin THEN
    EXECUTE 'TRUNCATE ' || array_to_string(tables, ', ') || ' RESTART IDENTITY CASCADE';
  ELSE
    RAISE EXCEPTION 'You do not have permission to perform this action.';
  END IF;
END;
$$ LANGUAGE plpgsql;
`;

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
                    description: error.message || 'An error occurred. Please ensure the `truncate_tables` RPC function exists in your database by following the on-page instructions.',
                });
            } finally {
                setConfirmationText('');
            }
        });
    };

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

            <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Database className="h-4 w-4" />
                <AlertTitle className="text-blue-900 font-bold">First-Time Setup Required</AlertTitle>
                <p className="text-blue-800 text-sm">
                    To use the reset feature, you must first run the SQL code below in your Supabase project's SQL Editor. This only needs to be done once.
                </p>
                <div className="mt-4 bg-background p-3 rounded-md border border-blue-200">
                   <pre className="text-xs text-blue-950 whitespace-pre-wrap font-mono">
                        {SQL_FUNCTION_CODE.trim()}
                   </pre>
                </div>
                <div className="mt-4 flex gap-2">
                     <CopyButton value={SQL_FUNCTION_CODE.trim()} variant="secondary" className="bg-white">
                        Copy SQL Code
                    </CopyButton>
                    <Button asChild variant="outline" className="bg-white">
                        <a href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer">
                           <ExternalLink className="mr-2 h-4 w-4"/> Open Supabase SQL Editor
                        </a>
                    </Button>
                </div>
            </Alert>
        </div>
    );
}
