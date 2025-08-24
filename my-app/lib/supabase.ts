// File: lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings
const supabaseUrl = 'https://jwqqnxszqlhubaeshgtv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cXFueHN6cWxodWJhZXNoZ3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTgyMjksImV4cCI6MjA3MTUzNDIyOX0.kW7_mgXoQWhLOIXF8eTPNofLk9vnp_05bxg-STbscOA';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Please add them to lib/supabase.ts");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
