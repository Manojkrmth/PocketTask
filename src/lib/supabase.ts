import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/firebase';

const supabaseUrl = 'https://sfvtnxkbprzcpeocebck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdnRueGticHJ6Y3Blb2NlYmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTQ1ODksImV4cCI6MjA4MjA3MDU4OX0.wpiMQL4Mf31h9AB0mpJuzpABTEKy8mQPxi9MKQVwxNQ';

// Create a Supabase client with a custom accessToken provider
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (input, init) => {
      // We need to override the global fetch to ensure the accessToken is used.
      return fetch(input, init);
    },
    headers: {},
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Function to set the auth token for Supabase
export const setSupabaseAuthToken = async (idToken: string | null) => {
  if (idToken) {
    supabase.global.headers['Authorization'] = `Bearer ${idToken}`;
  } else {
    delete supabase.global.headers['Authorization'];
  }
};
