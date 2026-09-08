import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { CmsAuthError, requireCapability } from "@/src/lib/cms-auth";
import { extensionFor, sniffImageMime } from "@/src/lib/image-sniff";
import {
  ensureSiteAssetsBucket,
  siteAssetPublicUrl,
  SITE_ASSETS_BUCKET,
  supabaseAdmin,
} from "@/src/lib/supabase";

/**
 * Image uploads for CMS website content.
 *
 * Mirrors the validation shape of src/app/api/enroll/upload/route.ts, with two
 * differences that matter:
 *
 *   - it requires an authenticated CMS session (that route is gated by an
 *     enrolment token instead), and
 *   - it writes to the PUBLIC site-assets bucket, because these images are
 *     rendered to anonymous visitors on the marketing site.
 *
 * The service-role key never leaves the server: the browser posts a file here
 * and receives back only a URL.
 */

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Folders are fixed, so a caller cannot write anywhere it likes in the bucket. */
const FOLDERS = ["alumni", "faculty"] as const;
type Folder = (typeof FOLDERS)[number];

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  // 1. Authorization. Uploading is part of editing content, so it needs the
  //    same capability — never merely being signed in.
  try {
    await requireCapability("content:edit");
  } catch (err) {
    if (err instanceof CmsAuthError) {
      return bad(
        err.status === 401
          ? "Your session has ended. Please sign in again."
          : "You do not have permission to upload images.",
        err.status,
      );
    }
    throw err;
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("We could not read that upload. Please try again.");
  }

  const file = form.get("file");
  const folderRaw = String(form.get("folder") ?? "alumni");
  const folder = (FOLDERS as readonly string[]).includes(folderRaw)
    ? (folderRaw as Folder)
    : null;

  if (!folder) return bad("Unknown upload destination.");
  if (!(file instanceof File)) return bad("No file was received.");
  if (file.size === 0) return bad("That file is empty.");
  if (file.size > MAX_BYTES) {
    return bad(`That image is too large. Please choose a file under ${MAX_BYTES / 1024 / 1024} MB.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // 2. Server-side type validation from the bytes, not the declared type.
  const sniffed = sniffImageMime(bytes);
  const ext = extensionFor(sniffed);
  if (!sniffed || !ext) {
    return bad("That file type isn't supported. Please upload a JPG, PNG or WebP image.");
  }

  // 3. Safe, unique, non-guessable name. The original filename is discarded
  //    entirely, so it cannot carry a path, an extension mismatch, or unicode
  //    tricks into the bucket.
  const key = `${folder}/${randomUUID()}.${ext}`;

  try {
    await ensureSiteAssetsBucket();
    const { error } = await supabaseAdmin()
      .storage.from(SITE_ASSETS_BUCKET)
      .upload(key, bytes, { contentType: sniffed, upsert: false });
    if (error) throw error;
  } catch (err) {
    // The underlying error can name the storage host; only a generic message
    // crosses to the browser.
    console.error("[cms/uploads] storage error:", err);
    return bad("The upload didn't go through. Please try again in a moment.", 500);
  }

  return NextResponse.json({
    url: siteAssetPublicUrl(key),
    key,
    size: file.size,
    mime: sniffed,
  });
}
