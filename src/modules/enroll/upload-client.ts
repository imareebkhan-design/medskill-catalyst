import { UPLOAD_SPECS, type UploadedDoc, type UploadField } from "./schemas";

/** Human-readable file size, e.g. "2.4 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Client-side pre-check so obvious rejects never hit the network. */
export function validateFile(field: UploadField, file: File): string | null {
  const spec = UPLOAD_SPECS[field];
  if (file.size === 0) return "That file looks empty.";
  if (file.size > spec.maxBytes) {
    return `Too large — keep it under ${Math.round(spec.maxBytes / 1024 / 1024)} MB.`;
  }
  if (!(spec.accept as readonly string[]).includes(file.type)) {
    return "That file type isn't accepted here.";
  }
  return null;
}

/**
 * Upload one file to the enrollment bucket via the API route and return its
 * stored metadata. Throws with a user-facing message on failure.
 */
export async function uploadEnrollmentFile(
  token: string,
  field: UploadField,
  file: File,
): Promise<UploadedDoc> {
  const body = new FormData();
  body.set("token", token);
  body.set("field", field);
  body.set("file", file);

  const res = await fetch("/api/enroll/upload", { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as Partial<UploadedDoc> & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "Upload failed. Please try again.");
  return json as UploadedDoc;
}
