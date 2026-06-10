export type UserType = "student" | "professional";

export type ExperienceBucket = "0-1" | "1-3" | "3-5" | "5+";

/** Hidden attribution captured from URL + referrer on first paint. */
export interface TrackingFields {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ambassador_id?: string;
  college_id?: string;
  registration_source?: string;
  referrer_url?: string;
  landing_path?: string;
}

/** Raw shape of the form in the browser. */
export interface RegistrationFormState extends TrackingFields {
  full_name: string;
  mobile: string;
  email: string;
  user_type: UserType | "";
  // student
  college_name: string;
  course: string;
  graduation_year: string;
  // professional
  company_name: string;
  job_title: string;
  experience: ExperienceBucket | "";
}

/** Validated payload sent to /api/register. */
export interface RegistrationPayload extends TrackingFields {
  full_name: string;
  mobile: string;
  email: string;
  user_type: UserType;
  college_name?: string;
  course?: string;
  graduation_year?: number;
  company_name?: string;
  job_title?: string;
  experience?: ExperienceBucket;
}

export type FieldErrors = Partial<Record<keyof RegistrationFormState, string>>;
