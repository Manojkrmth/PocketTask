-- 1. "maintenance_mode" नाम की नई टेबल बनाएं, अगर यह मौजूद नहीं है
CREATE TABLE IF NOT EXISTS public.maintenance_mode (
  id BIGINT PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS (Row Level Security) को सक्षम करें
ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;

-- 3. इस टेबल में केवल एक पंक्ति डालें, जो हमारी मुख्य सेटिंग होगी
-- 'ON CONFLICT (id) DO NOTHING' यह सुनिश्चित करेगा कि अगर पंक्ति पहले से मौजूद है तो कोई त्रुटि न हो
INSERT INTO public.maintenance_mode (id, is_enabled) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

-- 4. पुरानी नीतियों को हटाएं ताकि कोई टकराव न हो
DROP POLICY IF EXISTS "Allow authenticated users to read" ON public.maintenance_mode;
DROP POLICY IF EXISTS "Allow admins to update" ON public.maintenance_mode;

-- 5. नई सुरक्षा नीतियां (Policies) बनाएं
-- नीति: सभी लॉग-इन किए हुए उपयोगकर्ता इस सेटिंग को पढ़ सकते हैं
CREATE POLICY "Allow authenticated users to read"
ON public.maintenance_mode
FOR SELECT
USING (auth.role() = 'authenticated');

-- नीति: केवल एडमिन ही इस सेटिंग को बदल (UPDATE) सकते हैं
CREATE POLICY "Allow admins to update"
ON public.maintenance_mode
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);
