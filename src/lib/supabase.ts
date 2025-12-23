import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/firebase';

const supabaseUrl = 'https://sfvtnxkbprzcpeocebck.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmdnRueGticHJ6Y3Blb2NlYmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTQ1ODksImV4cCI6MjA4MjA3MDU4OX0.wpiMQL4Mf31h9AB0mpJuzpABTEKy8mQPxi9MKQVwxNQ';

// Create a Supabase client with a custom accessToken provider
// This is the recommended approach for using external JWTs (like Firebase's)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (input, init) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        // If there's no user, make the request without the Authorization header.
        return fetch(input, init);
      }

      // Get the Firebase ID token.
      const token = await currentUser.getIdToken();

      // Ensure headers exist and are a Headers object.
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${token}`);

      // Make the request with the updated headers.
      return fetch(input, { ...init, headers });
    },
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
