"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CATEGORY_OPTIONS,
  SHORT_DESCRIPTION_MAX,
  successStorySchema,
} from "@/src/modules/cms/success-story-schema";
import { ImageUploadField } from "@/src/components/cms/image-upload";
import { saveStoryAction, type StoryFormState } from "./actions";

export type StoryFormValues = {
  category: string;
  full_name: string;
  profile_image_url: string;
  linkedin_url: string;
  previous_designation: string;
  previous_company: string;
  current_designation: string;
  current_company: string;
  growth_headline: string;
  growth_description: string;
  short_description: string;
  full_story: string;
  testimonial: string;
};

export const BLANK_STORY: StoryFormValues = {
  category: "COHORT_ALUMNI",
  full_name: "",
  profile_image_url: "",
  linkedin_url: "",
  previous_designation: "",
  previous_company: "",
  current_designation: "",
  current_company: "",
  growth_headline: "",
  growth_description: "",
  short_description: "",
  full_story: "",
  testimonial: "",
};

const FIELD =
  "flex h-11 w-full rounded-msc border border-brand-navy/15 bg-surface px-3.5 text-sm text-ink transition focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted";
const AREA =
  "block w-full rounded-msc border border-brand-navy/15 bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink transition focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted";
const ERR = "border-danger/60 focus-visible:ring-danger/20";

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

function SaveButton({ label }: { label: string }) {
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

export function StoryForm({
  storyId,
  initial,
  canEdit,
}: {
  storyId?: string;
  initial: StoryFormValues;
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState<StoryFormState, FormData>(saveStoryAction, {
    status: "idle",
  });
  const [values, setValues] = useState<StoryFormValues>(initial);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const dirty = (Object.keys(initial) as (keyof StoryFormValues)[]).some(
    (k) => values[k] !== initial[k],
  );

  useEffect(() => {
    if (!dirty || state.status === "success") return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, state.status]);

  useEffect(() => {
    if (state.status === "success") setClientErrors({});
  }, [state.status]);

  const errors = { ...state.fieldErrors, ...clientErrors };

  function set<K extends keyof StoryFormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (clientErrors[key]) {
      setClientErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  }

  /** Browser-side pass for fast feedback; the server re-validates regardless. */
  function validateBeforeSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = successStorySchema.safeParse(values);
    if (parsed.success) return;
    e.preventDefault();
    const next: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !next[key]) next[key] = issue.message;
    }
    setClientErrors(next);
    const first = Object.keys(next)[0];
    if (first) document.getElementById(first)?.focus();
  }

  const shortLeft = SHORT_DESCRIPTION_MAX - values.short_description.length;

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

      {!canEdit && (
        <div className="mb-6 rounded-msc-lg border border-brand-navy/10 bg-brand-pale/60 px-5 py-4 text-sm text-ink/80">
          You can view this alumnus, but not change it.
        </div>
      )}

      <form action={formAction} onSubmit={validateBeforeSubmit} className="space-y-8">
        {storyId && <input type="hidden" name="id" value={storyId} />}

        <fieldset disabled={!canEdit} className="space-y-8">
          <legend className="sr-only">Alumnus details</legend>

          {/* ── Who ─────────────────────────────────────────── */}
          <div className="space-y-6 rounded-msc-lg border border-brand-navy/8 bg-surface p-6 shadow-msc-sm">
            <h2 className="font-display text-base font-bold text-brand-navy">
              Who they are
            </h2>

            <Field
              id="category"
              label="Group"
              hint="Which programme they graduated from. This decides where they appear on the website."
              error={errors.category}
            >
              <select
                id="category"
                name="category"
                value={values.category}
                onChange={(e) => set("category", e.target.value)}
                className={`${FIELD} ${errors.category ? ERR : ""}`}
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-muted">
                {CATEGORY_OPTIONS.find((o) => o.value === values.category)?.help}
              </p>
            </Field>

            <Field id="full_name" label="Full name" error={errors.full_name}>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={values.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="Anand Gupta"
                aria-invalid={!!errors.full_name}
                className={`${FIELD} ${errors.full_name ? ERR : ""}`}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <ImageUploadField
                name="profile_image_url"
                value={values.profile_image_url}
                onChange={(next) => set("profile_image_url", next)}
                folder="alumni"
                label="Photo (optional)"
                hint="Shown on their card. Uploads are stored securely and get a permanent link."
                error={errors.profile_image_url}
                disabled={!canEdit}
              />

              <Field
                id="linkedin_url"
                label="LinkedIn (optional)"
                hint="Shown as a small icon on their card."
                error={errors.linkedin_url}
              >
                <input
                  id="linkedin_url"
                  name="linkedin_url"
                  type="url"
                  inputMode="url"
                  value={values.linkedin_url}
                  onChange={(e) => set("linkedin_url", e.target.value)}
                  placeholder="https://www.linkedin.com/in/…"
                  aria-invalid={!!errors.linkedin_url}
                  className={`${FIELD} ${errors.linkedin_url ? ERR : ""}`}
                />
              </Field>
            </div>
          </div>

          {/* ── The move ────────────────────────────────────── */}
          <div className="space-y-6 rounded-msc-lg border border-brand-navy/8 bg-surface p-6 shadow-msc-sm">
            <div>
              <h2 className="font-display text-base font-bold text-brand-navy">
                Their career move
              </h2>
              <p className="mt-1 text-xs text-muted">
                Shown on the card as a before-and-after.
              </p>
            </div>

            <Field
              id="growth_headline"
              label="Headline"
              hint="The move in a few words, for example “Sales → Product Management”."
              error={errors.growth_headline}
            >
              <input
                id="growth_headline"
                name="growth_headline"
                type="text"
                value={values.growth_headline}
                onChange={(e) => set("growth_headline", e.target.value)}
                placeholder="Sales → Product Management"
                className={`${FIELD} ${errors.growth_headline ? ERR : ""}`}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field id="previous_designation" label="Previous role" error={errors.previous_designation}>
                <input
                  id="previous_designation"
                  name="previous_designation"
                  type="text"
                  value={values.previous_designation}
                  onChange={(e) => set("previous_designation", e.target.value)}
                  placeholder="Marketing Manager"
                  className={`${FIELD} ${errors.previous_designation ? ERR : ""}`}
                />
              </Field>
              <Field id="previous_company" label="Previous company (optional)" error={errors.previous_company}>
                <input
                  id="previous_company"
                  name="previous_company"
                  type="text"
                  value={values.previous_company}
                  onChange={(e) => set("previous_company", e.target.value)}
                  placeholder="Medtronic India"
                  className={`${FIELD} ${errors.previous_company ? ERR : ""}`}
                />
              </Field>
              <Field id="current_designation" label="Current role" error={errors.current_designation}>
                <input
                  id="current_designation"
                  name="current_designation"
                  type="text"
                  value={values.current_designation}
                  onChange={(e) => set("current_designation", e.target.value)}
                  placeholder="Founder"
                  className={`${FIELD} ${errors.current_designation ? ERR : ""}`}
                />
              </Field>
              <Field id="current_company" label="Current company (optional)" error={errors.current_company}>
                <input
                  id="current_company"
                  name="current_company"
                  type="text"
                  value={values.current_company}
                  onChange={(e) => set("current_company", e.target.value)}
                  placeholder="Sarathi Consulting Solutions"
                  className={`${FIELD} ${errors.current_company ? ERR : ""}`}
                />
              </Field>
            </div>
          </div>

          {/* ── Their words ─────────────────────────────────── */}
          <div className="space-y-6 rounded-msc-lg border border-brand-navy/8 bg-surface p-6 shadow-msc-sm">
            <h2 className="font-display text-base font-bold text-brand-navy">
              Their words
            </h2>

            <Field
              id="testimonial"
              label="Testimonial"
              hint="Quoted on their card. Use their own words."
              error={errors.testimonial}
            >
              <textarea
                id="testimonial"
                name="testimonial"
                rows={6}
                value={values.testimonial}
                onChange={(e) => set("testimonial", e.target.value)}
                className={`${AREA} ${errors.testimonial ? ERR : ""}`}
              />
            </Field>

            <Field
              id="short_description"
              label="Card summary (optional)"
              hint="A one-line summary for compact layouts."
              error={errors.short_description}
            >
              <textarea
                id="short_description"
                name="short_description"
                rows={2}
                maxLength={SHORT_DESCRIPTION_MAX}
                value={values.short_description}
                onChange={(e) => set("short_description", e.target.value)}
                className={`${AREA} ${errors.short_description ? ERR : ""}`}
              />
              <p
                className={`mt-1.5 text-xs ${shortLeft < 0 ? "text-danger" : "text-muted"}`}
              >
                {shortLeft} characters remaining
              </p>
            </Field>

            <Field
              id="growth_description"
              label="More about the move (optional)"
              error={errors.growth_description}
            >
              <textarea
                id="growth_description"
                name="growth_description"
                rows={4}
                value={values.growth_description}
                onChange={(e) => set("growth_description", e.target.value)}
                className={`${AREA} ${errors.growth_description ? ERR : ""}`}
              />
            </Field>

            <Field
              id="full_story"
              label="Full story (optional)"
              hint="The longer version, for a dedicated page."
              error={errors.full_story}
            >
              <textarea
                id="full_story"
                name="full_story"
                rows={8}
                value={values.full_story}
                onChange={(e) => set("full_story", e.target.value)}
                className={`${AREA} ${errors.full_story ? ERR : ""}`}
              />
            </Field>
          </div>
        </fieldset>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-4 border-t border-brand-navy/10 pt-6">
            <SaveButton label={storyId ? "Save changes" : "Create alumnus"} />
            <Link
              href="/cms/success-stories"
              className="h-11 rounded-pill border border-brand-navy/15 px-6 text-sm font-semibold leading-[2.6rem] text-brand-navy transition hover:bg-brand-navy/5"
            >
              Cancel
            </Link>
            {dirty && (
              <span className="text-xs font-medium text-warning">
                You have unsaved changes.
              </span>
            )}
            {!storyId && (
              <span className="text-xs text-muted">
                Saved as a draft — nothing appears on the website until it is published.
              </span>
            )}
          </div>
        )}
      </form>
    </>
  );
}
