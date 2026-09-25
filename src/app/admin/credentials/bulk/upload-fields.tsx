"use client";

import { useState } from "react";

type P = { id: string; name: string; code: string | null; batches: { id: string; name: string }[] };

export function BulkUploadFields({ programs, inputCls }: { programs: P[]; inputCls: string }) {
  const [courseId, setCourseId] = useState(programs[0]?.id ?? "");
  const program = programs.find((p) => p.id === courseId);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1.5 text-sm font-semibold text-brand-navy">
        Program
        <select name="courseId" required value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
          ))}
        </select>
      </label>
      <label className="space-y-1.5 text-sm font-semibold text-brand-navy">
        Default cohort (used when a row has no cohort)
        <select name="batchId" className={inputCls}>
          <option value="">No cohort</option>
          {program?.batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
    </div>
  );
}
