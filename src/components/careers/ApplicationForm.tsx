"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ApplicationFormProps {
  jobSlug: string;
  jobTitle: string;
}

const STEPS = [
  { id: 1, name: "Personal Information" },
  { id: 2, name: "Academic Information" },
  { id: 3, name: "Professional Background" },
  { id: 4, name: "Skills" },
  { id: 5, name: "Online Presence" },
  { id: 6, name: "Short Answers" },
  { id: 7, name: "Uploads" },
  { id: 8, name: "Declaration" }
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

  // Validation
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
      if (!formData.degree.trim()) stepErrors.degree = "Degree is required.";
      if (!formData.course.trim()) stepErrors.course = "Course is required.";
      if (!formData.current_year) stepErrors.current_year = "Current year of study is required.";
      if (!formData.graduation_year) stepErrors.graduation_year = "Graduation year is required.";
    }

    if (step === 6) {
      const whyJoinWords = getWordCount(formData.why_join);
      const leadershipWords = getWordCount(formData.leadership_story);
      const promotionWords = getWordCount(formData.promotion_plan);

      if (!formData.why_join.trim()) {
        stepErrors.why_join = "Please answer this question.";
      } else if (whyJoinWords > 300) {
        stepErrors.why_join = `Your response exceeds 300 words (${whyJoinWords} words).`;
      }

      if (!formData.leadership_story.trim()) {
        stepErrors.leadership_story = "Please answer this question.";
      } else if (leadershipWords > 300) {
        stepErrors.leadership_story = `Your response exceeds 300 words (${leadershipWords} words).`;
      }

      if (!formData.promotion_plan.trim()) {
        stepErrors.promotion_plan = "Please answer this question.";
      } else if (promotionWords > 300) {
        stepErrors.promotion_plan = `Your response exceeds 300 words (${promotionWords} words).`;
      }
    }

    if (step === 7) {
      if (!resumeFile) {
        stepErrors.resume = "A PDF, DOC, or DOCX resume file is required.";
      }
    }

    if (step === 8) {
      if (!formData.certify_accuracy) {
        stepErrors.certify_accuracy = "You must certify that the information provided is accurate.";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: document.getElementById("apply-section")?.offsetTop || 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: document.getElementById("apply-section")?.offsetTop || 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateStep(8)) return;

    setIsSubmitting(true);

    try {
      const dataPayload = new FormData();
      
      // Append core text values
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

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        body: dataPayload
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // Clear draft
        localStorage.removeItem(saveKey);
        // Redirect to success route
        router.push(`/careers/success?id=${result.application_id}&role=${encodeURIComponent(jobTitle)}`);
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

  const inputClass = "w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-msc focus:outline-none focus:border-teal-mid focus:ring-4 focus:ring-teal-mid/10 transition-all duration-200 text-white placeholder-slate-600";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2";

  return (
    <div id="apply-section" className="bg-slate-900 text-white rounded-msc-lg border border-slate-800 shadow-[0_16px_40px_rgba(10,42,67,0.12)] p-6 md:p-10 max-w-4xl mx-auto w-full font-body text-left transition-all duration-300">
      <div className="border-b border-white/10 pb-6 mb-8">
        <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">
          Apply for this opening
        </h3>
        <p className="text-sm text-slate-400">
          Role: <span className="text-teal-leg font-bold">{jobTitle}</span>
        </p>

        {/* Progress indicator */}
        <div className="mt-6">
          <div className="flex justify-between text-[0.7rem] font-bold text-slate-400 mb-2.5 uppercase tracking-wider">
            <span>Step {currentStep} of {STEPS.length}</span>
            <span className="text-teal-leg">{STEPS[currentStep - 1].name}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-mid to-teal-leg transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: PERSONAL INFORMATION */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h4 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Personal Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Rohan Sharma"
                  className={inputClass}
                />
                {errors.full_name && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.full_name}</p>}
              </div>

              <div>
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="rohan@gmail.com"
                  className={inputClass}
                />
                {errors.email && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.email}</p>}
              </div>

              <div>
                <label className={labelClass}>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210"
                  className={inputClass}
                />
                {errors.phone && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.phone}</p>}
              </div>

              <div>
                <label className={labelClass}>WhatsApp Number *</label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210"
                  className={inputClass}
                />
                {errors.whatsapp && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.whatsapp}</p>}
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <select
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

              <div>
                <label className={labelClass}>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="New Delhi"
                  className={inputClass}
                />
                {errors.city && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.city}</p>}
              </div>

              <div>
                <label className={labelClass}>State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Delhi"
                  className={inputClass}
                />
                {errors.state && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.state}</p>}
              </div>
            </div>

            <div>
              <label className={labelClass}>Address</label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Street address, college hostel room, etc..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        )}

        {/* STEP 2: ACADEMIC INFORMATION */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Academic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>University / Board *</label>
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleInputChange}
                  placeholder="Delhi University"
                  className={inputClass}
                />
                {errors.university && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.university}</p>}
              </div>

              <div>
                <label className={labelClass}>College Name</label>
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleInputChange}
                  placeholder="Hansraj College"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Degree / Qualification *</label>
                <input
                  type="text"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  placeholder="B.Sc / B.Pharm / B.Tech"
                  className={inputClass}
                />
                {errors.degree && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.degree}</p>}
              </div>

              <div>
                <label className={labelClass}>Course / Specialization *</label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  placeholder="Biotechnology / Microbiology"
                  className={inputClass}
                />
                {errors.course && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.course}</p>}
              </div>

              <div>
                <label className={labelClass}>Current Year of Study *</label>
                <select
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
                {errors.current_year && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.current_year}</p>}
              </div>

              <div>
                <label className={labelClass}>Expected Graduation Year *</label>
                <select
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
                {errors.graduation_year && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.graduation_year}</p>}
              </div>

              <div>
                <label className={labelClass}>CGPA / Percentage</label>
                <input
                  type="text"
                  name="cgpa"
                  value={formData.cgpa}
                  onChange={handleInputChange}
                  placeholder="8.5 CGPA or 85%"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PROFESSIONAL BACKGROUND */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Professional & Leadership Background</h4>
            
            <div>
              <label className={labelClass}>Previous Internship Experience</label>
              <textarea
                name="previous_internship"
                rows={3}
                value={formData.previous_internship}
                onChange={handleInputChange}
                placeholder="Mention any roles, company/lab names, duration, and key things you did..."
                className={`${inputClass} resize-none text-sm`}
              />
            </div>

            <div>
              <label className={labelClass}>Campus Leadership Experience (e.g., student coordinator, rep, group lead)</label>
              <textarea
                name="leadership_experience"
                rows={3}
                value={formData.leadership_experience}
                onChange={handleInputChange}
                placeholder="Describe your role and how you led or coordinated..."
                className={`${inputClass} resize-none text-sm`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClass}>College Clubs / Societies</label>
                <input
                  type="text"
                  name="clubs"
                  value={formData.clubs}
                  onChange={handleInputChange}
                  placeholder="Rotaract, Placement Cell, Science Club..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Volunteer Work</label>
                <input
                  type="text"
                  name="volunteer_work"
                  value={formData.volunteer_work}
                  onChange={handleInputChange}
                  placeholder="NGO work, community drives..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Event Management</label>
                <input
                  type="text"
                  name="event_experience"
                  value={formData.event_experience}
                  onChange={handleInputChange}
                  placeholder="Helped coordinate college fests, seminars..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SKILLS */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Core Skills</h4>
            <p className="text-xs text-slate-400 mb-2">Select the skills you feel confident in:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {SKILL_OPTIONS.map(skill => {
                const isChecked = (formData.skills || []).includes(skill);
                return (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => handleSkillChange(skill)}
                    className={`p-3.5 text-xs md:text-sm font-bold rounded-msc text-left border transition-all flex items-center justify-between ${
                      isChecked
                        ? "bg-teal-mid/10 border-teal-leg text-teal-leg shadow-[0_4px_12px_rgba(74,208,255,0.06)]"
                        : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <span>{skill}</span>
                    {isChecked && <span className="text-teal-leg text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: ONLINE PRESENCE */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Online Presence</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>LinkedIn Profile URL</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/username"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Instagram Profile URL</label>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  placeholder="https://instagram.com/username"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Portfolio Website URL (Optional)</label>
                <input
                  type="url"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleInputChange}
                  placeholder="https://myportfolio.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>GitHub URL (Optional)</label>
                <input
                  type="url"
                  name="github"
                  value={formData.github}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SHORT ANSWER QUESTIONS */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Short Answer Questions</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">Why do you want to join MedSkills Catalyst? *</label>
                <span className={`text-[0.7rem] font-bold ${getWordCount(formData.why_join) > 300 ? "text-red-400" : "text-slate-400"}`}>
                  {getWordCount(formData.why_join)} / 300 words
                </span>
              </div>
              <textarea
                name="why_join"
                rows={4}
                value={formData.why_join}
                onChange={handleInputChange}
                placeholder="Explain why this mission excites you and what you hope to achieve..."
                className={`${inputClass} resize-none text-sm`}
              />
              {errors.why_join && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.why_join}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">Describe a leadership experience you had *</label>
                <span className={`text-[0.7rem] font-bold ${getWordCount(formData.leadership_story) > 300 ? "text-red-400" : "text-slate-400"}`}>
                  {getWordCount(formData.leadership_story)} / 300 words
                </span>
              </div>
              <textarea
                name="leadership_story"
                rows={4}
                value={formData.leadership_story}
                onChange={handleInputChange}
                placeholder="Share a situation where you took the initiative, solved a problem, or guided others..."
                className={`${inputClass} resize-none text-sm`}
              />
              {errors.leadership_story && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.leadership_story}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">How would you promote MedSkills Catalyst in your college? *</label>
                <span className={`text-[0.7rem] font-bold ${getWordCount(formData.promotion_plan) > 300 ? "text-red-400" : "text-slate-400"}`}>
                  {getWordCount(formData.promotion_plan)} / 300 words
                </span>
              </div>
              <textarea
                name="promotion_plan"
                rows={4}
                value={formData.promotion_plan}
                onChange={handleInputChange}
                placeholder="Give 2-3 specific ideas (e.g., WhatsApp groups, placement cells, professors, events)..."
                className={`${inputClass} resize-none text-sm`}
              />
              {errors.promotion_plan && <p className="text-xs text-red-400 mt-1.5 font-bold">⚠️ {errors.promotion_plan}</p>}
            </div>
          </div>
        )}

        {/* STEP 7: UPLOADS */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Required Documents</h4>
            
            {/* Resume Upload */}
            <div className="p-6 bg-slate-950/40 border border-slate-800 border-dashed rounded-msc-lg hover:border-teal-mid hover:bg-slate-850/20 transition-all duration-300 flex flex-col items-center justify-center text-center">
              <span className="text-3xl mb-3">📄</span>
              <span className="text-sm font-bold text-white mb-1">Upload Resume / CV *</span>
              <span className="text-xs text-slate-500 mb-4">Accepted formats: PDF, DOC, DOCX. Max size: 5MB.</span>
              
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 active:bg-slate-900 border border-slate-700/50 rounded-msc text-xs font-bold text-white transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, setResumeFile, "resume")}
                  className="hidden"
                />
                Choose File
              </label>

              {resumeFile && (
                <div className="mt-4 flex items-center gap-2 text-xs bg-teal-mid/10 border border-teal-leg/20 px-3.5 py-2 rounded-msc text-teal-leg font-bold animate-fade-in">
                  <span>📄 {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button type="button" onClick={() => setResumeFile(null)} className="text-red-400 font-extrabold hover:text-red-300 ml-2">×</button>
                </div>
              )}
              {errors.resume && <p className="text-xs text-red-400 mt-2 font-bold">⚠️ {errors.resume}</p>}
            </div>

            {/* Optional Uploads */}
            <div>
              <h5 className="text-sm font-bold text-white mb-4">Supporting Uploads (Optional)</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Certificates */}
                <div className="p-5 bg-slate-950/20 border border-slate-800/80 rounded-xl flex flex-col items-center justify-between text-center gap-2 hover:border-slate-700 transition-colors">
                  <span className="text-lg">🏆</span>
                  <span className="text-xs font-bold text-slate-300">Certificates</span>
                  <label className="cursor-pointer px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-msc text-[0.7rem] font-bold text-white transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, setCertFile, "cert")}
                      className="hidden"
                    />
                    Add File
                  </label>
                  {certFile && <span className="text-[0.65rem] text-teal-leg truncate max-w-full font-bold">✓ {certFile.name}</span>}
                  {errors.cert && <p className="text-[0.65rem] text-red-400 font-bold">⚠️ {errors.cert}</p>}
                </div>

                {/* Portfolio */}
                <div className="p-5 bg-slate-950/20 border border-slate-800/80 rounded-xl flex flex-col items-center justify-between text-center gap-2 hover:border-slate-700 transition-colors">
                  <span className="text-lg">💼</span>
                  <span className="text-xs font-bold text-slate-300">Portfolio File</span>
                  <label className="cursor-pointer px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-msc text-[0.7rem] font-bold text-white transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.zip"
                      onChange={(e) => handleFileChange(e, setPortFile, "port")}
                      className="hidden"
                    />
                    Add File
                  </label>
                  {portFile && <span className="text-[0.65rem] text-teal-leg truncate max-w-full font-bold">✓ {portFile.name}</span>}
                  {errors.port && <p className="text-[0.65rem] text-red-400 font-bold">⚠️ {errors.port}</p>}
                </div>

                {/* Achievements */}
                <div className="p-5 bg-slate-950/20 border border-slate-800/80 rounded-xl flex flex-col items-center justify-between text-center gap-2 hover:border-slate-700 transition-colors">
                  <span className="text-lg">🌟</span>
                  <span className="text-xs font-bold text-slate-300">Achievements</span>
                  <label className="cursor-pointer px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-msc text-[0.7rem] font-bold text-white transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, setAchievementsFile, "ach")}
                      className="hidden"
                    />
                    Add File
                  </label>
                  {achFile && <span className="text-[0.65rem] text-teal-leg truncate max-w-full font-bold">✓ {achFile.name}</span>}
                  {errors.ach && <p className="text-[0.65rem] text-red-400 font-bold">⚠️ {errors.ach}</p>}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* STEP 8: DECLARATION */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Declaration & Submission</h4>
            
            <div className="space-y-4 bg-slate-950/30 border border-slate-800 p-6 rounded-msc-lg">
              <label className="flex items-start gap-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="certify_accuracy"
                  checked={formData.certify_accuracy}
                  onChange={handleInputChange}
                  className="mt-1 h-5 w-5 rounded border-slate-800 bg-slate-950 text-teal-mid focus:ring-teal-leg cursor-pointer"
                />
                <span className="text-sm text-slate-300 leading-relaxed select-none">
                  I hereby certify that all information provided in this application is accurate and true to the best of my knowledge. *
                </span>
              </label>
              {errors.certify_accuracy && <p className="text-xs text-red-400 font-bold">⚠️ {errors.certify_accuracy}</p>}

              <label className="flex items-start gap-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="agree_updates"
                  checked={formData.agree_updates}
                  onChange={handleInputChange}
                  className="mt-1 h-5 w-5 rounded border-slate-800 bg-slate-950 text-teal-mid focus:ring-teal-leg cursor-pointer"
                />
                <span className="text-sm text-slate-300 leading-relaxed select-none">
                  I agree to receive application status updates, interview schedules, and recruitment updates from MedSkills Catalyst on my email and WhatsApp number.
                </span>
              </label>
            </div>

            {submitError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-msc text-sm font-bold animate-fade-in">
                ⚠️ {submitError}
              </div>
            )}
          </div>
        )}

        {/* NAVIGATION ACTIONS */}
        <div className="flex justify-between items-center border-t border-white/10 pt-6 mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 active:bg-slate-900 border border-slate-700/50 text-slate-300 font-bold rounded-msc text-sm transition-all disabled:opacity-50 hover:-translate-y-px"
          >
            ← Back
          </button>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-teal-mid hover:bg-emerald-dark text-white font-bold rounded-msc text-sm shadow-md hover:-translate-y-px transition-all"
            >
              Continue →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-teal-leg hover:bg-cyan-400 text-teal-deep font-extrabold rounded-msc text-sm shadow-lg hover:-translate-y-px transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Submitting Application..." : "Submit Application 🎉"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
