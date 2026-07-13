import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key.
 * NEVER import this into a client component — the service-role key
 * bypasses RLS. The registrations table has RLS on with no anon
 * policy, so the only legitimate write path is this server client
 * behind the /api/register route.
 */
export function getServiceClient() {
  // Match the /api/register pattern: prod sets SUPABASE_URL (server-only);
  // NEXT_PUBLIC_SUPABASE_URL is the local/.env.local fallback.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
