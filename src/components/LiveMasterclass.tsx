"use client";

import React, { useState } from "react";

interface LiveMasterclassProps {
  isRegistered?: boolean;
  onRegisterSuccess?: () => void;
}

export function LiveMasterclass({ isRegistered = false, onRegisterSuccess }: LiveMasterclassProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "Masterclass Attendee",
          email: "attendee@example.com",
          mobile: "1234567890",
          user_type: "professional",
        }),
      });

      if (response.ok) {
        if (onRegisterSuccess) onRegisterSuccess();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to register.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="masterclass" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        {isRegistered ? (
          <div className="text-center py-12 px-4 flex flex-col items-center justify-center min-h-[250px]">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Registration Complete.</h3>
            <p className="mt-2 text-slate-500">
              Your seat is secured and your MedTech Career Transition Guide is on its way to your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-blue hover:bg-blue/95 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
            >
              {submitting ? "Registering..." : "Reserve Masterclass Seat"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
