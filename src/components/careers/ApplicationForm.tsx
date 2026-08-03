"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BtnChip, btnPrimary } from "@/src/components/careers/ui";

interface ApplicationFormProps {
  jobSlug: string;
  jobTitle: string;
}

/* Two steps only: the essentials to shortlist. Everything else is optional
   and collapsed. Field names and the submission payload are identical to the
   original 8-step form — /api/careers/apply is unchanged. */
const STEPS = [
  { id: 1, name: "Contact details" },
  { id: 2, name: "Background & submit" }
];

const SKILL_OPTIONS = [
  "Communication",
  "Leadership",
  "Public Speaking",
  "Marketing",
  "Sales",
  "Social Media",
  "Graphic Design",
  "Content Writing",
  "Video Editing",
  "Community Building",
  "Canva",
  "AI Tools",
  "Microsoft Office",
  "Google Workspace"
];

// Shared light-surface input styling, matching the homepage inline forms.
const inputClass =
  "w-full px-4 py-3 min-h-[44px] bg-surface border border-[rgba(10,42,67,0.15)] rounded-msc text-ink placeholder:text-ink/35 focus:outline-none focus:border-teal-mid focus:ring-4 focus:ring-teal-mid/10 transition-all duration-200";
const labelClass = "block text-[0.72rem] font-bold uppercase tracking-wider text-teal-deep mb-2";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-danger mt-1.5 font-bold">
      {message}
    </p>
  );
}

/** Collapsible "optional extras" group — native disclosure, keyboard friendly. */
function OptionalGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-msc-md border border-[rgba(10,42,67,0.08)] bg-canvas/60 open:bg-canvas/40">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-[0.875rem] font-bold text-teal-deep rounded-msc-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-mid [&::-webkit-details-marker]:hidden">
        <span>
          {title} <span className="font-semibold text-muted">(optional)</span>
        </span>
        <span aria-hidden="true" className="text-teal-mid text-lg font-bold transition-transform duration-200 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="space-y-6 px-5 pb-6 pt-1">{children}</div>
    </details>
  );
}

export function ApplicationForm({ jobSlug, jobTitle }: ApplicationFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>({
    full_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    gender: "",
    dob: "",
    city: "",
    state: "",
    country: "India",
    address: "",
    university: "",
    college: "",
    degree: "",
    course: "",
    current_year: "",
    graduation_year: "",
    cgpa: "",
    previous_internship: "",
    leadership_experience: "",
    clubs: "",
    volunteer_work: "",
    event_experience: "",
    skills: [],
    linkedin: "",
    instagram: "",
    portfolio: "",
    github: "",
    why_join: "",
    leadership_story: "",
    promotion_plan: "",
    certify_accuracy: false,
    agree_updates: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // File states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [portFile, setPortFile] = useState<File | null>(null);
  const [achFile, setAchievementsFile] = useState<File | null>(null);

  // Autosave key
  const saveKey = `msc_career_draft_${jobSlug}`;

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(saveKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error("Failed to load application draft", e);
    }
  }, [saveKey]);

  // Save draft to localStorage on change
  const saveDraft = (data: Record<string, any>) => {
    try {
      localStorage.setItem(saveKey, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save draft", e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let updatedValue: any = value;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      updatedValue = target.checked;
    }

    const updatedFormData = {
      ...formData,
      [name]: updatedValue
    };

    setFormData(updatedFormData);
    saveDraft(updatedFormData);

    // Clear error for field
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSkillChange = (skill: string) => {
    const currentSkills = [...(formData.skills || [])];
    const index = currentSkills.indexOf(skill);

    if (index > -1) {
      currentSkills.splice(index, 1);
    } else {
      currentSkills.push(skill);
    }

    const updatedFormData = {
      ...formData,
      skills: currentSkills
    };

    setFormData(updatedFormData);
    saveDraft(updatedFormData);
  };

  const getWordCount = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Validation — required set matches what /api/careers/apply enforces.
  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.full_name.trim()) stepErrors.full_name = "Full name is required.";
      if (!formData.email.trim()) {
        stepErrors.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        stepErrors.email = "Please enter a valid email address.";
      }
      if (!formData.phone.trim()) stepErrors.phone = "Phone number is required.";
      if (!formData.city.trim()) stepErrors.city = "City is required.";
      if (!formData.state.trim()) stepErrors.state = "State is required.";
      if (!formData.country.trim()) stepErrors.country = "Country is required.";
    }

    if (step === 2) {
      if (!formData.university.trim()) stepErrors.university = "University is required.";
      if (!resumeFile) stepErrors.resume = "A PDF, DOC, or DOCX resume file is required.";
      if (!formData.certify_accuracy) {
        stepErrors.certify_accuracy = "You must certify that the information provided is accurate.";
      }

      // Short answers are optional now, but keep the 300-word cap when filled.
      (["why_join", "leadership_story", "promotion_plan"] as const).forEach(field => {
        const words = getWordCount(formData[field]);
        if (words > 300) {
          stepErrors[field] = `Your response exceeds 300 words (${words} words).`;
        }
      });
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const scrollToForm = () => {
    window.scrollTo({ top: (document.getElementById("apply-section")?.offsetTop || 0) - 90, behavior: "smooth" });
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      scrollToForm();
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    scrollToForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateStep(2)) return;

    setIsSubmitting(true);

    try {
      const dataPayload = new FormData();

      // Append core text values — identical payload to the original form.
      Object.keys(formData).forEach(key => {
        if (key === "skills") {
          dataPayload.append(key, JSON.stringify(formData[key]));
        } else {
          dataPayload.append(key, formData[key]);
        }
      });

      dataPayload.append("job_slug", jobSlug);

      // Append files
      if (resumeFile) dataPayload.append("resume", resumeFile);
      if (certFile) dataPayload.append("certificates", certFile);
      if (portFile) dataPayload.append("portfolio_file", portFile);
      if (achFile) dataPayload.append("achievements", achFile);

      // Append UTM / Attribution from localStorage if exists
      const attributionStr = localStorage.getItem("msc_webinar_attribution") || "{}";
      const attribution = JSON.parse(attributionStr);
      dataPayload.append("utm_source", attribution.utm_source || "");
      dataPayload.append("utm_medium", attribution.utm_medium || "");
      dataPayload.append("utm_campaign", attribution.utm_campaign || "");
      dataPayload.append("referrer_url", document.referrer || "");

      // Meta event id — shared with the server (Conversions API) so the
      // browser Lead fired on the success page and the server-side Lead
      // deduplicate into one conversion.
      const fbEventId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `e${Date.now()}-${Math.random().toString(36).slice(2)}`;
      dataPayload.append("fb_event_name", "Lead");
      dataPayload.append("fb_event_id", fbEventId);

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        body: dataPayload
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // Clear draft
        localStorage.removeItem(saveKey);
        // Redirect to success route (eid → dedup with the server-side Lead)
        router.push(`/careers/success?id=${result.application_id}&role=${encodeURIComponent(jobTitle)}&eid=${fbEventId}`);
      } else {
        setSubmitError(result.error || "Failed to submit application. Please try again.");
      }
    } catch (err) {
      console.error("Apply submit failure", err);
      setSubmitError("A connection error occurred. Please verify your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileSetter: (f: File | null) => void, errorField: string) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, [errorField]: "File size exceeds the 5MB limit." }));
        fileSetter(null);
      } else {
        setErrors(prev => {
          const copy = { ...prev };
          delete copy[errorField];
          return copy;
        });
        fileSetter(file);
      }
    } else {
      fileSetter(null);
    }
  };

  const textField = (
    name: string,
    label: string,
    opts: { required?: boolean; type?: string; placeholder?: string; autoComplete?: string } = {}
  ) => (
    <div>
      <label htmlFor={`apply-${name}`} className={labelClass}>
        {label} {opts.required && <span aria-hidden="true">*</span>}
      </label>
      <input
        id={`apply-${name}`}
        type={opts.type || "text"}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
        required={opts.required}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `apply-${name}-error` : undefined}
        className={inputClass}
      />
      <FieldError id={`apply-${name}-error`} message={errors[name]} />
    </div>
  );

  const essayField = (name: string, label: string, placeholder: string) => (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline gap-4">
        <label htmlFor={`apply-${name}`} className={labelClass}>
          {label}
        </label>
        <span className={`text-[0.7rem] font-bold ${getWordCount(formData[name]) > 300 ? "text-danger" : "text-muted"}`}>
          {getWordCount(formData[name])} / 300 words
        </span>
      </div>
      <textarea
        id={`apply-${name}`}
        name={name}
        rows={4}
        value={formData[name]}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`${inputClass} resize-none text-sm`}
      />
      <FieldError id={`apply-${name}-error`} message={errors[name]} />
    </div>
  );

  return (
    <div
      id="apply-section"
      className="bg-surface text-ink rounded-msc-lg border border-[rgba(10,42,67,0.08)] shadow-msc-md p-6 md:p-10 max-w-3xl mx-auto w-full font-body text-left"
    >
      <div className="border-b border-[rgba(10,42,67,0.08)] pb-6 mb-8">
        <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight text-teal-deep mb-2">
          Apply
        </h2>
        <p className="text-sm text-muted">
          Role: <span className="text-teal-mid font-bold">{jobTitle}</span>
        </p>

        {/* Slim two-step progress indicator */}
        <div className="mt-6">
          <div className="flex justify-between text-[0.7rem] font-bold text-muted mb-2.5 uppercase tracking-wider">
            <span>Step {currentStep} of {STEPS.length}</span>
            <span className="text-teal-mid">{STEPS[currentStep - 1].name}</span>
          </div>
          <div className="h-1.5 w-full bg-teal-pale rounded-pill overflow-hidden">
            <div
              className="h-full bg-teal-mid transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* STEP 1 — CONTACT DETAILS */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {textField("full_name", "Full Name", { required: true, placeholder: "Rohan Sharma", autoComplete: "name" })}
              {textField("email", "Email Address", { required: true, type: "email", placeholder: "rohan@gmail.com", autoComplete: "email" })}
              {textField("phone", "Phone Number", { required: true, type: "tel", placeholder: "+91 9876543210", autoComplete: "tel" })}
              {textField("whatsapp", "WhatsApp Number", { type: "tel", placeholder: "+91 9876543210" })}
              {textField("city", "City", { required: true, placeholder: "New Delhi", autoComplete: "address-level2" })}
              {textField("state", "State", { required: true, placeholder: "Delhi", autoComplete: "address-level1" })}
              {textField("country", "Country", { required: true, autoComplete: "country-name" })}
            </div>

            <OptionalGroup title="A bit more about you">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="apply-gender" className={labelClass}>Gender</label>
                  <select
                    id="apply-gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="" disabled>Select Gender...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {textField("dob", "Date of Birth", { type: "date", autoComplete: "bday" })}
              </div>
              <div>
                <label htmlFor="apply-address" className={labelClass}>Address</label>
                <textarea
                  id="apply-address"
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street address, college hostel room, etc..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </OptionalGroup>
          </div>
        )}

        {/* STEP 2 — BACKGROUND & SUBMIT */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                {textField("university", "University / Board", { required: true, placeholder: "Delhi University" })}
              </div>
              {textField("college", "College Name", { placeholder: "Hansraj College" })}
              {textField("degree", "Degree / Qualification", { placeholder: "B.Sc / B.Pharm / B.Tech" })}
              {textField("course", "Course / Specialization", { placeholder: "Biotechnology / Microbiology" })}
              <div>
                <label htmlFor="apply-current_year" className={labelClass}>Current Year of Study</label>
                <select
                  id="apply-current_year"
                  name="current_year"
                  value={formData.current_year}
                  onChange={handleInputChange}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="" disabled>Select Year...</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate (1st Year)">Postgraduate (1st Year)</option>
                  <option value="Postgraduate (2nd Year)">Postgraduate (2nd Year)</option>
                </select>
              </div>
              <div>
                <label htmlFor="apply-graduation_year" className={labelClass}>Expected Graduation Year</label>
                <select
                  id="apply-graduation_year"
                  name="graduation_year"
                  value={formData.graduation_year}
                  onChange={handleInputChange}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="" disabled>Select Year...</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                </select>
              </div>
            </div>

            {/* Resume upload — required */}
            <div className="p-6 bg-canvas border border-dashed border-[rgba(10,42,67,0.15)] rounded-msc-md flex flex-col items-start gap-1.5">
              <span className="text-sm font-bold text-teal-deep">
                Resume / CV <span aria-hidden="true">*</span>
              </span>
              <span className="text-xs text-muted mb-3">PDF, DOC, or DOCX — max 5MB.</span>

              <label className="cursor-pointer inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-[rgba(10,42,67,0.15)] bg-surface px-5 py-2.5 text-[0.8rem] font-bold text-teal-deep transition-colors hover:border-teal-mid hover:text-teal-mid focus-within:outline focus-within:outline-2 focus-within:outline-teal-mid">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, setResumeFile, "resume")}
                  className="sr-only"
                />
                Choose file
              </label>

              {resumeFile && (
                <div className="mt-3 flex items-center gap-2 text-xs bg-teal-pale border border-teal-mid/15 px-3.5 py-2 rounded-msc text-teal-mid font-bold">
                  <span>{resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    aria-label="Remove selected resume file"
                    className="text-danger font-extrabold hover:opacity-70 ml-1 px-1"
                  >
                    ×
                  </button>
                </div>
              )}
              <FieldError id="apply-resume-error" message={errors.resume} />
            </div>

            <OptionalGroup title="Experience & leadership">
              <div>
                <label htmlFor="apply-previous_internship" className={labelClass}>Previous Internship Experience</label>
                <textarea
                  id="apply-previous_internship"
                  name="previous_internship"
                  rows={3}
                  value={formData.previous_internship}
                  onChange={handleInputChange}
                  placeholder="Roles, company/lab names, duration, and key things you did..."
                  className={`${inputClass} resize-none text-sm`}
                />
              </div>
              <div>
                <label htmlFor="apply-leadership_experience" className={labelClass}>Campus Leadership Experience</label>
                <textarea
                  id="apply-leadership_experience"
                  name="leadership_experience"
                  rows={3}
                  value={formData.leadership_experience}
                  onChange={handleInputChange}
                  placeholder="Student coordinator, rep, group lead — how you led or coordinated..."
                  className={`${inputClass} resize-none text-sm`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {textField("clubs", "College Clubs / Societies", { placeholder: "Rotaract, Placement Cell..." })}
                {textField("volunteer_work", "Volunteer Work", { placeholder: "NGO work, community drives..." })}
                {textField("event_experience", "Event Management", { placeholder: "College fests, seminars..." })}
              </div>
              {textField("cgpa", "CGPA / Percentage", { placeholder: "8.5 CGPA or 85%" })}
            </OptionalGroup>

            <OptionalGroup title="Skills">
              <fieldset>
                <legend className="text-xs text-muted mb-3">Select the skills you feel confident in:</legend>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SKILL_OPTIONS.map(skill => {
                    const isChecked = (formData.skills || []).includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => handleSkillChange(skill)}
                        aria-pressed={isChecked}
                        className={`min-h-[44px] px-3.5 py-2.5 text-xs md:text-[0.8rem] font-bold rounded-msc text-left border transition-all flex items-center justify-between gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-mid ${
                          isChecked
                            ? "bg-teal-pale border-teal-mid/40 text-teal-mid"
                            : "bg-surface border-[rgba(10,42,67,0.15)] text-muted hover:border-teal-mid/40 hover:text-teal-deep"
                        }`}
                      >
                        <span>{skill}</span>
                        {isChecked && <span aria-hidden="true">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </OptionalGroup>

            <OptionalGroup title="Online presence">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {textField("linkedin", "LinkedIn Profile URL", { type: "url", placeholder: "https://linkedin.com/in/username" })}
                {textField("instagram", "Instagram Profile URL", { type: "url", placeholder: "https://instagram.com/username" })}
                {textField("portfolio", "Portfolio Website URL", { type: "url", placeholder: "https://myportfolio.com" })}
                {textField("github", "GitHub URL", { type: "url", placeholder: "https://github.com/username" })}
              </div>
            </OptionalGroup>

            <OptionalGroup title="Tell us more">
              {essayField("why_join", "Why do you want to join MedSkills Catalyst?", "Explain why this mission excites you and what you hope to achieve...")}
              {essayField("leadership_story", "Describe a leadership experience you had", "Share a situation where you took the initiative, solved a problem, or guided others...")}
              {essayField("promotion_plan", "How would you promote MedSkills Catalyst in your college?", "Give 2-3 specific ideas (e.g., WhatsApp groups, placement cells, professors, events)...")}
            </OptionalGroup>

            <OptionalGroup title="Supporting documents">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Certificates", file: certFile, setter: setCertFile, errKey: "cert", accept: ".pdf,.jpg,.jpeg,.png" },
                  { label: "Portfolio File", file: portFile, setter: setPortFile, errKey: "port", accept: ".pdf,.jpg,.jpeg,.png,.zip" },
                  { label: "Achievements", file: achFile, setter: setAchievementsFile, errKey: "ach", accept: ".pdf,.jpg,.jpeg,.png" }
                ].map(({ label, file, setter, errKey, accept }) => (
                  <div key={errKey} className="p-4 bg-surface border border-[rgba(10,42,67,0.08)] rounded-msc-md flex flex-col items-start gap-2">
                    <span className="text-xs font-bold text-teal-deep">{label}</span>
                    <label className="cursor-pointer inline-flex min-h-[36px] items-center rounded-pill border border-[rgba(10,42,67,0.15)] bg-canvas px-4 py-1.5 text-[0.7rem] font-bold text-teal-deep transition-colors hover:border-teal-mid hover:text-teal-mid focus-within:outline focus-within:outline-2 focus-within:outline-teal-mid">
                      <input
                        type="file"
                        accept={accept}
                        onChange={(e) => handleFileChange(e, setter, errKey)}
                        className="sr-only"
                      />
                      Add file
                    </label>
                    {file && <span className="text-[0.7rem] text-teal-mid truncate max-w-full font-bold">✓ {file.name}</span>}
                    <FieldError id={`apply-${errKey}-error`} message={errors[errKey]} />
                  </div>
                ))}
              </div>
            </OptionalGroup>

            {/* Declaration */}
            <div className="space-y-4 bg-canvas border border-[rgba(10,42,67,0.08)] p-6 rounded-msc-md">
              <label className="flex items-start gap-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="certify_accuracy"
                  checked={formData.certify_accuracy}
                  onChange={handleInputChange}
                  aria-describedby={errors.certify_accuracy ? "apply-certify-error" : undefined}
                  className="mt-1 h-5 w-5 rounded border-[rgba(10,42,67,0.3)] text-teal-mid focus:ring-teal-mid cursor-pointer"
                />
                <span className="text-sm text-ink/80 leading-relaxed select-none">
                  I certify that all information provided in this application is accurate and true to the best of my knowledge. <span aria-hidden="true">*</span>
                </span>
              </label>
              <FieldError id="apply-certify-error" message={errors.certify_accuracy} />

              <label className="flex items-start gap-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="agree_updates"
                  checked={formData.agree_updates}
                  onChange={handleInputChange}
                  className="mt-1 h-5 w-5 rounded border-[rgba(10,42,67,0.3)] text-teal-mid focus:ring-teal-mid cursor-pointer"
                />
                <span className="text-sm text-ink/80 leading-relaxed select-none">
                  I agree to receive application status updates, interview schedules, and recruitment updates from MedSkills Catalyst on my email and WhatsApp number.
                </span>
              </label>
            </div>

            {submitError && (
              <div role="alert" className="p-4 bg-danger/5 border border-danger/20 text-danger rounded-msc text-sm font-bold">
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* NAVIGATION ACTIONS */}
        <div className="flex flex-col gap-4 border-t border-[rgba(10,42,67,0.08)] pt-6 mt-8">
          <div className="flex justify-between items-center gap-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="inline-flex min-h-[44px] items-center rounded-pill border border-[rgba(10,42,67,0.15)] bg-surface px-6 py-2.5 text-sm font-bold text-teal-deep transition-all hover:-translate-y-px hover:shadow-msc-sm disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-mid"
              >
                Back
              </button>
            ) : (
              <span />
            )}

            {currentStep < STEPS.length ? (
              <button type="button" onClick={handleNext} className={btnPrimary}>
                Continue <BtnChip />
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting} className={`${btnPrimary} disabled:opacity-60 disabled:hover:translate-y-0`}>
                {isSubmitting ? "Submitting..." : "Apply"} {!isSubmitting && <BtnChip />}
              </button>
            )}
          </div>
          <p className="text-center text-[0.8rem] text-muted">
            Takes ~3 minutes. We reply on WhatsApp within a few days.
          </p>
        </div>
      </form>
    </div>
  );
}
