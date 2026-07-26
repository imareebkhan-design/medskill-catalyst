import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service-role key.
 *
 * NEVER import this into a Client Component — the service-role key bypasses RLS.
 * It is only used from route handlers / server actions (e.g. document uploads).
 */
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase admin client missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Private bucket that holds enrollment documents (photo, ID, certificates, résumé, signature). */
export const ENROLLMENT_BUCKET = "enrollment-docs";

let bucketReady = false;

/** Idempotently ensure the private bucket exists (created on first upload). */
export async function ensureEnrollmentBucket(): Promise<void> {
  if (bucketReady) return;
  const admin = supabaseAdmin();
  const { data } = await admin.storage.getBucket(ENROLLMENT_BUCKET);
  if (!data) {
    const { error } = await admin.storage.createBucket(ENROLLMENT_BUCKET, {
      public: false,
      fileSizeLimit: "15MB",
    });
    // Ignore "already exists" races between concurrent uploads.
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  bucketReady = true;
}
