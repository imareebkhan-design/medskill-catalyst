import type {
  FieldErrors,
  RegistrationFormState,
  RegistrationPayload,
  UserType,
} from "./types";

// Indian mobile: 10 digits starting 6-9, optional +91 / 0 prefix.
const MOBILE_RE = /^(?:\+?91|0)?[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const ten = digits.slice(-10);
  return ten ? `+91${ten}` : raw.trim();
}

/**
 * Shared validator used by BOTH client and server.
 * Returns field-level errors; empty object === valid.
 */
export function validateRegistration(
  form: RegistrationFormState
): FieldErrors {
  const e: FieldErrors = {};

  if (!form.full_name.trim() || form.full_name.trim().length < 2)
    e.full_name = "Please enter your full name.";

  if (!MOBILE_RE.test(form.mobile.replace(/\s/g, "")))
    e.mobile = "Enter a valid 10-digit Indian mobile number.";

  if (!EMAIL_RE.test(form.email.trim()))
    e.email = "Enter a valid email address.";

  if (form.user_type !== "student" && form.user_type !== "professional")
    e.user_type = "Tell us which best describes you.";

  if (form.user_type === "student") {
    if (!form.college_name.trim()) e.college_name = "College name is required.";
    if (!form.course.trim()) e.course = "Course is required.";
    const yr = Number(form.graduation_year);
    const now = new Date().getFullYear();
    if (!form.graduation_year || Number.isNaN(yr) || yr < now - 10 || yr > now + 8)
      e.graduation_year = "Enter a valid graduation year.";
  }

  if (form.user_type === "professional") {
    if (!form.company_name.trim()) e.company_name = "Company name is required.";
    if (!form.job_title.trim()) e.job_title = "Job title is required.";
    if (!form.experience) e.experience = "Select your experience.";
  }

  return e;
}

/** Convert a validated form into the typed payload the API expects. */
export function toPayload(form: RegistrationFormState): RegistrationPayload {
  const base = {
    full_name: form.full_name.trim(),
    mobile: normalizeMobile(form.mobile),
    email: form.email.trim().toLowerCase(),
    user_type: form.user_type as UserType,
    utm_source: form.utm_source,
    utm_medium: form.utm_medium,
    utm_campaign: form.utm_campaign,
    utm_content: form.utm_content,
    utm_term: form.utm_term,
    ambassador_id: form.ambassador_id,
    college_id: form.college_id,
    registration_source: form.registration_source,
    referrer_url: form.referrer_url,
    landing_path: form.landing_path,
  };

  if (form.user_type === "student") {
    return {
      ...base,
      college_name: form.college_name.trim(),
      course: form.course.trim(),
      graduation_year: Number(form.graduation_year),
    };
  }
  return {
    ...base,
    company_name: form.company_name.trim(),
    job_title: form.job_title.trim(),
    experience: form.experience || undefined,
  };
}
