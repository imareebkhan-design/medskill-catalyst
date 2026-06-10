"use client";

import React, { useState } from "react";

interface LeadMagnetProps {
  isRegistered?: boolean;
  onRegisterSuccess?: () => void;
}

export function LeadMagnet({ isRegistered = false, onRegisterSuccess }: LeadMagnetProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "",
    organization: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.name,
          email: formData.email,
          mobile: formData.phone,
          user_type: formData.status === "Student" ? "student" : "professional",
          company_name: formData.status !== "Student" ? formData.organization : "",
          college_name: formData.status === "Student" ? formData.organization : "",
          course: "N/A",
          graduation_year: "2026",
          job_title: "N/A",
          experience: "1-3",
        }),
      });

      if (response.ok) {
        if (onRegisterSuccess) {
          onRegisterSuccess();
        }
        setFormData({
          name: "",
          email: "",
          phone: "",
          status: "",
          organization: "",
        });
      } else {
        const data = await response.json();
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="lead" className="bg-canvas text-ink py-20 px-5 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          
          {/* LEFT COLUMN: COPY REFINEMENT */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Book Mockup Visual */}
              <div className="flex-none">
                <div className="relative w-36 h-48 bg-gradient-to-br from-teal-deep to-teal-mid rounded-lg shadow-2xl flex flex-col justify-between p-4 overflow-hidden border border-white/10 group">
                  {/* Book Spine Effect */}
                  <div className="absolute top-0 left-0 w-2.5 h-full bg-black/10"></div>
                  <div className="absolute top-0 left-2.5 w-[1px] h-full bg-white/20"></div>
                  
                  <span className="text-[0.6rem] font-bold tracking-widest text-teal-leg uppercase self-end">
                    Handbook
                  </span>
                  <h4 className="font-display font-bold text-white text-base leading-tight mt-4">
                    MedTech Career Transition Guide
                  </h4>
                  <span className="text-[0.6rem] font-medium text-white/50 tracking-wider">
                    2026 EDITION
                  </span>
                </div>
              </div>
              
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-teal-deep">
                  Register & Get the Career Transition Guide — Free
                </h2>
                <p className="mt-4 text-base sm:text-lg leading-relaxed text-ink/75">
                  Secure your seat for the live session and we will instantly email you our 28-page playbook covering the highest-paying roles, exact interview questions, and salary negotiation scripts.
                </p>
              </div>
            </div>

            {/* Content Bullet Points */}
            <div className="mt-2 flex flex-col gap-3">
              {[
                "Which MedTech segment is hiring most aggressively right now",
                "How to rewrite your pharma resume for device companies",
                "5 core things top-tier MedTech companies assess you on in interviews",
                "Real salary bands by city, role, and company size"
              ].map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm sm:text-base text-ink/80">
                  <span className="flex-none w-5 h-5 rounded-full bg-teal-pale text-teal-mid flex items-center justify-center font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: THE LEAD CAPTURE FORM */}
          <div className="lg:col-span-5">
            <div className="p-8 shadow-xl rounded-2xl bg-white border border-slate-100">
              {isRegistered ? (
                <div className="text-center py-12 px-4 flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-slate-900">
                    Registration Complete.
                  </h3>
                  <p className="mt-3 text-sm text-slate-500 max-w-sm leading-relaxed">
                    Your seat is secured and your MedTech Career Transition Guide is on its way to your inbox.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                      {error}
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="e.g. Rohan Sharma"
                      value={formData.name}
                      onChange={handleChange}
                      className="border border-slate-200 focus:border-teal-mid focus:ring-1 focus:ring-teal-mid outline-none rounded-xl px-4 py-3 text-sm transition-all duration-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="e.g. rohan@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="border border-slate-200 focus:border-teal-mid focus:ring-1 focus:ring-teal-mid outline-none rounded-xl px-4 py-3 text-sm transition-all duration-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  {/* WhatsApp Number */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="phone" className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="border border-slate-200 focus:border-teal-mid focus:ring-1 focus:ring-teal-mid outline-none rounded-xl px-4 py-3 text-sm transition-all duration-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  {/* Current Status */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="status" className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                      Current Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      required
                      value={formData.status}
                      onChange={handleChange}
                      className="border border-slate-200 focus:border-teal-mid focus:ring-1 focus:ring-teal-mid outline-none rounded-xl px-4 py-3 text-sm transition-all duration-200 bg-slate-50/50 focus:bg-white text-ink/80"
                    >
                      <option value="" disabled>Select status...</option>
                      <option value="Working Professional">Working Professional</option>
                      <option value="Student">Student</option>
                    </select>
                  </div>

                  {/* Current Company / College */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="organization" className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                      Current Company / College
                    </label>
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      required
                      placeholder="e.g. Apex Biotech or Delhi University"
                      value={formData.organization}
                      onChange={handleChange}
                      className="border border-slate-200 focus:border-teal-mid focus:ring-1 focus:ring-teal-mid outline-none rounded-xl px-4 py-3 text-sm transition-all duration-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  {/* CTA Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 bg-teal-mid hover:bg-teal-mid/95 active:bg-teal-deep text-white font-bold py-3.5 px-6 rounded-xl hover:-translate-y-0.5 active:translate-y-0 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {submitting ? "Processing..." : "Register & Send My Free Guide ➔"}
                  </button>

                  {/* Micro-copy */}
                  <p className="text-center text-[0.7rem] text-ink/50 leading-normal">
                    The Zoom link and your PDF guide will be sent directly to your inbox.
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
