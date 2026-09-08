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

/**
 * PUBLIC bucket for website imagery managed through the CMS — alumni photos,
 * faculty portraits.
 *
 * Public-read is deliberate and necessary: these files are rendered by the
 * marketing site to anonymous visitors, exactly as the existing `assets/*`
 * images are. It is kept separate from ENROLLMENT_BUCKET, which is private and
 * holds ID documents — mixing the two would be the mistake.
 *
 * Writes still require an authenticated CMS session; only reads are public.
 */
export const SITE_ASSETS_BUCKET = "site-assets";

let siteBucketReady = false;

/** Idempotently ensure the public bucket exists (created on first upload). */
export async function ensureSiteAssetsBucket(): Promise<void> {
  if (siteBucketReady) return;
  const admin = supabaseAdmin();
  const { data } = await admin.storage.getBucket(SITE_ASSETS_BUCKET);
  if (!data) {
    const { error } = await admin.storage.createBucket(SITE_ASSETS_BUCKET, {
      public: true,
      fileSizeLimit: "5MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  siteBucketReady = true;
}

/** The permanent, public URL for an object in the site-assets bucket. */
export function siteAssetPublicUrl(key: string): string {
  const { data } = supabaseAdmin().storage.from(SITE_ASSETS_BUCKET).getPublicUrl(key);
  return data.publicUrl;
}
