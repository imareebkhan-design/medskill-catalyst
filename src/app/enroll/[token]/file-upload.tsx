"use client";

import { useRef, useState } from "react";
import { UPLOAD_SPECS, type UploadedDoc, type UploadField } from "@/src/modules/enroll/schemas";
import {
  formatBytes,
  uploadEnrollmentFile,
  validateFile,
  type UploadScope,
} from "@/src/modules/enroll/upload-client";
import { cn } from "@/src/lib/cn";

type Props = {
  uploadScope: UploadScope;
  field: UploadField;
  label: string;
  required?: boolean;
  value?: UploadedDoc;
  onChange: (doc: UploadedDoc | undefined) => void;
  error?: string;
};

export function FileUpload({ uploadScope, field, label, required, value, onChange, error }: Props) {
  const spec = UPLOAD_SPECS[field];
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function accept(file: File | undefined) {
    if (!file) return;
    setLocalError(null);
    const invalid = validateFile(field, file);
    if (invalid) {
      setLocalError(invalid);
      return;
    }
    setBusy(true);
    try {
      const doc = await uploadEnrollmentFile(uploadScope, field, file);
      onChange(doc);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const shownError = localError ?? error;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-brand-navy">
          {label} {required && <span className="text-danger">*</span>}
        </span>
        <span className="text-[11px] text-muted">{spec.hint}</span>
      </div>

      {value ? (
        <div className="flex items-center gap-3 rounded-msc border border-success/30 bg-success/5 px-3.5 py-3">
          <span className="text-lg" aria-hidden>
            📄
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{value.name}</p>
            <p className="text-xs text-muted">{formatBytes(value.size)} · uploaded ✓</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-xs font-semibold text-danger hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void accept(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-1 rounded-msc border border-dashed px-4 py-5 text-center transition-colors",
            dragging
              ? "border-brand-blue bg-brand-blue/5"
              : "border-brand-navy/25 bg-surface hover:border-brand-blue hover:bg-brand-pale/40",
            shownError && "border-danger/50",
          )}
        >
          {busy ? (
            <span className="text-sm font-medium text-brand-blue">Uploading…</span>
          ) : (
            <>
              <span className="text-sm font-medium text-brand-navy">
                Click to upload <span className="text-muted">or drag &amp; drop</span>
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={spec.accept.join(",")}
        className="sr-only"
        onChange={(e) => void accept(e.target.files?.[0])}
      />

      {shownError && <p className="mt-1 text-xs text-danger">{shownError}</p>}
    </div>
  );
}
