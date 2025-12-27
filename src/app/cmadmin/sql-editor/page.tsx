
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/copy-button';
import { Copy, AlertTriangle, AreaChart, BarChart, Users, Wallet } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';

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

const maintenanceModeSql = `
-- =================================================================
-- FIX: Maintenance Mode
-- =================================================================
-- Adds the 'is_maintenance_mode_enabled' column to your settings.
-- Run this in your Supabase SQL Editor to enable the maintenance mode toggle.
-- =================================================================
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS is_maintenance_mode_enabled BOOLEAN DEFAULT FALSE;
`;

const analyticsToggleSql = `
-- =================================================================
-- FIX: Analytics Toggle
-- =================================================================
-- Adds the 'is_analytics_enabled' column to your settings table.
-- Run this in your Supabase SQL Editor to enable the analytics toggle in settings.
-- =================================================================
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS is_analytics_enabled BOOLEAN DEFAULT TRUE;
`;


const coinManagerMetadataSql = `
-- =================================================================
-- FIX: Coin Manager Metadata
-- =================================================================
-- Adds the 'metadata' column to your coinsubmissions table.
-- Run this in your Supabase SQL Editor to fix the "Update Failed" error on the Coin Manager page.
-- =================================================================
ALTER TABLE public.coinsubmissions
ADD COLUMN IF NOT EXISTS metadata jsonb;
`;

const walletHistoryPolicySql = `
-- =================================================================
-- FIX: Wallet History Permissions
-- =================================================================
-- Allows admins to add reward entries to user wallets.
-- Run this if you get a "violates row-level security policy for table 'wallet_history'" error.
-- =================================================================
CREATE POLICY "Allow admins to create wallet history" ON public.wallet_history
FOR INSERT WITH CHECK (is_admin(auth.uid()));
`;

const dailyStatsFunctionSql = `
-- =================================================================
-- FIX: Business Analytics Chart
-- =================================================================
-- Creates a function to fetch daily statistics for the dashboard chart.
-- Run this ONCE in your Supabase SQL Editor.
-- =================================================================

CREATE OR REPLACE FUNCTION get_daily_dashboard_stats(days_count integer)
RETURNS TABLE(
    date timestamptz,
    total_revenue numeric,
    total_withdrawals numeric,
    new_users_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF is_admin(auth.uid()) THEN
        RETURN QUERY
        WITH date_series AS (
            SELECT generate_series(
                (NOW() - (days_count - 1) * interval '1 day')::date,
                NOW()::date,
                '1 day'::interval
            )::date AS date
        )
        SELECT
            ds.date::timestamptz,
            COALESCE(daily_revenue.total, 0) AS total_revenue,
            COALESCE(daily_withdrawals.total, 0) AS total_withdrawals,
            COALESCE(daily_users.count, 0) AS new_users_count
        FROM date_series ds
        LEFT JOIN (
            -- Calculate total revenue from completed, positive transactions
            SELECT
                wh.created_at::date AS date,
                SUM(wh.amount) AS total
            FROM wallet_history wh
            WHERE wh.type IN ('task_reward', 'coin_credit', 'spin_win', 'referral_bonus') AND wh.status = 'Completed' AND wh.amount > 0
            GROUP BY date
        ) daily_revenue ON ds.date = daily_revenue.date
        LEFT JOIN (
            -- Calculate total withdrawals from approved payments
            SELECT
                p.created_at::date AS date,
                SUM(p.amount) AS total
            FROM payments p
            WHERE p.status = 'Approved'
            GROUP BY date
        ) daily_withdrawals ON ds.date = daily_withdrawals.date
        LEFT JOIN (
            -- Count new users per day
            SELECT
                u.created_at::date AS date,
                COUNT(u.id) AS count
            FROM users u
            GROUP BY date
        ) daily_users ON ds.date = daily_users.date
        ORDER BY ds.date ASC;
    END IF;
END;
$$;
`;

const userReferralCountSql = `
-- =================================================================
-- FIX: User Referral Counts
-- =================================================================
-- Creates a function to fetch all users along with their Level 1 referral count.
-- Run this ONCE to enable sorting by "Top Referrers" on the Users page.
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
            COALESCE(rc.referral_count, 0) AS referral_count
        FROM
            public.users u
        LEFT JOIN (
            SELECT
                referred_by,
                COUNT(*) as referral_count
            FROM
                public.users
            WHERE
                referred_by IS NOT NULL
            GROUP BY
                referred_by
        ) rc ON u.referral_code = rc.referred_by;
    END IF;
END;
$$;
`;

const withdrawalRequestsSql = `
-- =================================================================
-- FIX: Withdrawal Requests Page
-- =================================================================
-- Creates/Updates the function to securely fetch all withdrawal requests
-- for the admin panel. Run this if the Withdrawals page shows an error or is empty.
-- THIS SCRIPT IS SAFE TO RUN MULTIPLE TIMES.
-- =================================================================

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
`;


export default function SqlEditorPage() {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SQL Editor</h1>
        <p className="text-muted-foreground">
          Run these SQL queries in your Supabase project to fix specific issues.
        </p>
      </div>

      <Card className="border-green-500">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wallet className="text-green-500"/> Fix: Withdrawal Requests Page</CardTitle>
            <CardDescription>
                This command creates/updates the necessary database functions to securely fetch all withdrawal requests for the admin panel. Run this if the Withdrawals page shows an error or is empty.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative rounded-md bg-muted/50 p-4">
              <CopyButton 
                value={withdrawalRequestsSql}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
              >
                  <Copy className="h-4 w-4" />
              </CopyButton>
              <pre className="text-sm whitespace-pre-wrap font-mono">
                <code>{withdrawalRequestsSql.trim()}</code>
              </pre>
            </div>
        </CardContent>
       </Card>
      
       <Card className="border-indigo-500">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="text-indigo-500"/> Fix: User Referral Counts</CardTitle>
            <CardDescription>
                This command creates a function to fetch users along with their referral counts. Run this once to enable sorting by "Top Referrers" on the Users page.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative rounded-md bg-muted/50 p-4">
              <CopyButton 
                value={userReferralCountSql}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
              >
                  <Copy className="h-4 w-4" />
              </CopyButton>
              <pre className="text-sm whitespace-pre-wrap font-mono">
                <code>{userReferralCountSql.trim()}</code>
              </pre>
            </div>
        </CardContent>
       </Card>

       <Card className="border-cyan-500">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart className="text-cyan-500"/> Fix: Analytics Toggle</CardTitle>
            <CardDescription>
                This command adds the necessary column to your database to control the Analytics Chart from the admin settings page. Run this once.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative rounded-md bg-muted/50 p-4">
              <CopyButton 
                value={analyticsToggleSql}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
              >
                  <Copy className="h-4 w-4" />
              </CopyButton>
              <pre className="text-sm whitespace-pre-wrap font-mono">
                <code>{analyticsToggleSql.trim()}</code>
              </pre>
            </div>
        </CardContent>
       </Card>

      <Card className="border-purple-500">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><AreaChart className="text-purple-500"/> Fix: Business Analytics Chart</CardTitle>
            <CardDescription>
                This command creates the necessary database function to power the Business Analytics chart on the dashboard. Run this once.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative rounded-md bg-muted/50 p-4">
              <CopyButton 
                value={dailyStatsFunctionSql}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
              >
                  <Copy className="h-4 w-4" />
              </CopyButton>
              <pre className="text-sm whitespace-pre-wrap font-mono">
                <code>{dailyStatsFunctionSql.trim()}</code>
              </pre>
            </div>
        </CardContent>
       </Card>

       <Card className="border-destructive">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle/> Fix: Maintenance Mode</CardTitle>
            <CardDescription>
                This command adds the necessary column to your database to control Maintenance Mode from the admin panel. Run this if the toggle is not working.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative rounded-md bg-muted/50 p-4">
              <CopyButton 
                value={maintenanceModeSql}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
              >
                  <Copy className="h-4 w-4" />
              </CopyButton>
              <pre className="text-sm whitespace-pre-wrap font-mono">
                <code>{maintenanceModeSql.trim()}</code>
              </pre>
            </div>
        </CardContent>
       </Card>
      
       <Card className="border-orange-500">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-orange-500"/> Fix: Coin Manager Metadata</CardTitle>
            <CardDescription>
                This command adds the `metadata` column to the `coinsubmissions` table, which is needed to save rejection reasons or approval notes.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative rounded-md bg-muted/50 p-4">
              <CopyButton 
                value={coinManagerMetadataSql}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
              >
                  <Copy className="h-4 w-4" />
              </CopyButton>
              <pre className="text-sm whitespace-pre-wrap font-mono">
                <code>{coinManagerMetadataSql.trim()}</code>
              </pre>
            </div>
        </CardContent>
       </Card>

       <Card className="border-blue-500">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-blue-500"/> Fix: Wallet History Permissions</CardTitle>
            <CardDescription>
                Allows admins to credit rewards to user wallets. Run this if you get a "violates row-level security policy for table 'wallet_history'" error when approving tasks or coins.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="relative rounded-md bg-muted/50 p-4">
              <CopyButton 
                value={walletHistoryPolicySql}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
              >
                  <Copy className="h-4 w-4" />
              </CopyButton>
              <pre className="text-sm whitespace-pre-wrap font-mono">
                <code>{walletHistoryPolicySql.trim()}</code>
              </pre>
            </div>
        </CardContent>
       </Card>

       <Card>
        <CardHeader>
            <CardTitle>Master RLS & Functions Script</CardTitle>
            <CardDescription>
                This is a master script to fix all permission and data-fetching issues in the admin panel. Run this entire script in your Supabase SQL Editor. It will create secure functions for admins and apply Row-Level Security to all necessary tables.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="relative rounded-md bg-muted/50 p-4">
              <CopyButton 
                value={masterSqlScript}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
              >
                  <Copy className="h-4 w-4" />
              </CopyButton>
              <pre className="text-sm whitespace-pre-wrap font-mono">
                <code>{masterSqlScript.trim()}</code>
              </pre>
            </div>
        </CardContent>
       </Card>

    </div>
  );
}

