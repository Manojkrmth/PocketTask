
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Database, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CopyButton } from '@/components/copy-button';

export default function SqlEditorPage() {

    const masterSqlScript = `-- =================================================================
-- MASTER RLS & FUNCTIONS SCRIPT
-- Version 2.0
-- =================================================================
-- This script will:
-- 1. DROP all old policies on all tables to ensure a clean slate.
-- 2. CREATE essential helper functions with SECURITY DEFINER.
-- 3. APPLY new, simplified RLS policies for all tables.
-- =================================================================

-- Step 1: Drop all existing RLS policies from all tables
DO $$
DECLARE
    policy_record RECORD;
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        FOR policy_record IN
            SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = table_record.tablename
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public."' || table_record.tablename || '";';
        END LOOP;
    END LOOP;
END;
$$;

-- Step 2: Drop old helper functions if they exist
DROP FUNCTION IF EXISTS public.get_all_users();
DROP FUNCTION IF EXISTS public.get_all_admins();
DROP FUNCTION IF EXISTS public.get_all_payment_requests();
DROP FUNCTION IF EXISTS public.get_user_financials(uuid);
DROP FUNCTION IF EXISTS public.get_total_users_count();
DROP FUNCTION IF EXISTS public.get_total_users_balance();
DROP FUNCTION IF EXISTS public.get_top_referral_users(integer);
DROP FUNCTION IF EXISTS public.truncate_all_tables();
DROP FUNCTION IF EXISTS public.truncate_history(text,date);
DROP FUNCTION IF EXISTS public.get_and_assign_gmail_task(uuid);
DROP FUNCTION IF EXISTS public.get_and_assign_visit_earn_task(uuid);
DROP FUNCTION IF EXISTS public.get_and_assign_watch_earn_task(uuid);
DROP FUNCTION IF EXISTS public.get_batch_stats(integer);
DROP FUNCTION IF EXISTS public.get_tasks_by_batch_and_status(integer, text);
DROP FUNCTION IF EXISTS public.update_referral_and_add_bonus(uuid, text);

-- =================================================================
-- SECTION A: HELPER FUNCTIONS
-- These functions run with elevated privileges to get data for admins.
-- =================================================================

-- Function to get a list of all users (for admin user management)
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
    id uuid,
    full_name text,
    email text,
    mobile text,
    status text,
    created_at timestamp with time zone,
    referral_code text,
    balance_available numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY SELECT u.id, u.full_name, u.email, u.mobile, u.status, u.created_at, u.referral_code, u.balance_available FROM public.users u;
END;
$$;

-- Function to get a list of all admins
CREATE OR REPLACE FUNCTION public.get_all_admins()
RETURNS TABLE (
    id bigint,
    user_id uuid,
    created_at timestamp with time zone,
    full_name text,
    email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.user_id, a.created_at, u.full_name, u.email
    FROM public.admins a
    JOIN public.users u ON a.user_id = u.id;
END;
$$;

-- Function to get all payment requests (for admin withdrawals page)
CREATE OR REPLACE FUNCTION public.get_all_payment_requests()
RETURNS TABLE (
    id bigint,
    created_at timestamp with time zone,
    amount numeric,
    payment_method character varying,
    payment_details text,
    status character varying,
    user_id uuid,
    metadata jsonb,
    users json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.created_at, p.amount, p.payment_method, p.payment_details, p.status, p.user_id, p.metadata,
        json_build_object('full_name', u.full_name, 'email', u.email)
    FROM
        public.payments p
    LEFT JOIN
        public.users u ON p.user_id = u.id;
END;
$$;


-- Function for dashboard stats
CREATE OR REPLACE FUNCTION public.get_total_users_count() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN (SELECT COUNT(*) FROM auth.users); END; $$;
CREATE OR REPLACE FUNCTION public.get_total_users_balance() RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN (SELECT SUM(balance_available) FROM public.users); END; $$;
CREATE OR REPLACE FUNCTION public.get_top_referral_users(limit_count integer) RETURNS TABLE(id uuid, full_name text, email text, referral_count bigint) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT u.id, u.full_name, u.email, COUNT(r.id) as referral_count FROM public.users u JOIN public.users r ON u.referral_code = r.referred_by GROUP BY u.id ORDER BY referral_count DESC LIMIT limit_count; END; $$;
CREATE OR REPLACE FUNCTION public.get_user_financials(p_user_id uuid) RETURNS TABLE(available_balance numeric, pending_balance numeric, total_earnings numeric, total_withdrawn numeric) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT (SELECT u.balance_available FROM public.users u WHERE u.id = p_user_id), (SELECT COALESCE(SUM(wh.amount), 0) FROM public.wallet_history wh WHERE wh.user_id = p_user_id AND wh.type = 'withdrawal_pending'), (SELECT COALESCE(SUM(wh.amount), 0) FROM public.wallet_history wh WHERE wh.user_id = p_user_id AND wh.amount > 0 AND wh.status = 'Completed'), (SELECT COALESCE(SUM(ABS(wh.amount)), 0) FROM public.wallet_history wh WHERE wh.user_id = p_user_id AND wh.type LIKE 'withdrawal%' AND wh.status = 'Completed'); END; $$;

-- Functions for task management
CREATE OR REPLACE FUNCTION public.get_and_assign_gmail_task(user_id_input uuid) RETURNS TABLE(id bigint, full_name text, gmail_user text, password text, recovery_mail text) LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE task_record RECORD; BEGIN SELECT * INTO task_record FROM public.gmail_tasks WHERE is_assigned = false AND batch_id IN (SELECT id FROM public.gmail_task_batches WHERE status = 'active') ORDER BY random() LIMIT 1 FOR UPDATE; IF FOUND THEN UPDATE public.gmail_tasks SET is_assigned = true, assigned_to = user_id_input, assigned_at = now() WHERE id = task_record.id; RETURN QUERY SELECT task_record.id, task_record.full_name, task_record.gmail_user, task_record.password, task_record.recovery_mail; END IF; END; $$;
CREATE OR REPLACE FUNCTION public.get_and_assign_visit_earn_task(user_id_input uuid) RETURNS TABLE(id bigint, title text, description text, redirect_url text, correct_code text) LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE task_record RECORD; BEGIN SELECT id, title, description, redirect_url, correct_code INTO task_record FROM public.visit_earn_tasks WHERE is_active = true AND id NOT IN (SELECT (submission_data->>'taskId')::bigint FROM public.usertasks WHERE user_id = user_id_input AND task_type = 'visit-earn' AND status = 'Approved') ORDER BY random() LIMIT 1; IF FOUND THEN RETURN QUERY SELECT task_record.id, task_record.title, task_record.description, task_record.redirect_url, task_record.correct_code; END IF; END; $$;
CREATE OR REPLACE FUNCTION public.get_and_assign_watch_earn_task(user_id_input uuid) RETURNS TABLE(id bigint, title text, description text, redirect_url text, correct_code text) LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE task_record RECORD; BEGIN SELECT id, title, description, redirect_url, correct_code INTO task_record FROM public.watch_earn_tasks WHERE is_active = true AND id NOT IN (SELECT (submission_data->>'taskId')::bigint FROM public.usertasks WHERE user_id = user_id_input AND task_type = 'watch-earn' AND status = 'Approved') ORDER BY random() LIMIT 1; IF FOUND THEN RETURN QUERY SELECT task_record.id, task_record.title, task_record.description, task_record.redirect_url, task_record.correct_code; END IF; END; $$;
CREATE OR REPLACE FUNCTION public.get_batch_stats(batch_id_param integer) RETURNS TABLE(total_approved bigint, total_pending bigint, total_rejected bigint) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT COUNT(*) FILTER (WHERE status = 'Approved'), COUNT(*) FILTER (WHERE status = 'Pending'), COUNT(*) FILTER (WHERE status = 'Rejected') FROM public.usertasks WHERE batch_id = batch_id_param::text; END; $$;
CREATE OR REPLACE FUNCTION public.get_tasks_by_batch_and_status(p_batch_id integer, p_status text) RETURNS TABLE(task_id text, gmail_user text, password text, recovery_mail text, user_email text, submission_time timestamp with time zone) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN IF p_status = 'todo' THEN RETURN QUERY SELECT gt.id::text, gt.gmail_user, gt.password, gt.recovery_mail, NULL, NULL FROM public.gmail_tasks gt WHERE gt.batch_id = p_batch_id AND gt.is_assigned = false; ELSE RETURN QUERY SELECT ut.task_id, ut.submission_data->>'gmail', ut.submission_data->>'originalPassword', ut.submission_data->>'recoveryMailSubmission', u.email, ut.submission_time FROM public.usertasks ut JOIN public.users u ON ut.user_id = u.id WHERE ut.batch_id = p_batch_id::text AND ut.status = p_status; END IF; END; $$;

-- Functions for destructive actions (DANGER ZONE)
CREATE OR REPLACE FUNCTION public.truncate_all_tables() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN TRUNCATE TABLE public.users, public.admins, public.payments, public.usertasks, public.notifications, public.wallet_history, public.coinsubmissions, public.gmail_tasks, public.gmail_task_batches RESTART IDENTITY; END; $$;
CREATE OR REPLACE FUNCTION public.truncate_history(table_name text, before_date date) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN IF before_date IS NULL THEN EXECUTE 'TRUNCATE TABLE public.' || table_name; ELSE EXECUTE 'DELETE FROM public.' || table_name || ' WHERE created_at < ''' || before_date || ''''; END IF; END; $$;
CREATE OR REPLACE FUNCTION public.update_referral_and_add_bonus(referee_id uuid, referrer_code text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE referrer_id uuid; bonus_amount numeric := 10.0; BEGIN SELECT id INTO referrer_id FROM public.users WHERE referral_code = referrer_code; IF NOT FOUND THEN RETURN json_build_object('status', 'error', 'message', 'Invalid referrer code'); END IF; UPDATE public.users SET referred_by = referrer_code WHERE id = referee_id; INSERT INTO public.wallet_history (user_id, amount, type, status, description) VALUES (referee_id, bonus_amount, 'referral_bonus', 'Completed', 'Sign-up bonus for using a referral code.'), (referrer_id, bonus_amount, 'referral_bonus', 'Completed', 'Bonus for referring a new user.'); RETURN json_build_object('status', 'success'); END; $$;

-- =================================================================
-- SECTION B: RLS POLICIES
-- =================================================================

-- Table: users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Table: admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admins to manage other admins" ON public.admins FOR ALL USING (
    (SELECT role FROM public.admins WHERE user_id = auth.uid()) = 'superadmin'
);
CREATE POLICY "Allow authenticated users to read admins list" ON public.admins FOR SELECT USING (auth.role() = 'authenticated');

-- Table: settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON public.settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage settings" ON public.settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);

-- Table: notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON public.notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage notifications" ON public.notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);

-- Table: usertasks
ALTER TABLE public.usertasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own tasks" ON public.usertasks FOR ALL USING (auth.uid() = user_id);

-- Table: payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own payments" ON public.payments FOR ALL USING (auth.uid() = user_id);

-- Table: wallet_history
ALTER TABLE public.wallet_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to read their own wallet history" ON public.wallet_history FOR SELECT USING (auth.uid() = user_id);

-- Tables with admin-only write access and public/user read access
ALTER TABLE public.featured_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users on offers" ON public.featured_offers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage offers" ON public.featured_offers FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

ALTER TABLE public.visit_earn_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users on visit_earn" ON public.visit_earn_tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage visit_earn" ON public.visit_earn_tasks FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

ALTER TABLE public.watch_earn_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users on watch_earn" ON public.watch_earn_tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admins to manage watch_earn" ON public.watch_earn_tasks FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

ALTER TABLE public.coinsubmissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own coin submissions" ON public.coinsubmissions FOR ALL USING (auth.uid() = user_id);

-- Policies for gmail_task_batches and gmail_tasks (if RLS is enabled)
ALTER TABLE public.gmail_task_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admins to manage gmail batches" ON public.gmail_task_batches FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

ALTER TABLE public.gmail_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admins to manage gmail tasks" ON public.gmail_tasks FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));
CREATE POLICY "Allow assigned user to read their task" ON public.gmail_tasks FOR SELECT USING (auth.uid() = assigned_to);

-- Policies for spin_rewards
ALTER TABLE public.spin_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user to manage their own spin data" ON public.spin_rewards FOR ALL USING (auth.uid() = user_id);

-- Policies for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow user to manage their own support tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id);
`;

    const dropAllPoliciesScript = `-- =================================================================
-- DANGER ZONE: DROP ALL RLS POLICIES & HELPER FUNCTIONS
-- =================================================================
-- Use this only if you want to remove every single RLS policy and all
-- helper functions from the public schema to start from scratch. 
-- This will make your data insecure until you apply new policies.
-- =================================================================

DO $$
DECLARE
    policy_record RECORD;
    table_record RECORD;
BEGIN
    -- Loop through all tables and drop policies
    FOR table_record IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        FOR policy_record IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = table_record.tablename LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public."' || table_record.tablename || '";';
        END LOOP;
    END LOOP;
    
    -- Drop all helper functions
    DROP FUNCTION IF EXISTS public.get_all_users();
    DROP FUNCTION IF EXISTS public.get_all_admins();
    DROP FUNCTION IF EXISTS public.get_all_payment_requests();
    DROP FUNCTION IF EXISTS public.get_user_financials(uuid);
    DROP FUNCTION IF EXISTS public.get_total_users_count();
    DROP FUNCTION IF EXISTS public.get_total_users_balance();
    DROP FUNCTION IF EXISTS public.get_top_referral_users(integer);
    DROP FUNCTION IF EXISTS public.truncate_all_tables();
    DROP FUNCTION IF EXISTS public.truncate_history(text,date);
    DROP FUNCTION IF EXISTS public.get_and_assign_gmail_task(uuid);
    DROP FUNCTION IF EXISTS public.get_and_assign_visit_earn_task(uuid);
    DROP FUNCTION IF EXISTS public.get_and_assign_watch_earn_task(uuid);
    DROP FUNCTION IF EXISTS public.get_batch_stats(integer);
    DROP FUNCTION IF EXISTS public.get_tasks_by_batch_and_status(integer, text);
    DROP FUNCTION IF EXISTS public.update_referral_and_add_bonus(uuid, text);

    RAISE NOTICE 'All RLS policies and helper functions in schema "public" have been dropped.';
END;
$$;`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SQL Editor Scripts</h1>
        <p className="text-muted-foreground">
          Central location for managing database policies and functions.
        </p>
      </div>

       <Card className="border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-green-500"/> Master RLS & Functions Script</CardTitle>
          <CardDescription>
            This is the primary script to fix data access issues. It resets all policies and creates the necessary functions for the admin panel to work correctly and securely. Run this in your Supabase SQL Editor.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-2">
            <Textarea className="font-mono bg-muted h-96" readOnly value={masterSqlScript} />
            <CopyButton value={masterSqlScript} className="w-full">
                Copy Master Script
            </CopyButton>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/> Danger Zone: Drop All Policies</CardTitle>
            <CardDescription>
             This script will remove ALL Row-Level Security policies and helper functions. Use this only if you want a completely clean slate. Your app data will be insecure until you run the Master Script above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea className="font-mono bg-destructive/10 text-destructive-foreground h-48" readOnly value={dropAllPoliciesScript} />
              <CopyButton value={dropAllPoliciesScript} variant="destructive" className="w-full">
                Copy "Drop All" Script
              </CopyButton>
            </div>
          </CardContent>
      </Card>

    </div>
  );
}

    