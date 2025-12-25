
'use client';

import { useState, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, AlertTriangle, Trash2, Database, ExternalLink, Calendar } from 'lucide-react';
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

const SQL_FUNCTIONS_CODE = `
-- Function to reset the entire application (except settings)
CREATE OR REPLACE FUNCTION truncate_all_tables(tables text[])
RETURNS void AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if the user is a super-admin
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
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to selectively delete history records
CREATE OR REPLACE FUNCTION truncate_history(table_name text, before_date date)
RETURNS void AS $$
DECLARE
    is_admin boolean;
BEGIN
    -- Check if the user is a super-admin
    SELECT u.id = '7fa62eb6-4e08-4064-ace3-3f6116efa29f'
    INTO is_admin
    FROM auth.users u
    WHERE u.id = auth.uid();

    IF is_admin THEN
        IF before_date IS NULL THEN
            -- If no date is provided, truncate the entire table
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(table_name) || ' RESTART IDENTITY CASCADE';
        ELSE
            -- If a date is provided, delete records created before that date
            EXECUTE 'DELETE FROM ' || quote_ident(table_name) || ' WHERE created_at < $1'
            USING before_date;
        END IF;
    ELSE
        RAISE EXCEPTION 'You do not have permission to perform this action.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

export default function DangerZonePage() {
    const { toast } = useToast();
    const [isResetting, startResetting] = useTransition();
    const [isDeletingHistory, startDeletingHistory] = useTransition();
    const [confirmationText, setConfirmationText] = useState('');
    
    const [historyTable, setHistoryTable] = useState('');
    const [deleteDate, setDeleteDate] = useState('');
    const [historyDialogTitle, setHistoryDialogTitle] = useState('');

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
                const { error } = await supabase.rpc('truncate_all_tables', { tables: TABLES_TO_TRUNCATE });
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
                    description: error.message || 'An error occurred. Please ensure the `truncate_all_tables` RPC function exists and has correct permissions.',
                });
            } finally {
                setConfirmationText('');
            }
        });
    };
    
    const handleDeleteHistory = () => {
        if (!historyTable) return;
        
        startDeletingHistory(async () => {
            try {
                 const { error } = await supabase.rpc('truncate_history', { 
                    table_name: historyTable,
                    before_date: deleteDate || null
                });
                if (error) throw error;
                
                toast({
                    title: 'History Cleared',
                    description: `${historyTable.replace(/_/g, ' ')} history has been successfully cleared.`
                });
            } catch (error: any) {
                 console.error(`Error deleting ${historyTable} history:`, error);
                toast({
                    variant: 'destructive',
                    title: 'Delete Failed',
                    description: error.message || `Could not delete ${historyTable} history.`
                });
            } finally {
                setHistoryTable('');
                setDeleteDate('');
                setHistoryDialogTitle('');
            }
        });
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-destructive">Danger Zone</h1>
                <p className="text-muted-foreground">Be extremely careful. These actions are irreversible.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Clear History</CardTitle>
                        <CardDescription>
                            Selectively delete history data. This is useful for clearing logs without affecting user balances or totals.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full" onClick={() => {
                                    setHistoryTable('usertasks');
                                    setHistoryDialogTitle('Clear Task History');
                                }}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Clear Task History
                                </Button>
                            </AlertDialogTrigger>
                             <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full" onClick={() => {
                                    setHistoryTable('wallet_history');
                                    setHistoryDialogTitle('Clear Wallet History');
                                }}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Clear Wallet History
                                </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{historyDialogTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        You can delete all entries or only those created before a specific date. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4 space-y-2">
                                     <Label htmlFor="delete-date" className="flex items-center gap-2"><Calendar/> Clear entries before date (Optional)</Label>
                                     <Input 
                                        id="delete-date"
                                        type="date"
                                        value={deleteDate}
                                        onChange={e => setDeleteDate(e.target.value)}
                                     />
                                     <p className="text-xs text-muted-foreground">If you leave this blank, all history for this table will be deleted.</p>
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeletingHistory}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteHistory} disabled={isDeletingHistory}>
                                         {isDeletingHistory && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                         Confirm Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle>Reset Application Data</CardTitle>
                        <CardDescription>
                            This will permanently delete ALL users, tasks, wallets, etc. Your settings will NOT be affected.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    <AlertTriangle className="mr-2 h-4 w-4" />
                                    Reset Entire Application
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-6 w-6 text-destructive"/> Are you absolutely sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will delete ALL data. To confirm, type <strong>RESET ALL DATA</strong> into the box below.
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

            <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Database className="h-4 w-4" />
                <AlertTitle className="text-blue-900 font-bold">First-Time Setup Required</AlertTitle>
                <p className="text-blue-800 text-sm">
                    To use these features, you must first run the SQL code below in your Supabase project's SQL Editor. This only needs to be done once.
                </p>
                <div className="mt-4 bg-background p-3 rounded-md border border-blue-200">
                   <pre className="text-xs text-blue-950 whitespace-pre-wrap font-mono">
                        {SQL_FUNCTIONS_CODE.trim()}
                   </pre>
                </div>
                <div className="mt-4 flex gap-2">
                     <CopyButton value={SQL_FUNCTIONS_CODE.trim()} variant="secondary" className="bg-white">
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
