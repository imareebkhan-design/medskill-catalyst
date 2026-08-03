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

const optionalPhone = z
  .string()
  .trim()
  .regex(/^[+]?[0-9][0-9\s-]{8,14}$/, "Enter a valid phone number")
  .optional()
  .or(z.literal(""));

export const enrollmentApplicationSchema = z
  .object({
    // ── Required: name / number / email ──
    first_name: z.string().trim().min(1, "Name is required").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
    phone,

    // ── Required: college name ──
    college: z.string().trim().min(2, "College / university name is required").max(160),

    // ── Required: profession (at least one, enforced in superRefine) ──
    is_student: z.boolean(),
    is_working_professional: z.boolean(),

    // ── Everything below is optional ──
    last_name: optionalText(80),
    gender: z.enum(GENDERS).optional().or(z.literal("")),
    whatsapp: optionalPhone,
    address: optionalText(300),
    city: optionalText(100),
    state: optionalText(80),
    country: optionalText(80),
    zip_code: optionalText(12),
    nationality: optionalText(80),

    university: optionalText(160),
    degree: optionalText(120),
    course: optionalText(120),
    year_of_study: z.enum(YEARS_OF_STUDY).optional().or(z.literal("")),
    graduation_year: optionalText(4),
    company_name: optionalText(160),
    designation: optionalText(120),
    experience: optionalText(60),

    linkedin: z
      .string()
      .trim()
      .url("Enter a valid URL (https://…)")
      .max(200)
      .optional()
      .or(z.literal("")),
    medical_registration_number: optionalText(60),

    // Résumé — optional.
    resume: uploadedDoc.optional(),

    // ── Consent (legal — stays required) ──
    // Boolean (not z.literal(true)) so RHF can default it to false; the refine
    // still requires a ticked box.
    consent: z.boolean().refine((v) => v === true, "Please accept to continue"),
  })
  .superRefine((val, ctx) => {
    // Profession must be indicated (student, working professional, or both).
    if (!val.is_student && !val.is_working_professional) {
      ctx.addIssue({
        code: "custom",
        path: ["is_student"],
        message: "Select whether you're a student, a working professional, or both",
      });
    }

    // Graduation year, if provided, must be a plausible 4-digit year.
    const gy = val.graduation_year?.trim();
    if (gy && (!/^\d{4}$/.test(gy) || Number(gy) < 1980 || Number(gy) > CURRENT_YEAR + 8)) {
      ctx.addIssue({
        code: "custom",
        path: ["graduation_year"],
        message: `Enter a valid year (1980–${CURRENT_YEAR + 8})`,
      });
    }
  });

export type EnrollmentApplication = z.infer<typeof enrollmentApplicationSchema>;
