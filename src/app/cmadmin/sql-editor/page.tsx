

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/copy-button';
import { Copy, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const resetAllSqlScript = `
-- =================================================================
-- DANGER: RESET ALL RLS POLICIES & FUNCTIONS
-- =================================================================
-- This script will drop ALL RLS policies and ALL custom functions
-- from your database. This is irreversible.
-- =================================================================

-- Step 1: Drop all RLS policies from all tables in the public schema.
DO $$
DECLARE
    p RECORD;
BEGIN
    FOR p IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(p.policyname) || ' ON public.' || quote_ident(p.tablename) || ';';
        RAISE NOTICE 'Dropped policy % on table %', p.policyname, p.tablename;
    END LOOP;
END $$;

-- Step 2: Disable RLS on all tables in the public schema.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY;';
        RAISE NOTICE 'Disabled RLS on table %', r.tablename;
    END LOOP;
END $$;

-- Step 3: Drop all custom functions created for the admin panel.
DROP FUNCTION IF EXISTS is_admin(uuid);
DROP FUNCTION IF EXISTS get_all_users();
DROP FUNCTION IF EXISTS get_all_admins();
DROP FUNCTION IF EXISTS get_all_payment_requests();
DROP FUNCTION IF EXISTS get_user_financials(uuid);
DROP FUNCTION IF EXISTS get_users_with_referral_counts();
DROP FUNCTION IF EXISTS truncate_all_tables();
DROP FUNCTION IF EXISTS truncate_history(text, date);
DROP FUNCTION IF EXISTS get_daily_dashboard_stats(integer);
DROP FUNCTION IF EXISTS get_batch_stats(integer);
DROP FUNCTION IF EXISTS get_and_assign_gmail_task(uuid);
DROP FUNCTION IF EXISTS get_and_assign_visit_earn_task(uuid);
DROP FUNCTION IF EXISTS get_and_assign_watch_earn_task(uuid);
DROP FUNCTION IF EXISTS get_total_users_balance();
DROP FUNCTION IF EXISTS get_total_users_count();
DROP FUNCTION IF EXISTS get_top_referral_users(integer);
`;


export default function SQLEditorPage() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">SQL Editor</h1>
                    <p className="text-muted-foreground">
                        Use these scripts to manage your Supabase database.
                    </p>
                </div>
            </div>

            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Extreme Danger Zone</AlertTitle>
                <AlertDescription>
                    The script below is highly destructive and will remove all your database security (RLS) and logic (functions). Use with extreme caution. This action cannot be undone.
                </AlertDescription>
            </Alert>
            
            <SqlCard
                title="RESET ALL POLICIES & FUNCTIONS"
                description="This script drops ALL Row Level Security policies and custom functions from your database. This will make your data insecure until you re-apply new policies. Use this only if you want to start from a completely clean slate."
                icon={<AlertTriangle className="h-6 w-6 text-destructive"/>}
                sql={resetAllSqlScript}
            />
        </div>
    );
}

function SqlCard({ title, description, icon, sql }: { title: string, description: string, icon: React.ReactNode, sql: string }) {
    return (
        <Card className="border-destructive">
            <CardHeader>
                <div className="flex items-start gap-4">
                    {icon}
                    <div className="flex-1">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative bg-gray-900 text-white p-4 rounded-md font-mono text-sm overflow-x-auto">
                    <CopyButton value={sql} className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 h-8 w-8">
                        <Copy className="h-4 w-4" />
                    </CopyButton>
                    <pre><code>{sql.trim()}</code></pre>
                </div>
            </CardContent>
        </Card>
    )
}
