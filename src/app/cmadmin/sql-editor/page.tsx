'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/copy-button';
import { Copy } from 'lucide-react';

const userListSql = `
-- Step 1: Ensure RLS is enabled on the 'users' table.
-- This command will fail if it's already enabled, which is okay.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 2: Create a policy to allow admins to read all users.
-- This policy checks if the currently logged-in user's ID exists in the 'admins' table.
CREATE POLICY "Allow admins to read all users"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = auth.uid()
  )
);
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

       <Card>
        <CardHeader>
            <CardTitle>Show User List in Admin Panel</CardTitle>
            <CardDescription>
                This query enables Row-Level Security on the 'users' table and adds a policy that allows anyone in the 'admins' table to view all users. This will fix the issue where the user list is not showing on the 'Users' page.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="relative rounded-md bg-muted/50 p-4">
              <CopyButton 
                value={userListSql}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
              >
                  <Copy className="h-4 w-4" />
              </CopyButton>
              <pre className="text-sm whitespace-pre-wrap font-mono">
                <code>{userListSql.trim()}</code>
              </pre>
            </div>
        </CardContent>
       </Card>

    </div>
  );
}
