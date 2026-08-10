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

// ─────────────────────────────────────────────────────────────
// Careers attachments (resumes, certificates, portfolios, etc.)
//
// These are private applicant documents. The bucket MUST be private:
// files are served to admins only, through short-lived signed URLs.
// ─────────────────────────────────────────────────────────────

export const CAREERS_BUCKET = "careers";

let careersBucketPrivate = false;

/**
 * Ensure the careers bucket exists AND is private. Idempotent, and cheap after
 * the first call per warm instance. If the bucket already exists as public
 * (older deployments created it that way), this flips it to private so the
 * previously world-readable resumes stop being downloadable without a signed URL.
 */
export async function ensureCareersBucketPrivate(
  supabase: ReturnType<typeof getServiceClient>,
): Promise<void> {
  if (careersBucketPrivate) return;
  const { data } = await supabase.storage.getBucket(CAREERS_BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(CAREERS_BUCKET, {
      public: false,
      fileSizeLimit: 6 * 1024 * 1024,
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  } else if (data.public) {
    // Bucket exists but is public — lock it down.
    await supabase.storage.updateBucket(CAREERS_BUCKET, { public: false });
  }
  careersBucketPrivate = true;
}

/**
 * Given a value stored in a career_applications *_url column, return the object
 * path inside the careers bucket. Handles both the new format (a bare path we
 * now store) and the legacy format (a full public URL stored before the bucket
 * was made private). Returns null for anything we can't map.
 */
export function careersObjectPath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const marker = "/object/public/careers/";
  const i = stored.indexOf(marker);
  if (i !== -1) return stored.slice(i + marker.length);
  const marker2 = "/object/sign/careers/";
  const j = stored.indexOf(marker2);
  if (j !== -1) return stored.slice(j + marker2.length).split("?")[0];
  if (/^https?:\/\//i.test(stored)) return null; // some other host — can't sign
  return stored; // already a bare path
}

/**
 * Turn a stored careers file reference into a short-lived signed URL an admin
 * can open. Returns null when there's nothing to sign or signing fails.
 */
export async function signCareersFile(
  supabase: ReturnType<typeof getServiceClient>,
  stored: string | null | undefined,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const path = careersObjectPath(stored);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(CAREERS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}
