"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { processChunkAction } from "../actions";

/**
 * Drives a confirmed bulk job in small server-side chunks so no single request
 * runs long. Safe to interrupt: closing the tab just pauses; re-opening (or a
 * colleague opening) the job resumes, and row idempotency keys prevent any
 * duplicate issuance.
 */
export function BulkRunner({ jobId, autoStart, pending }: { jobId: string; autoStart: boolean; pending: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(pending);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      for (let i = 0; i < 500; i++) {
        const r = await processChunkAction(jobId);
        if (!r.ok) {
          setError(r.error);
          break;
        }
        setLeft(r.remaining);
        router.refresh();
        if (r.remaining === 0 || r.processed === 0) break;
      }
    } finally {
      setRunning(false);
      router.refresh();
    }
  }

  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const done = pending - left;
  return (
    <div className="mt-4 space-y-2" aria-live="polite">
      <div className="h-2 w-full overflow-hidden rounded-pill bg-brand-pale">
        <div className="h-full bg-brand-blue transition-all" style={{ width: `${pending ? Math.round((done / pending) * 100) : 100}%` }} />
      </div>
      <p className="text-sm text-muted">{running ? `Issuing… ${left} remaining. Keep this page open.` : `${left} row(s) waiting to be issued.`}</p>
      {error && <p className="text-sm text-danger">{error}</p>}
      {!running && left > 0 && (
        <button onClick={() => void run()} className="inline-flex h-10 items-center rounded-pill bg-brand-blue px-5 text-sm font-semibold text-white hover:bg-brand-navy">
          {done > 0 ? "Resume" : "Start issuing"}
        </button>
      )}
    </div>
  );
}
