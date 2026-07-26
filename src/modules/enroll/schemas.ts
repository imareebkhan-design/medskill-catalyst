import { z } from "zod";

/**
 * Shared enrollment-application contract.
 *
 * The SAME schema validates the react-hook-form client (via zodResolver) and
 * the server action (defence in depth). The résumé is handled out-of-band: the
 * browser uploads it to /api/enroll/upload and the form stores the returned
 * {@link UploadedDoc} metadata, so what crosses the wire on submit is a plain
 * serialisable object — never a raw File.
 */

// ── Reusable field pieces ──────────────────────────────────────────

const MB = 1024 * 1024;

const uploadedDoc = z.object({
  key: z.string().min(1),
  name: z.string().min(1).max(260),
  size: z.number().int().positive().max(15 * MB),
  mime: z.string().min(1).max(120),
});
export type UploadedDoc = z.infer<typeof uploadedDoc>;

/** Per-field upload constraints — consumed by the client picker AND the API route. */
export const UPLOAD_SPECS = {
  resume: {
    label: "Résumé / CV",
    accept: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxBytes: 10 * MB,
    hint: "PDF or Word · up to 10 MB",
  },
} as const;

export type UploadField = keyof typeof UPLOAD_SPECS;

const phone = z
  .string()
  .trim()
  .regex(/^[+]?[0-9][0-9\s-]{8,14}$/, "Enter a valid phone number");

/** Optional free-text: allow an empty string through, cap the length otherwise. */
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const CURRENT_YEAR = new Date().getUTCFullYear();

// ── Enumerations (kept in sync with the UI selects) ────────────────

export const GENDERS = ["Male", "Female", "Other", "Prefer not to say"] as const;

export const YEARS_OF_STUDY = [
  "1st year",
  "2nd year",
  "3rd year",
  "4th year",
  "5th year",
  "Intern / House surgeon",
  "Graduated",
] as const;

// ── The application schema ─────────────────────────────────────────

export const enrollmentApplicationSchema = z
  .object({
    // ── Student information ──
    first_name: z.string().trim().min(1, "First name is required").max(80),
    last_name: z.string().trim().min(1, "Last name is required").max(80),
    gender: z.enum(GENDERS, { message: "Select your gender" }),
    phone,
    whatsapp: phone,
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
    address: z.string().trim().min(4, "Address is required").max(300),
    city: z.string().trim().min(2, "City is required").max(100),
    state: z.string().trim().min(2, "State is required").max(80),
    country: z.string().trim().min(2, "Country is required").max(80),
    zip_code: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/, "Enter a valid ZIP / PIN code"),
    nationality: z.string().trim().min(2, "Nationality is required").max(80),

    // ── Background: status drives which fields below are required ──
    is_student: z.boolean(),
    is_working_professional: z.boolean(),

    // Academic (required when is_student — enforced in superRefine)
    university: optionalText(160),
    college: optionalText(160),
    degree: optionalText(120),
    course: optionalText(120),
    year_of_study: z.enum(YEARS_OF_STUDY).optional(),
    graduation_year: optionalText(4),

    // Professional (required when is_working_professional — enforced in superRefine)
    company_name: optionalText(160),
    designation: optionalText(120),
    experience: optionalText(60),

    // Always optional
    linkedin: z
      .string()
      .trim()
      .url("Enter a valid URL (https://…)")
      .max(200)
      .optional()
      .or(z.literal("")),
    medical_registration_number: optionalText(60),

    // ── Résumé (the only document collected) ──
    resume: uploadedDoc,

    // ── Consent ──
    // Boolean (not z.literal(true)) so RHF can default it to false; the refine
    // still requires a ticked box.
    consent: z.boolean().refine((v) => v === true, "Please accept to continue"),
  })
  .superRefine((val, ctx) => {
    // At least one status must be chosen.
    if (!val.is_student && !val.is_working_professional) {
      ctx.addIssue({
        code: "custom",
        path: ["is_student"],
        message: "Select whether you're a student, a working professional, or both",
      });
    }

    // Student → academic fields required.
    if (val.is_student) {
      if (!val.university?.trim())
        ctx.addIssue({ code: "custom", path: ["university"], message: "University is required" });
      if (!val.degree?.trim())
        ctx.addIssue({ code: "custom", path: ["degree"], message: "Degree is required" });
      if (!val.course?.trim())
        ctx.addIssue({ code: "custom", path: ["course"], message: "Course is required" });
      if (!val.year_of_study)
        ctx.addIssue({ code: "custom", path: ["year_of_study"], message: "Select your year of study" });
      const gy = val.graduation_year?.trim();
      if (!gy) {
        ctx.addIssue({ code: "custom", path: ["graduation_year"], message: "Graduation year is required" });
      } else if (!/^\d{4}$/.test(gy) || Number(gy) < 1980 || Number(gy) > CURRENT_YEAR + 8) {
        ctx.addIssue({
          code: "custom",
          path: ["graduation_year"],
          message: `Enter a valid year (1980–${CURRENT_YEAR + 8})`,
        });
      }
    }

    // Working professional → company + designation required.
    if (val.is_working_professional) {
      if (!val.company_name?.trim())
        ctx.addIssue({ code: "custom", path: ["company_name"], message: "Company name is required" });
      if (!val.designation?.trim())
        ctx.addIssue({ code: "custom", path: ["designation"], message: "Designation is required" });
    }
  });

export type EnrollmentApplication = z.infer<typeof enrollmentApplicationSchema>;
