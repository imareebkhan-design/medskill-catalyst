"use client";

import { useState, type ReactNode } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";
import {
  enrollmentApplicationSchema,
  GENDERS,
  YEARS_OF_STUDY,
  type EnrollmentApplication,
} from "@/src/modules/enroll/schemas";
import type { EnrollResult } from "./actions";
import { FileUpload } from "./file-upload";
import { type UploadScope } from "@/src/modules/enroll/upload-client";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman & Nicobar", "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu", "Delhi", "Jammu & Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry",
];

type Props = {
  uploadScope: UploadScope;
  /** Flow-agnostic submit: token-based or public. Returns the enrollment result. */
  submit: (values: EnrollmentApplication) => Promise<EnrollResult>;
  defaults: { firstName: string; lastName: string; email: string; phone: string };
  onReserved: (res: { enrollmentId: string; eventId?: string }) => void;
};

const sectionReveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

/** Section shell: numbered heading + card body. */
function Section({ step, title, subtitle, children }: {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <motion.section {...sectionReveal}>
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">
          {step}
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-brand-navy">{title}</h3>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      <Card>
        <CardContent className="p-5 sm:p-6">{children}</CardContent>
      </Card>
    </motion.section>
  );
}

/** Label + control + inline error, laid out in the responsive grid. */
function Field({ label, htmlFor, required, error, hint, className, children }: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: FieldError;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
      {error?.message && <p className="mt-1 text-xs text-danger">{error.message}</p>}
    </div>
  );
}

export function EnrollmentForm({ uploadScope, submit, defaults, onReserved }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EnrollmentApplication>({
    resolver: zodResolver(enrollmentApplicationSchema),
    mode: "onBlur",
    defaultValues: {
      first_name: defaults.firstName,
      last_name: defaults.lastName,
      email: defaults.email,
      phone: defaults.phone,
      whatsapp: defaults.phone,
      country: "India",
      nationality: "Indian",
      is_student: false,
      is_working_professional: false,
      consent: false,
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);

  const isStudent = watch("is_student");
  const isWorkingPro = watch("is_working_professional");
  const resume = watch("resume");

  async function onValid(values: EnrollmentApplication) {
    setSubmitError(null);
    const res = await submit(values);
    if (res.status === "success") {
      onReserved({ enrollmentId: res.enrollmentId, eventId: res.eventId });
    } else {
      setSubmitError(res.message);
    }
  }

  function onInvalid() {
    setSubmitError("Please fix the highlighted fields below, then submit again.");
  }

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-8" noValidate>
      {/* ── 1 · Student information ─────────────────────────── */}
      <Section step={1} title="Student information" subtitle="Your personal and contact details.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="first_name" required error={errors.first_name}>
            <Input id="first_name" autoComplete="given-name" {...register("first_name")} />
          </Field>
          <Field label="Last name" htmlFor="last_name" required error={errors.last_name}>
            <Input id="last_name" autoComplete="family-name" {...register("last_name")} />
          </Field>
          <Field label="Gender" htmlFor="gender" required error={errors.gender}>
            <Select id="gender" defaultValue="" required {...register("gender")}>
              <option value="" disabled>Select gender</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Email" htmlFor="email" required error={errors.email}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
          </Field>
          <Field label="Phone number" htmlFor="phone" required error={errors.phone}>
            <Input id="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" {...register("phone")} />
          </Field>
          <Field label="WhatsApp number" htmlFor="whatsapp" required error={errors.whatsapp}>
            <Input id="whatsapp" type="tel" placeholder="+91 98765 43210" {...register("whatsapp")} />
          </Field>
          <Field label="Address" htmlFor="address" required error={errors.address} className="sm:col-span-2">
            <Input id="address" autoComplete="street-address" {...register("address")} />
          </Field>
          <Field label="City" htmlFor="city" required error={errors.city}>
            <Input id="city" autoComplete="address-level2" {...register("city")} />
          </Field>
          <Field label="State" htmlFor="state" required error={errors.state}>
            <Select id="state" defaultValue="" required {...register("state")}>
              <option value="" disabled>Select state</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Country" htmlFor="country" required error={errors.country}>
            <Input id="country" autoComplete="country-name" {...register("country")} />
          </Field>
          <Field label="ZIP / PIN code" htmlFor="zip_code" required error={errors.zip_code}>
            <Input id="zip_code" autoComplete="postal-code" inputMode="numeric" {...register("zip_code")} />
          </Field>
          <Field label="Nationality" htmlFor="nationality" required error={errors.nationality} className="sm:col-span-2">
            <Input id="nationality" {...register("nationality")} />
          </Field>
        </div>
      </Section>

      {/* ── 2 · Background ──────────────────────────────────── */}
      <Section step={2} title="Your background" subtitle="Tell us where you are in your journey.">
        <div className="space-y-5">
          <div>
            <Label>Are you a student, a working professional, or both?</Label>
            <div className="mt-1 flex flex-wrap gap-3">
              {[
                { key: "is_student" as const, label: "🎓 Student", active: isStudent },
                { key: "is_working_professional" as const, label: "💼 Working professional", active: isWorkingPro },
              ].map((o) => (
                <button
                  key={o.key}
                  type="button"
                  aria-pressed={o.active}
                  onClick={() => setValue(o.key, !o.active, { shouldValidate: true })}
                  className={cn(
                    "rounded-pill border px-5 py-2 text-sm font-semibold transition-colors",
                    o.active
                      ? "border-brand-blue bg-brand-blue text-white"
                      : "border-brand-navy/15 text-muted hover:border-brand-blue hover:text-brand-navy",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {errors.is_student?.message && (
              <p className="mt-1.5 text-xs text-danger">{errors.is_student.message}</p>
            )}
            <p className="mt-1.5 text-[11px] text-muted">You can select both if they apply.</p>
          </div>

          {isStudent && (
            <div className="grid gap-4 rounded-msc-md bg-brand-pale/40 p-4 sm:grid-cols-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy sm:col-span-2">
                Academic details
              </p>
              <Field label="University" htmlFor="university" required error={errors.university}>
                <Input id="university" {...register("university")} />
              </Field>
              <Field label="College" htmlFor="college" error={errors.college}>
                <Input id="college" {...register("college")} />
              </Field>
              <Field label="Degree" htmlFor="degree" required error={errors.degree}>
                <Input id="degree" placeholder="e.g. B.Pharm, MBBS, B.Tech" {...register("degree")} />
              </Field>
              <Field label="Course / specialisation" htmlFor="course" required error={errors.course}>
                <Input id="course" placeholder="e.g. Pharmacology" {...register("course")} />
              </Field>
              <Field label="Year of study" htmlFor="year_of_study" required error={errors.year_of_study}>
                <Select id="year_of_study" defaultValue="" required {...register("year_of_study")}>
                  <option value="" disabled>Select year</option>
                  {YEARS_OF_STUDY.map((y) => <option key={y} value={y}>{y}</option>)}
                </Select>
              </Field>
              <Field label="Graduation year" htmlFor="graduation_year" required error={errors.graduation_year}>
                <Input id="graduation_year" inputMode="numeric" placeholder="2025" maxLength={4} {...register("graduation_year")} />
              </Field>
            </div>
          )}

          {isWorkingPro && (
            <div className="grid gap-4 rounded-msc-md bg-brand-pale/40 p-4 sm:grid-cols-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-navy sm:col-span-2">
                Professional details
              </p>
              <Field label="Company name" htmlFor="company_name" required error={errors.company_name}>
                <Input id="company_name" {...register("company_name")} />
              </Field>
              <Field label="Designation" htmlFor="designation" required error={errors.designation}>
                <Input id="designation" {...register("designation")} />
              </Field>
              <Field label="Experience" htmlFor="experience" error={errors.experience} hint="e.g. 2 years">
                <Input id="experience" {...register("experience")} />
              </Field>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="LinkedIn profile" htmlFor="linkedin" error={errors.linkedin}>
              <Input id="linkedin" type="url" placeholder="https://linkedin.com/in/…" {...register("linkedin")} />
            </Field>
            <Field label="Medical registration no." htmlFor="medical_registration_number" error={errors.medical_registration_number} hint="If applicable (doctors, nurses, pharmacists)">
              <Input id="medical_registration_number" {...register("medical_registration_number")} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── 3 · Résumé ─────────────────────────────────────── */}
      <Section step={3} title="Résumé" subtitle="Upload your latest résumé or CV.">
        <FileUpload
          uploadScope={uploadScope}
          field="resume"
          label="Résumé / CV"
          required
          value={resume}
          error={errors.resume?.message}
          onChange={(d) => setValue("resume", d as EnrollmentApplication["resume"], { shouldValidate: true })}
        />
      </Section>

      {/* ── 4 · Consent ────────────────────────────────────── */}
      <Section step={4} title="Consent" subtitle="Confirm and complete your enrollment.">
        <label className="flex items-start gap-3 rounded-msc-md bg-brand-pale/50 p-4 text-xs leading-relaxed text-muted">
          <Checkbox className="mt-0.5" {...register("consent")} />
          <span>
            I agree to the{" "}
            <a href="/terms-of-use" className="underline" target="_blank">terms &amp; conditions</a>{" "}
            and{" "}
            <a href="/refund-policy" className="underline" target="_blank">refund policy</a>, confirm my
            details are accurate, and consent to MedSkills Catalyst processing my information for
            enrollment and communication per the{" "}
            <a href="/privacy-policy" className="underline" target="_blank">privacy policy</a>.
          </span>
        </label>
        {errors.consent?.message && <p className="mt-1 text-xs text-danger">{errors.consent.message}</p>}
      </Section>

      {submitError && (
        <div role="alert" className="rounded-msc-md border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
          {submitError}
        </div>
      )}

      <div>
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Reserving your seat…" : "Reserve my seat →"}
        </Button>
        <p className="mt-2 text-center text-xs text-muted">
          No payment is taken on this step. You&rsquo;ll receive a secure payment link next.
        </p>
      </div>
    </form>
  );
}
