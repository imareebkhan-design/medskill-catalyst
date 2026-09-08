"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ADMISSIONS_STATUS_OPTIONS,
  cohortSettingsSchema,
} from "@/src/modules/cms/cohort-schema";
import { saveCohortAction, type CohortFormState } from "./actions";

/**
 * The cohort editing form.
 *
 * Uses native <input type="date"> and <input type="time"> deliberately: they
 * give a real calendar and clock picker on every platform, require no manual
 * formatting from the user, produce exactly the canonical "YYYY-MM-DD" and
 * "HH:mm" values the database stores, and add no dependency.
 */

export type CohortFormValues = {
  cohort_name: string;
  start_date: string;
  start_time: string;
  admissions_status: string;
  duration: string;
  registration_url: string;
};

const FIELD =
  "flex h-11 w-full rounded-msc border border-brand-navy/15 bg-surface px-3.5 text-sm text-ink transition focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted";

const FIELD_ERROR = "border-danger/60 focus-visible:ring-danger/20";

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs leading-relaxed text-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-pill bg-brand-blue px-7 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function CohortForm({
  initial,
  isNew,
  canPublish,
}: {
  initial: CohortFormValues;
  isNew: boolean;
  canPublish: boolean;
}) {
  const [state, formAction] = useActionState<CohortFormState, FormData>(saveCohortAction, {
    status: "idle",
  });

  const [values, setValues] = useState<CohortFormValues>(initial);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const dirty = (Object.keys(initial) as (keyof CohortFormValues)[]).some(
    (k) => values[k] !== initial[k],
  );

  // Warn before leaving with unsaved edits. Removed as soon as the form is
  // clean again, so a saved form never nags.
  useEffect(() => {
    if (!dirty || state.status === "success") return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, state.status]);

  // A successful save makes the submitted values the new baseline.
  useEffect(() => {
    if (state.status === "success") {
      setConfirming(false);
      setClientErrors({});
    }
  }, [state.status]);

  const errors = { ...state.fieldErrors, ...clientErrors };

  function set<K extends keyof CohortFormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (clientErrors[key]) {
      setClientErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  }

  /** Validate in the browser first, then open the confirmation step. */
  function handleReview() {
    const parsed = cohortSettingsSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !next[key]) next[key] = issue.message;
      }
      setClientErrors(next);
      // Move focus to the first problem so keyboard users are not stranded.
      const first = Object.keys(next)[0];
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setClientErrors({});
    setConfirming(true);
  }

  return (
    <>
      {state.status === "success" && state.message && (
        <div
          role="status"
          className="mb-6 rounded-msc-lg border border-success/25 bg-emerald-50 px-5 py-4 text-sm font-medium text-success"
        >
          {state.message}
        </div>
      )}

      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="mb-6 rounded-msc-lg border border-danger/25 bg-red-50 px-5 py-4 text-sm font-medium text-danger"
        >
          {state.message}
        </div>
      )}

      {!canPublish && (
        <div className="mb-6 rounded-msc-lg border border-brand-navy/10 bg-brand-pale/60 px-5 py-4 text-sm text-ink/80">
          You can see the cohort details here, but only a Content Admin can
          change them. Ask one of them if something needs updating.
        </div>
      )}

      <form ref={formRef} action={formAction} className="space-y-8">
        <fieldset disabled={!canPublish} className="space-y-6">
          <legend className="sr-only">Cohort details</legend>

          <Field
            id="cohort_name"
            label="Cohort name"
            hint="Shown on the website wherever the current cohort is mentioned."
            error={errors.cohort_name}
          >
            <input
              id="cohort_name"
              name="cohort_name"
              type="text"
              value={values.cohort_name}
              onChange={(e) => set("cohort_name", e.target.value)}
              placeholder="MedSkills Catalyst Cohort 5"
              aria-invalid={!!errors.cohort_name}
              aria-describedby={errors.cohort_name ? "cohort_name-error" : undefined}
              className={`${FIELD} ${errors.cohort_name ? FIELD_ERROR : ""}`}
            />
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              id="start_date"
              label="Start date"
              hint="Click to pick a date from the calendar."
              error={errors.start_date}
            >
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={values.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                aria-invalid={!!errors.start_date}
                aria-describedby={errors.start_date ? "start_date-error" : undefined}
                className={`${FIELD} ${errors.start_date ? FIELD_ERROR : ""}`}
              />
            </Field>

            <Field
              id="start_time"
              label="Start time (optional)"
              hint="The time the first session begins."
              error={errors.start_time}
            >
              <input
                id="start_time"
                name="start_time"
                type="time"
                value={values.start_time}
                onChange={(e) => set("start_time", e.target.value)}
                aria-invalid={!!errors.start_time}
                aria-describedby={errors.start_time ? "start_time-error" : undefined}
                className={`${FIELD} ${errors.start_time ? FIELD_ERROR : ""}`}
              />
            </Field>
          </div>

          <Field
            id="admissions_status"
            label="Admissions status"
            hint="Controls the badge shown on the website."
            error={errors.admissions_status}
          >
            <select
              id="admissions_status"
              name="admissions_status"
              value={values.admissions_status}
              onChange={(e) => set("admissions_status", e.target.value)}
              aria-invalid={!!errors.admissions_status}
              className={`${FIELD} ${errors.admissions_status ? FIELD_ERROR : ""}`}
            >
              {ADMISSIONS_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted">
              {
                ADMISSIONS_STATUS_OPTIONS.find((o) => o.value === values.admissions_status)
                  ?.help
              }
            </p>
          </Field>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              id="duration"
              label="Duration (optional)"
              hint="How long the programme runs."
              error={errors.duration}
            >
              <input
                id="duration"
                name="duration"
                type="text"
                value={values.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="6 Weeks"
                className={`${FIELD} ${errors.duration ? FIELD_ERROR : ""}`}
              />
            </Field>

            <Field
              id="registration_url"
              label="Registration link (optional)"
              hint="Where the Apply button sends people."
              error={errors.registration_url}
            >
              <input
                id="registration_url"
                name="registration_url"
                type="url"
                inputMode="url"
                value={values.registration_url}
                onChange={(e) => set("registration_url", e.target.value)}
                placeholder="https://medskillscatalyst.com/enrol"
                aria-invalid={!!errors.registration_url}
                aria-describedby={
                  errors.registration_url ? "registration_url-error" : undefined
                }
                className={`${FIELD} ${errors.registration_url ? FIELD_ERROR : ""}`}
              />
            </Field>
          </div>
        </fieldset>

        {canPublish && (
          <div className="flex flex-wrap items-center gap-4 border-t border-brand-navy/10 pt-6">
            {confirming ? (
              <div className="w-full rounded-msc-lg border border-brand-blue/25 bg-brand-pale/50 px-5 py-4">
                <p className="font-display text-base font-bold text-brand-navy">
                  Ready to publish?
                </p>
                <p className="mt-1 text-sm text-ink/75">
                  These changes will become visible on the MedSkills Catalyst
                  website.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <SubmitButton label={isNew ? "Publish cohort" : "Publish changes"} />
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="h-11 rounded-pill border border-brand-navy/15 px-6 text-sm font-semibold text-brand-navy transition hover:bg-brand-navy/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleReview}
                  disabled={!dirty && !isNew}
                  className="h-11 rounded-pill bg-brand-blue px-7 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isNew ? "Set up cohort" : "Review and publish"}
                </button>
                {dirty && (
                  <span className="text-xs font-medium text-warning">
                    You have unsaved changes.
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </form>
    </>
  );
}
