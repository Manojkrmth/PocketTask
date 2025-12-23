import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace with your Supabase project URL and anon key
const supabaseUrl = 'https://sfvtnxkbprzcpeocebck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdnRueGticHJ6Y3Blb2NlYmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTQ1ODksImV4cCI6MjA4MjA3MDU4OX0.wpiMQL4Mf31h9AB0mpJuzpABTEKy8mQPxi9MKQVwxNQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
