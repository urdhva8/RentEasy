import type { Database } from '@/types/supabase'; // Adjust this path if your generated types are elsewhere
import { createClient } from '@supabase/supabase-js';

// IMPORTANT:
// 1. Create a .env.local file in the root of your project (next to package.json)
// 2. Add your Supabase URL and anon key to .env.local:
//    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
// 3. Ensure your .env.local file is in your .gitignore to keep keys private.
// 4. Generate TypeScript types from your Supabase schema (e.g., using supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts)
//    and update the import path for `Database` above if needed.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL not found. Did you forget to add NEXT_PUBLIC_SUPABASE_URL to your .env.local file?");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase anon key not found. Did you forget to add NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file?");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
