"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TextField, SelectField } from "./ui/Field";
import { Button } from "./ui/Button";
import { Section } from "./ui/Section";
import { validateRegistration } from "@/lib/validation";
import { captureTracking } from "@/lib/tracking";
import { trackFormStart, trackFormSubmit } from "@/lib/analytics";
import type {
  FieldErrors,
  RegistrationFormState,
  TrackingFields,
} from "@/lib/types";

const EMPTY: RegistrationFormState = {
  full_name: "",
  mobile: "",
  email: "",
  user_type: "",
  college_name: "",
  course: "",
  graduation_year: "",
  company_name: "",
  job_title: "",
  experience: "",
};

const gradYears = Array.from({ length: 9 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { value: String(y), label: String(y) };
});

const experienceOpts = [
  { value: "0-1", label: "Fresher / under 1 year" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5+",  label: "5+ years" },
];

export function RegistrationForm() {
  const router = useRouter();
  const [form, setForm] = useState<RegistrationFormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const trackingRef = useRef<TrackingFields>({});

  // Hydrate hidden tracking fields once on mount.
  useEffect(() => {
    trackingRef.current = captureTracking();
    setForm((f) => ({ ...f, ...trackingRef.current }));
  }, []);

  function update<K extends keyof RegistrationFormState>(
    key: K,
    value: RegistrationFormState[K]
  ) {
    if (!startedRef.current) {
      startedRef.current = true;
      trackFormStart(); // fire form_start on first interaction
    }
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const merged = { ...form, ...trackingRef.current };
    const found = validateRegistration(merged);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const first = document.querySelector('[aria-invalid="true"]');
      (first as HTMLElement | null)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422 && data.fields) setErrors(data.fields);
        else setServerError(data.error || "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }

      trackFormSubmit(merged.user_type as "student" | "professional", trackingRef.current);
      router.push("/webinar/thank-you");
    } catch {
      setServerError("Network error. Please check your connection and retry.");
      setSubmitting(false);
    }
  }

  const isStudent = form.user_type === "student";
  const isPro = form.user_type === "professional";

  return (
    <Section
      id="register"
      tone="light"
      eyebrow="Reserve your seat"
      title="Register free — takes 30 seconds"
      subtitle="The Zoom link and reminders go straight to your WhatsApp and email."
    >
      <form
        noValidate
        onSubmit={onSubmit}
        className="mx-auto max-w-xl rounded-msc-lg border border-ink/8 bg-surface p-6 shadow-msc-md sm:p-8"
      >
        {/* Honeypot — hidden from humans, bots fill it. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          onChange={(e) =>
            setForm((f) => ({ ...f, website: e.target.value }) as RegistrationFormState)
          }
        />

        <div className="grid gap-4">
          <TextField
            label="Full name"
            name="full_name"
            required
            autoComplete="name"
            value={form.full_name}
            error={errors.full_name}
            onChange={(e) => update("full_name", e.target.value)}
          />
          <TextField
            label="Mobile number (WhatsApp)"
            name="mobile"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            placeholder="9XXXXXXXXX"
            value={form.mobile}
            error={errors.mobile}
            onChange={(e) => update("mobile", e.target.value)}
          />
          <TextField
            label="Email address"
            name="email"
            type="email"
            inputMode="email"
            required
            autoComplete="email"
            value={form.email}
            error={errors.email}
            onChange={(e) => update("email", e.target.value)}
          />

          {/* User type toggle */}
          <fieldset>
            <legend className="text-sm font-medium text-ink/80">
              I am a<span className="ml-0.5 text-emerald-dark">*</span>
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(
                [
                  ["student",      "Student"],
                  ["professional", "Working professional"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  aria-pressed={form.user_type === val}
                  onClick={() => update("user_type", val)}
                  className={`min-h-[48px] rounded-msc border px-4 py-3 text-sm font-semibold transition-colors ${
                    form.user_type === val
                      ? "border-emerald bg-emerald/10 text-teal-deep"
                      : "border-ink/15 bg-white text-ink/70 hover:border-ink/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {errors.user_type && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {errors.user_type}
              </p>
            )}
          </fieldset>

          {/* Conditional: student */}
          {isStudent && (
            <div className="grid gap-4 rounded-msc bg-teal-pale/60 p-4">
              <TextField
                label="College name"
                name="college_name"
                required
                value={form.college_name}
                error={errors.college_name}
                onChange={(e) => update("college_name", e.target.value)}
              />
              <TextField
                label="Course"
                name="course"
                required
                placeholder="e.g. B.Pharm, B.Sc Biotech"
                value={form.course}
                error={errors.course}
                onChange={(e) => update("course", e.target.value)}
              />
              <SelectField
                label="Graduation year"
                name="graduation_year"
                required
                placeholder="Select year…"
                options={gradYears}
                value={form.graduation_year}
                error={errors.graduation_year}
                onChange={(e) => update("graduation_year", e.target.value)}
              />
            </div>
          )}

          {/* Conditional: professional */}
          {isPro && (
            <div className="grid gap-4 rounded-msc bg-teal-pale/60 p-4">
              <TextField
                label="Company name"
                name="company_name"
                required
                value={form.company_name}
                error={errors.company_name}
                onChange={(e) => update("company_name", e.target.value)}
              />
              <TextField
                label="Job title"
                name="job_title"
                required
                value={form.job_title}
                error={errors.job_title}
                onChange={(e) => update("job_title", e.target.value)}
              />
              <SelectField
                label="Years of experience"
                name="experience"
                required
                placeholder="Select…"
                options={experienceOpts}
                value={form.experience}
                error={errors.experience}
                onChange={(e) =>
                  update("experience", e.target.value as RegistrationFormState["experience"])
                }
              />
            </div>
          )}

          {serverError && (
            <p role="alert" className="rounded-msc bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="mt-2 w-full">
            {submitting ? "Reserving your seat…" : "Reserve my free seat →"}
          </Button>
          <p className="text-center text-xs text-ink/50">
            By registering you agree to receive session details on WhatsApp and email.
            No spam.
          </p>
        </div>
      </form>
    </Section>
  );
}
