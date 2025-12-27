
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/copy-button';
import { Copy, AlertTriangle, AreaChart, BarChart, Users, Wallet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const masterSqlScript = `
-- =================================================================
-- MASTER RLS & FUNCTIONS SCRIPT
-- =================================================================
-- This script fixes all data access issues in the admin panel.
-- It creates secure helper functions and applies the correct RLS policies.
-- Run this entire script ONCE in your Supabase SQL Editor.
-- =================================================================

-- Step 1: Create a helper function to check for admin role.
-- Using CREATE OR REPLACE ensures the function is updated without dropping dependencies.
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admins
    WHERE admins.user_id = is_admin.user_id
  );
END;
$$;

-- Step 2: Create/Update secure functions to fetch data for the admin panel.
-- These functions run with the permissions of the user who defined them (the admin).

-- Function to get all users
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF is_admin(auth.uid()) THEN
        RETURN QUERY SELECT * FROM public.users;
    END IF;
END;
$$;

-- Function to get all admins
CREATE OR REPLACE FUNCTION get_all_admins()
RETURNS TABLE(id bigint, user_id uuid, created_at timestamptz, users json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF is_admin(auth.uid()) THEN
    RETURN QUERY
    SELECT
        a.id,
        a.user_id,
        a.created_at,
        json_build_object('full_name', u.full_name, 'email', u.email)
    FROM
        public.admins a
    JOIN
        public.users u ON a.user_id = u.id;
  END IF;
END;
$$;


-- Function to get all payment requests
CREATE OR REPLACE FUNCTION get_all_payment_requests()
RETURNS TABLE(id int, created_at timestamptz, amount numeric, payment_method varchar, payment_details text, status varchar, user_id uuid, metadata jsonb, users json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF is_admin(auth.uid()) THEN
        RETURN QUERY
        SELECT
            p.id,
            p.created_at,
            p.amount,
            p.payment_method,
            p.payment_details,
            p.status,
            p.user_id,
            p.metadata,
            json_build_object('full_name', u.full_name, 'email', u.email)
        FROM
            public.payments p
        JOIN
            public.users u ON p.user_id = u.id
        ORDER BY
            p.created_at DESC;
    END IF;
END;
$$;

-- Function to get user counts with referrals
CREATE OR REPLACE FUNCTION get_users_with_referral_counts()
RETURNS TABLE(
    id uuid,
    full_name text,
    email text,
    mobile text,
    status text,
    created_at timestamptz,
    referral_code text,
    balance_available numeric,
    referral_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF is_admin(auth.uid()) THEN
        RETURN QUERY
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.mobile,
            u.status,
            u.created_at,
            u.referral_code,
            u.balance_available,
            (SELECT count(*) FROM public.users AS r WHERE r.referred_by = u.referral_code) AS referral_count
        FROM
            public.users u;
    END IF;
END;
$$;

-- Function to truncate tables, EXCLUDING admins
CREATE OR REPLACE FUNCTION truncate_all_tables()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  admin_ids uuid[];
BEGIN
  -- Get all admin user_ids
  SELECT array_agg(user_id) INTO admin_ids FROM public.admins;

  -- Delete from tables, excluding admins
  DELETE FROM public.payments WHERE user_id NOT IN (SELECT unnest(admin_ids));
  DELETE FROM public.wallet_history WHERE user_id NOT IN (SELECT unnest(admin_ids));
  DELETE FROM public.usertasks WHERE user_id NOT IN (SELECT unnest(admin_ids));
  DELETE FROM public.support_tickets WHERE user_id NOT IN (SELECT unnest(admin_ids));
  DELETE FROM public.spin_rewards WHERE user_id NOT IN (SELECT unnest(admin_ids));
  DELETE FROM public.coinsubmissions WHERE user_id NOT IN (SELECT unnest(admin_ids));
  
  -- Delete non-admin users from the main users table
  DELETE FROM public.users WHERE id NOT IN (SELECT unnest(admin_ids));
  
  -- We don't delete from `admins` table, but we can truncate other tables that don't have user_id
  TRUNCATE public.notifications RESTART IDENTITY;
  -- We don't truncate settings, featured_offers, etc. as they are configuration.
END;
$$;


-- Step 3: Apply RLS Policies to all necessary tables.

-- USERS Table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to read all users" ON public.users;
DROP POLICY IF EXISTS "Allow individual users to read their own data" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to create their own profile" ON public.users;
CREATE POLICY "Allow admins to read all users" ON public.users FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Allow individual users to read their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to create their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);


-- ADMINS Table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to manage other admins" ON public.admins;
CREATE POLICY "Allow admins to manage other admins" ON public.admins FOR ALL USING (is_admin(auth.uid()));

-- PAYMENTS Table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to manage payments" ON public.payments;
DROP POLICY IF EXISTS "Allow users to see their own payments" ON public.payments;
DROP POLICY IF EXISTS "Allow users to create their own payment requests" ON public.payments;
CREATE POLICY "Allow admins to manage payments" ON public.payments FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow users to see their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to create their own payment requests" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- WALLET_HISTORY Table
ALTER TABLE public.wallet_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to see all wallet history" ON public.wallet_history;
DROP POLICY IF EXISTS "Allow users to see their own wallet history" ON public.wallet_history;
DROP POLICY IF EXISTS "Allow admins to create wallet history" ON public.wallet_history;
CREATE POLICY "Allow admins to see all wallet history" ON public.wallet_history FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Allow users to see their own wallet history" ON public.wallet_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow admins to create wallet history" ON public.wallet_history FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- USER_TASKS Table
ALTER TABLE public.usertasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to manage all user tasks" ON public.usertasks;
DROP POLICY IF EXISTS "Allow users to manage their own tasks" ON public.usertasks;
CREATE POLICY "Allow admins to manage all user tasks" ON public.usertasks FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow users to manage their own tasks" ON public.usertasks FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS Table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow all users to read notifications" ON public.notifications;
CREATE POLICY "Allow admins to manage notifications" ON public.notifications FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow all users to read notifications" ON public.notifications FOR SELECT USING (true);

-- SETTINGS Table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to manage settings" ON public.settings;
DROP POLICY IF EXISTS "Allow all users to read settings" ON public.settings;
CREATE POLICY "Allow admins to manage settings" ON public.settings FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow all users to read settings" ON public.settings FOR SELECT USING (true);

-- SUPPORT_TICKETS Table
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to manage all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Allow users to manage their own tickets" ON public.support_tickets;
CREATE POLICY "Allow admins to manage all tickets" ON public.support_tickets FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow users to manage their own tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id);

-- SPIN_REWARDS Table
ALTER TABLE public.spin_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to view all spin rewards" ON public.spin_rewards;
DROP POLICY IF EXISTS "Allow users to manage their own spin rewards" ON public.spin_rewards;
CREATE POLICY "Allow admins to view all spin rewards" ON public.spin_rewards FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Allow users to manage their own spin rewards" ON public.spin_rewards FOR ALL USING (auth.uid() = user_id);

-- FEATURED_OFFERS Table
ALTER TABLE public.featured_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to manage featured offers" ON public.featured_offers;
DROP POLICY IF EXISTS "Allow all users to read featured offers" ON public.featured_offers;
CREATE POLICY "Allow admins to manage featured offers" ON public.featured_offers FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow all users to read featured offers" ON public.featured_offers FOR SELECT USING (true);

-- DAILY TASKS (VISIT & WATCH EARN)
ALTER TABLE public.visit_earn_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to manage visit earn tasks" ON public.visit_earn_tasks;
DROP POLICY IF EXISTS "Allow all users to read active visit earn tasks" ON public.visit_earn_tasks;
CREATE POLICY "Allow admins to manage visit earn tasks" ON public.visit_earn_tasks FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow all users to read active visit earn tasks" ON public.visit_earn_tasks FOR SELECT USING (is_active = true);

ALTER TABLE public.watch_earn_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to manage watch earn tasks" ON public.watch_earn_tasks;
DROP POLICY IF EXISTS "Allow all users to read active watch earn tasks" ON public.watch_earn_tasks;
CREATE POLICY "Allow admins to manage watch earn tasks" ON public.watch_earn_tasks FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow all users to read active watch earn tasks" ON public.watch_earn_tasks FOR SELECT USING (is_active = true);

-- COINSUBMISSIONS Table
ALTER TABLE public.coinsubmissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admins to manage coin submissions" ON public.coinsubmissions;
DROP POLICY IF EXISTS "Allow users to manage their own coin submissions" ON public.coinsubmissions;
CREATE POLICY "Allow admins to manage coin submissions" ON public.coinsubmissions FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Allow users to manage their own coin submissions" ON public.coinsubmissions FOR ALL USING (auth.uid() = user_id);

`;

const analyticsSqlScript = `
-- =================================================================
-- ANALYTICS SCRIPT (for your new project)
-- =================================================================
-- This script creates functions to calculate daily statistics for
-- the admin dashboard. Run this once in your Supabase SQL Editor.
-- =================================================================

-- Add the new column to the settings table if it doesn't exist
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS is_analytics_enabled boolean DEFAULT true;

-- Function to get daily statistics
CREATE OR REPLACE FUNCTION get_daily_dashboard_stats(days_count integer)
RETURNS TABLE(
    date date,
    total_revenue numeric,
    total_withdrawals numeric,
    new_users_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            (CURRENT_DATE - (days_count - 1) * interval '1 day'),
            CURRENT_DATE,
            '1 day'::interval
        )::date AS date
    ),
    daily_revenue AS (
        SELECT
            (t.created_at AT TIME ZONE 'UTC')::date AS date,
            SUM(t.amount) AS total_revenue
        FROM wallet_history t
        WHERE t.type IN ('task_reward', 'coin_credit', 'spin_win', 'referral_bonus')
          AND t.status = 'Completed'
          AND t.created_at >= (CURRENT_DATE - (days_count - 1) * interval '1 day')
        GROUP BY 1
    ),
    daily_withdrawals AS (
        SELECT
            (p.created_at AT TIME ZONE 'UTC')::date AS date,
            SUM(p.amount) AS total_withdrawals
        FROM payments p
        WHERE p.status = 'Approved'
          AND p.created_at >= (CURRENT_DATE - (days_count - 1) * interval '1 day')
        GROUP BY 1
    ),
    daily_new_users AS (
        SELECT
            (u.created_at AT TIME ZONE 'UTC')::date AS date,
            COUNT(u.id) AS new_users_count
        FROM users u
        WHERE u.created_at >= (CURRENT_DATE - (days_count - 1) * interval '1 day')
        GROUP BY 1
    )
    SELECT
        ds.date,
        COALESCE(dr.total_revenue, 0) AS total_revenue,
        COALESCE(dw.total_withdrawals, 0) AS total_withdrawals,
        COALESCE(dnu.new_users_count, 0)::integer AS new_users_count
    FROM date_series ds
    LEFT JOIN daily_revenue dr ON ds.date = dr.date
    LEFT JOIN daily_withdrawals dw ON ds.date = dw.date
    LEFT JOIN daily_new_users dnu ON ds.date = dnu.date
    ORDER BY ds.date;
END;
$$;
`;

const referralCountSqlScript = `
-- =================================================================
-- USER REFERRAL COUNT FUNCTION
-- =================================================================
-- Run this script to fix user sorting by referral count.
-- =================================================================

CREATE OR REPLACE FUNCTION get_users_with_referral_counts()
RETURNS TABLE(
    id uuid,
    full_name text,
    email text,
    mobile text,
    status text,
    created_at timestamptz,
    referral_code text,
    balance_available numeric,
    referral_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF is_admin(auth.uid()) THEN
        RETURN QUERY
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.mobile,
            u.status,
            u.created_at,
            u.referral_code,
            u.balance_available,
            (SELECT count(*) FROM public.users AS r WHERE r.referred_by = u.referral_code) AS referral_count
        FROM
            public.users u;
    END IF;
END;
$$;
`;

const withdrawalFixSqlScript = `
-- =================================================================
-- WITHDRAWAL REQUESTS FIX
-- =================================================================
-- Run this if you see an error on the Withdrawals page.
-- =================================================================

-- Drop the old functions if they exist, cascading to remove dependent policies temporarily
DROP FUNCTION IF EXISTS get_all_payment_requests();
DROP FUNCTION IF EXISTS is_admin(uuid);

-- Recreate the is_admin helper function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admins
    WHERE admins.user_id = is_admin.user_id
  );
END;
$$;

-- Recreate the secure function to get all payment requests
CREATE OR REPLACE FUNCTION get_all_payment_requests()
RETURNS TABLE(id int, created_at timestamptz, amount numeric, payment_method varchar, payment_details text, status varchar, user_id uuid, metadata jsonb, users json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF is_admin(auth.uid()) THEN
        RETURN QUERY
        SELECT
            p.id,
            p.created_at,
            p.amount,
            p.payment_method,
            p.payment_details,
            p.status,
            p.user_id,
            p.metadata,
            json_build_object('full_name', u.full_name, 'email', u.email)
        FROM
            public.payments p
        JOIN
            public.users u ON p.user_id = u.id
        ORDER BY
            p.created_at DESC;
    END IF;
END;
$$;

-- Note: You must run the MASTER SCRIPT after this to re-apply all RLS policies
-- that were dropped by the CASCADE command.
`;


export default function SQLEditorPage() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">SQL Editor</h1>
                    <p className="text-muted-foreground">
                        Use these scripts to set up and fix your Supabase database.
                    </p>
                </div>
            </div>

            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                    Always run scripts from your Supabase Dashboard's SQL Editor. Never expose database keys on the client-side. After running a script, you may need to refresh the admin panel.
                </AlertDescription>
            </Alert>
            
            <SqlCard
                title="Master RLS & Functions Script"
                description="This is the main script. It sets up all required database functions and Row Level Security (RLS) policies for both the user-facing app and the admin panel. Run this script first when setting up a new project or to fix widespread permission issues."
                icon={<AlertTriangle className="h-6 w-6 text-yellow-500"/>}
                sql={masterSqlScript}
            />

            <SqlCard
                title="Analytics Functions"
                description="This script adds the necessary functions to power the Business Analytics chart on the admin dashboard. Run this once for new projects."
                icon={<BarChart className="h-6 w-6 text-blue-500"/>}
                sql={analyticsSqlScript}
            />

            <SqlCard
                title="Fix: User Referral Counts"
                description="Run this script if the 'Sort by Top Referrers' feature on the Users page is not working correctly. It creates the function needed to count user referrals."
                icon={<Users className="h-6 w-6 text-green-500"/>}
                sql={referralCountSqlScript}
            />
            
            <SqlCard
                title="Fix: Withdrawal Requests"
                description="Run this if the Withdrawals page shows an error about a missing function ('get_all_payment_requests'). This script specifically recreates that function. Note: You must run the Master Script afterwards to re-apply other security policies."
                icon={<Wallet className="h-6 w-6 text-red-500"/>}
                sql={withdrawalFixSqlScript}
            />

        </div>
    );
}

function SqlCard({ title, description, icon, sql }: { title: string, description: string, icon: React.ReactNode, sql: string }) {
    return (
        <Card>
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
