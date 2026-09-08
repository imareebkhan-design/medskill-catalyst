"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  facultySchema,
  MAX_EXPERTISE,
  EXPERTISE_NAME_MAX,
  SHORT_BIO_MAX,
} from "@/src/modules/cms/faculty-schema";
import { Icon } from "@/src/components/cms/icons";
import { saveFacultyAction, type FacultyFormState } from "./actions";

export type FacultyFormValues = {
  full_name: string;
  designation: string;
  organization: string;
  profile_image_url: string;
  years_experience: string;
  experience_display: string;
  short_bio: string;
  full_bio: string;
};

export const BLANK_FACULTY: FacultyFormValues = {
  full_name: "",
  designation: "",
  organization: "",
  profile_image_url: "",
  years_experience: "",
  experience_display: "",
  short_bio: "",
  full_bio: "",
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

/**
 * Expertise capsules.
 *
 * Each tag is a hidden input named "expertise", so the server receives them via
 * formData.getAll() in the order shown — no JSON encoding, and the list still
 * submits correctly if JavaScript fails after hydration.
 */
function ExpertiseEditor({
  tags,
  onChange,
  disabled,
  error,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
  error?: string;
}) {
  const [draft, setDraft] = useState("");
  const full = tags.length >= MAX_EXPERTISE;

  function add() {
    const value = draft.trim();
    if (!value || full) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, value.slice(0, EXPERTISE_NAME_MAX)]);
    setDraft("");
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= tags.length) return;
    const next = [...tags];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <span className="block text-sm font-semibold text-ink">Expertise tags</span>
      <p className="mt-0.5 text-xs leading-relaxed text-muted">
        Short capsules shown under their name, for example “Ex-Boston Scientific”.
        Up to {MAX_EXPERTISE}.
      </p>

      {tags.map((tag) => (
        <input key={`hidden-${tag}`} type="hidden" name="expertise" value={tag} />
      ))}

      {tags.length > 0 && (
        <ul className="mt-3 space-y-2">
          {tags.map((tag, i) => (
            <li
              key={`${tag}-${i}`}
              className="flex items-center gap-2 rounded-msc border border-brand-navy/12 bg-canvas px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{tag}</span>
              {!disabled && (
                <>
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${tag} up`}
                    className="rounded p-1 text-muted transition hover:text-brand-navy disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === tags.length - 1}
                    aria-label={`Move ${tag} down`}
                    className="rounded p-1 text-muted transition hover:text-brand-navy disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(tags.filter((_, j) => j !== i))}
                    aria-label={`Remove ${tag}`}
                    className="rounded p-1 text-muted transition hover:text-danger"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!disabled && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={draft}
            maxLength={EXPERTISE_NAME_MAX}
            disabled={full}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter adds a tag; it must not submit the whole form.
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={full ? `Maximum ${MAX_EXPERTISE} tags` : "Add a tag and press Enter"}
            className={FIELD}
          />
          <button
            type="button"
            onClick={add}
            disabled={full || draft.trim() === ""}
            className="h-11 shrink-0 rounded-pill border border-brand-navy/15 px-5 text-sm font-semibold text-brand-navy transition hover:bg-brand-navy/5 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function FacultyForm({
  facultyId,
  initial,
  initialExpertise,
  canEdit,
}: {
  facultyId?: string;
  initial: FacultyFormValues;
  initialExpertise: string[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState<FacultyFormState, FormData>(
    saveFacultyAction,
    { status: "idle" },
  );
  const [values, setValues] = useState<FacultyFormValues>(initial);
  const [tags, setTags] = useState<string[]>(initialExpertise);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const dirty =
    (Object.keys(initial) as (keyof FacultyFormValues)[]).some(
      (k) => values[k] !== initial[k],
    ) || tags.join("|") !== initialExpertise.join("|");

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

  function set<K extends keyof FacultyFormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (clientErrors[key]) {
      setClientErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  }

  function validateBeforeSubmit(e: React.FormEvent<HTMLFormElement>) {
    const parsed = facultySchema.safeParse({ ...values, expertise: tags });
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

  const bioLeft = SHORT_BIO_MAX - values.short_bio.length;

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
          You can view this mentor, but not change them.
        </div>
      )}

      <form action={formAction} onSubmit={validateBeforeSubmit} className="space-y-8">
        {facultyId && <input type="hidden" name="id" value={facultyId} />}

        <fieldset disabled={!canEdit} className="space-y-8">
          <legend className="sr-only">Mentor details</legend>

          {/* ── Identity ────────────────────────────────────── */}
          <div className="space-y-6 rounded-msc-lg border border-brand-navy/8 bg-surface p-6 shadow-msc-sm">
            <h2 className="font-display text-base font-bold text-brand-navy">
              Who they are
            </h2>

            <Field id="full_name" label="Full name" error={errors.full_name}>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={values.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                placeholder="Gagan Victor"
                aria-invalid={!!errors.full_name}
                className={`${FIELD} ${errors.full_name ? ERR : ""}`}
              />
            </Field>

            <Field
              id="designation"
              label="Role"
              hint="Shown directly under their name."
              error={errors.designation}
            >
              <input
                id="designation"
                name="designation"
                type="text"
                value={values.designation}
                onChange={(e) => set("designation", e.target.value)}
                placeholder="Co-Founder and Program Director"
                aria-invalid={!!errors.designation}
                className={`${FIELD} ${errors.designation ? ERR : ""}`}
              />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                id="organization"
                label="Organisation (optional)"
                error={errors.organization}
              >
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  value={values.organization}
                  onChange={(e) => set("organization", e.target.value)}
                  placeholder="MedSkills Catalyst"
                  className={`${FIELD} ${errors.organization ? ERR : ""}`}
                />
              </Field>

              <Field
                id="profile_image_url"
                label="Portrait (optional)"
                hint="A full https:// link, or a path like assets/gagan_victor.jpg"
                error={errors.profile_image_url}
              >
                <input
                  id="profile_image_url"
                  name="profile_image_url"
                  type="text"
                  value={values.profile_image_url}
                  onChange={(e) => set("profile_image_url", e.target.value)}
                  placeholder="assets/gagan_victor.jpg"
                  aria-invalid={!!errors.profile_image_url}
                  className={`${FIELD} ${errors.profile_image_url ? ERR : ""}`}
                />
              </Field>
            </div>
          </div>

          {/* ── Experience ──────────────────────────────────── */}
          <div className="space-y-6 rounded-msc-lg border border-brand-navy/8 bg-surface p-6 shadow-msc-sm">
            <h2 className="font-display text-base font-bold text-brand-navy">
              Experience
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                id="years_experience"
                label="Years of experience (optional)"
                hint="A number. Used for sorting, not shown directly."
                error={errors.years_experience}
              >
                <input
                  id="years_experience"
                  name="years_experience"
                  type="number"
                  min={0}
                  max={80}
                  step={1}
                  value={values.years_experience}
                  onChange={(e) => set("years_experience", e.target.value)}
                  placeholder="20"
                  aria-invalid={!!errors.years_experience}
                  className={`${FIELD} ${errors.years_experience ? ERR : ""}`}
                />
              </Field>

              <Field
                id="experience_display"
                label="How it reads on the site (optional)"
                hint="The exact wording shown, for example “20+ Years Experience”."
                error={errors.experience_display}
              >
                <input
                  id="experience_display"
                  name="experience_display"
                  type="text"
                  value={values.experience_display}
                  onChange={(e) => set("experience_display", e.target.value)}
                  placeholder="20+ Years Experience"
                  className={`${FIELD} ${errors.experience_display ? ERR : ""}`}
                />
              </Field>
            </div>

            <ExpertiseEditor
              tags={tags}
              onChange={setTags}
              disabled={!canEdit}
              error={errors.expertise}
            />
          </div>

          {/* ── Biography ───────────────────────────────────── */}
          <div className="space-y-6 rounded-msc-lg border border-brand-navy/8 bg-surface p-6 shadow-msc-sm">
            <h2 className="font-display text-base font-bold text-brand-navy">
              Biography
            </h2>

            <Field
              id="short_bio"
              label="Short bio (optional)"
              hint="A brief version for compact layouts."
              error={errors.short_bio}
            >
              <textarea
                id="short_bio"
                name="short_bio"
                rows={3}
                maxLength={SHORT_BIO_MAX}
                value={values.short_bio}
                onChange={(e) => set("short_bio", e.target.value)}
                className={`${AREA} ${errors.short_bio ? ERR : ""}`}
              />
              <p className={`mt-1.5 text-xs ${bioLeft < 0 ? "text-danger" : "text-muted"}`}>
                {bioLeft} characters remaining
              </p>
            </Field>

            <Field
              id="full_bio"
              label="Full biography"
              hint="The version shown on their card."
              error={errors.full_bio}
            >
              <textarea
                id="full_bio"
                name="full_bio"
                rows={9}
                value={values.full_bio}
                onChange={(e) => set("full_bio", e.target.value)}
                className={`${AREA} ${errors.full_bio ? ERR : ""}`}
              />
            </Field>
          </div>
        </fieldset>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-4 border-t border-brand-navy/10 pt-6">
            <SaveButton label={facultyId ? "Save changes" : "Create mentor"} />
            <Link
              href="/cms/faculty"
              className="h-11 rounded-pill border border-brand-navy/15 px-6 text-sm font-semibold leading-[2.6rem] text-brand-navy transition hover:bg-brand-navy/5"
            >
              Cancel
            </Link>
            {dirty && (
              <span className="text-xs font-medium text-warning">
                You have unsaved changes.
              </span>
            )}
            {!facultyId && (
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
