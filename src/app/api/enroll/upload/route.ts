import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/src/lib/db";
import { LinkStatus } from "@/src/generated/prisma/enums";
import {
  ENROLLMENT_BUCKET,
  ensureEnrollmentBucket,
  supabaseAdmin,
} from "@/src/lib/supabase";
import { UPLOAD_SPECS, type UploadField } from "@/src/modules/enroll/schemas";

export const runtime = "nodejs";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Expected a multipart upload.");
  }

  const token = form.get("token") ? String(form.get("token")) : null;
  const courseSlug = form.get("courseSlug") ? String(form.get("courseSlug")) : null;
  const field = String(form.get("field") ?? "") as UploadField;
  const file = form.get("file");

  const spec = UPLOAD_SPECS[field];
  if (!spec) return bad("Unknown document field.");
  if (!(file instanceof File)) return bad("No file received.");

  let bucketFolder: string;

  if (token) {
    if (!/^[a-zA-Z0-9_-]{20,}$/.test(token)) return bad("Invalid enrollment token.");
    // Gate uploads to a live enrollment link so the bucket can't be used as open storage.
    const link = await db.enrollmentLink.findUnique({
      where: { token },
      select: { status: true, expires_at: true },
    });
    if (!link) return bad("Enrollment link not found.", 404);
    if (link.status === LinkStatus.REVOKED) return bad("This enrollment link was withdrawn.", 410);
    if (link.expires_at < new Date()) return bad("This enrollment link has expired.", 410);
    bucketFolder = token;
  } else if (courseSlug) {
    // Gate uploads to a valid active course so the bucket can't be used as open storage.
    const course = await db.course.findUnique({
      where: { slug: courseSlug, is_active: true },
    });
    if (!course) return bad("Course not found or inactive.", 404);
    bucketFolder = courseSlug;
  } else {
    return bad("Either a valid token or course slug is required for authorization.");
  }

  // Validate the file itself.
  if (file.size === 0) return bad("The selected file is empty.");
  if (file.size > spec.maxBytes) {
    return bad(`File is too large. ${spec.label} must be under ${Math.round(spec.maxBytes / 1024 / 1024)} MB.`);
  }
  const mime = file.type || "application/octet-stream";
  if (!(spec.accept as readonly string[]).includes(mime)) {
    return bad(`Unsupported file type for ${spec.label}.`);
  }

  const ext = EXT_BY_MIME[mime] ?? "bin";
  const key = `${bucketFolder}/${field}/${randomUUID()}.${ext}`;

  try {
    await ensureEnrollmentBucket();
    const admin = supabaseAdmin();
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await admin.storage
      .from(ENROLLMENT_BUCKET)
      .upload(key, bytes, { contentType: mime, upsert: false });
    if (error) throw error;
  } catch (err) {
    console.error("[enroll/upload] storage error", err);
    return bad("Upload failed. Please try again.", 500);
  }

  // Client stores this metadata and submits it with the form (validated again server-side).
  return NextResponse.json({
    key,
    name: file.name.slice(0, 260),
    size: file.size,
    mime,
  });
}
