// Supabase client configuration
// Note: These are PUBLIC keys safe to expose in client-side code
const SUPABASE_URL = 'https://ytnbuagqwssctjannvcw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0bmJ1YWdxd3NzY3RqYW5udmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzEzODcsImV4cCI6MjA3Mjc0NzM4N30.8YzKVXMJYMFhXmsV8ceUAyK8aGD2zqPGz8OmMFUsBCc'; // Replace with your actual anon key from Supabase Dashboard

// Import Supabase client from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Create and export Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
