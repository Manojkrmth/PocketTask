-- Drop existing policies if they exist, to prevent conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read" ON public.maintenance_mode;
DROP POLICY IF EXISTS "Allow admins to update" ON public.maintenance_mode;

-- Drop the table if it exists, for a clean setup
DROP TABLE IF EXISTS public.maintenance_mode;

-- 1. Create the new "maintenance_mode" table
CREATE TABLE public.maintenance_mode (
  id BIGINT PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;

-- 3. Insert a single, default row for the setting
INSERT INTO public.maintenance_mode (id, is_enabled) VALUES (1, false);

-- 4. Create security policies

-- Policy: Allow all authenticated users to read this setting
CREATE POLICY "Allow authenticated users to read"
ON public.maintenance_mode
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Allow only admins to update this setting
CREATE POLICY "Allow admins to update"
ON public.maintenance_mode
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
