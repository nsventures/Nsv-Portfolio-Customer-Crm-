import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

// A single shared instance (not one per call site) is required so that a
// single auth-refresh loop owns the realtime socket's auth too — with
// multiple instances, a token refresh in one doesn't reach the realtime
// channel held open by another, and after ~1hr (default JWT expiry) that
// channel silently stops receiving postgres_changes events until reloaded.
export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return client
}
