"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "./icons";

/**
 * Image upload for CMS content.
 *
 * Replaces the raw "paste a URL" input. The chosen file is posted to
 * /api/cms/uploads, which validates it, stores it, and returns a permanent
 * public URL. That URL is written into a hidden input under the field's
 * existing name — so the surrounding form, the server action and the database
 * column are all unchanged, and an image typed in before this existed still
 * loads and still saves.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";
const ACCEPT_LABEL = "JPG, PNG or WebP · up to 5 MB";

/** Browser-side pre-check. The server re-validates from the file's bytes. */
function localProblem(file: File): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "That file type isn't supported. Please choose a JPG, PNG or WebP image.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Please choose a file under 5 MB.`;
  }
  if (file.size === 0) return "That file appears to be empty.";
  return null;
}

/** Renders a stored value whether it is a full URL or a legacy relative path. */
export function toDisplaySrc(value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  return `/${value}`;
}

export function ImageUploadField({
  name,
  value,
  onChange,
  folder,
  label,
  hint,
  error,
  disabled = false,
}: {
  /** Form field name — unchanged, so the server action needs no edit. */
  name: string;
  value: string;
  onChange: (next: string) => void;
  folder: "alumni" | "faculty";
  label: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    const problem = localProblem(file);
    if (problem) {
      setUploadError(problem);
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);

      const res = await fetch("/api/cms/uploads", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!res.ok || !data.url) {
        setUploadError(data.error ?? "The upload didn't go through. Please try again.");
        return;
      }
      onChange(data.url);
    } catch {
      // Network-level failure: the request never completed.
      setUploadError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setUploading(false);
      // Allow re-selecting the same file after a removal.
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const shownError = uploadError ?? error;

  return (
    <div>
      <span className="block text-sm font-semibold text-ink">{label}</span>
      {hint && <p className="mt-0.5 text-xs leading-relaxed text-muted">{hint}</p>}

      {/* The value the form actually submits — unchanged field name. */}
      <input type="hidden" name={name} value={value} />

      <div className="mt-2">
        {value ? (
          <div className="flex items-start gap-4 rounded-msc-lg border border-brand-navy/12 bg-surface p-4">
            {/* Plain <img>: the source may be a legacy relative path or a
                storage URL, and a broken file should show as a blank frame
                rather than break the form. */}
            <img
              src={toDisplaySrc(value)}
              alt=""
              className="h-20 w-20 shrink-0 rounded-msc bg-brand-navy/8 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">Image attached</p>
              <p className="mt-0.5 break-all text-xs text-muted">{value}</p>
              {!disabled && (
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="rounded-pill border border-brand-navy/15 px-4 py-1.5 text-xs font-semibold text-brand-navy transition hover:bg-brand-navy/5 disabled:opacity-50"
                  >
                    {uploading ? "Uploading…" : "Replace"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setUploadError(null);
                    }}
                    disabled={uploading}
                    className="text-xs font-semibold text-danger transition hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              if (disabled) return;
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              if (disabled) return;
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void upload(file);
            }}
            className={`flex flex-col items-center rounded-msc-lg border-2 border-dashed px-6 py-8 text-center transition ${
              dragging
                ? "border-brand-blue bg-brand-pale/50"
                : "border-brand-navy/15 bg-surface"
            } ${disabled ? "opacity-60" : ""}`}
          >
            <Icon name="stories" className="h-6 w-6 text-muted" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled || uploading}
              className="mt-3 rounded-pill bg-brand-blue px-5 py-2 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload image"}
            </button>
            <p className="mt-2 text-xs text-muted">
              {uploading ? "Please wait…" : "or drag an image here"}
            </p>
            <p className="mt-1 text-[0.68rem] text-muted">{ACCEPT_LABEL}</p>
          </div>
        )}

        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>

      {shownError && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {shownError}
        </p>
      )}
    </div>
  );
}
