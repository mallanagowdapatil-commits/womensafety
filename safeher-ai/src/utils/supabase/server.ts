import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for Route Handlers and backend APIs.
 * Uses standard @supabase/supabase-js without top-level 'next/headers'
 * to avoid build errors and router bundling conflicts.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mialdgctqwtntppshqxs.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
