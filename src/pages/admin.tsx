import React, { useState, useEffect } from "react";
import Head from "next/head";

/* ============================================================================
   MedSkills Catalyst — Leads CRM
   ----------------------------------------------------------------------------
   The lead forms don't share a schema. Each one posts a different bag of keys,
   and register.ts drops everything it doesn't recognise into the `extra` jsonb
   blob (see supabase/leads-schema.sql). So almost nothing here can be read
   straight off the row — every accessor below has to look top-level first, then
   fall back to `extra`, then reconcile the competing names each form invented.
   That reconciliation is the whole job; the layout is the easy part.
   ========================================================================== */

interface Lead {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  user_type?: string;
  company_name?: string;
  college_name?: string;
  form_type?: string;
  landing_page?: string;
  background?: string;
  consent?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  extra?: Record<string, unknown>;
}

/* --- Field access ---------------------------------------------------------- */

/**
 * index.html hardcodes literal "N/A" (and course/job_title placeholders) into
 * its payload rather than omitting them, so a raw read yields junk that looks
 * like real data. Treat those as absent.
 */
const PLACEHOLDERS = new Set(["n/a", "na", "none", "-", "undefined", "null"]);

function clean(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim();
  if (!s || PLACEHOLDERS.has(s.toLowerCase())) return "";
  return s;
}

/** Read a field from the row, falling back to the `extra` jsonb blob. */
function field(lead: Lead, key: string): string {
  const top = clean((lead as unknown as Record<string, unknown>)[key]);
  if (top) return top;
  return clean(lead.extra?.[key]);
}

/** First non-empty of several competing key names. */
function firstOf(lead: Lead, ...keys: string[]): string {
  for (const k of keys) {
    const v = field(lead, k);
    if (v) return v;
  }
  return "";
}

/* --- Derived views over a lead --------------------------------------------- */

/**
 * The cohort_registration form saves phone-only leads by synthesising an email
 * at @partial.medskillscatalyst.com. Those addresses don't exist — surfacing
 * one as a real contact would get someone to mail a black hole.
 */
function isPartial(lead: Lead): boolean {
  return !!lead.email && lead.email.endsWith("@partial.medskillscatalyst.com");
}

type LeadSource = "qa" | "website" | "other";

const SOURCE_LABELS: Record<LeadSource, string> = {
  qa: "Q&A Page",
  website: "Website",
  other: "Other Pages",
};

/**
 * Q&A is checked by three independent markers so it resolves both for rows the
 * current endpoint writes (form_type "qa_session") and for older rows that only
 * carry extra.source / extra.landing_page — i.e. it works on today's data,
 * without waiting on the backfill.
 */
function sourceOf(lead: Lead): LeadSource {
  if (lead.form_type === "qa_session") return "qa";
  if (field(lead, "source") === "Q&A Registration") return "qa";
  const path = field(lead, "landing_page");
  if (path.includes("qnaregistration")) return "qa";
  if (path === "/" || path === "/index.html") return "website";
  return "other";
}

/**
 * register.ts stores user_type as "student"/"professional"; qa-register stores
 * category as "College Student"/"Working Professional". Normalise both, and
 * return "" rather than guessing when neither is present.
 */
function userTypeOf(lead: Lead): "student" | "professional" | "" {
  const raw = firstOf(lead, "user_type", "category").toLowerCase();
  if (raw.includes("student")) return "student";
  if (raw.includes("professional")) return "professional";
  return "";
}

interface Contact {
  phone: string;
  secondary: string;
  email: string;
  emailPending: boolean;
  city: string;
}

function contactOf(lead: Lead): Contact {
  const partial = isPartial(lead);
  return {
    phone: field(lead, "mobile"),
    // No form collects a second number today. Wired to the names a form would
    // plausibly use so it renders the moment one starts sending it.
    secondary: firstOf(lead, "secondary_mobile", "alt_mobile", "alternate_phone", "phone2"),
    email: partial ? "" : field(lead, "email"),
    emailPending: partial,
    city: field(lead, "city"),
  };
}

interface Professional {
  organization: string;
  role: string;
  experience: string;
}

function professionalOf(lead: Lead): Professional {
  return {
    organization: firstOf(lead, "company_name", "organization"),
    role: firstOf(lead, "current_role", "job_title"),
    experience: field(lead, "experience"),
  };
}

interface Education {
  institute: string;
  degree: string;
  year: string;
}

function educationOf(lead: Lead): Education {
  return {
    institute: firstOf(lead, "college_name", "institute"),
    degree: firstOf(lead, "degree", "course"),
    year: firstOf(lead, "current_year", "graduation_year"),
  };
}

/** Everything not already surfaced in a dedicated section. */
const CLAIMED_KEYS = new Set([
  "user_type", "category", "mobile", "email", "city", "secondary_mobile",
  "alt_mobile", "alternate_phone", "phone2", "company_name", "organization",
  "current_role", "job_title", "experience", "college_name", "institute",
  "degree", "course", "current_year", "graduation_year", "source",
  "landing_page", "utm_source", "utm_medium", "utm_campaign", "full_name",
]);

function otherDetailsOf(lead: Lead): [string, string][] {
  const out: [string, string][] = [];
  const bg = clean(lead.background);
  if (bg) out.push(["Background", bg]);
  for (const [k, v] of Object.entries(lead.extra ?? {})) {
    if (CLAIMED_KEYS.has(k)) continue;
    const val = clean(v);
    if (!val) continue;
    out.push([k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), val]);
  }
  return out;
}

function attributionOf(lead: Lead): [string, string][] {
  const rows: [string, string][] = [
    ["Landing page", field(lead, "landing_page")],
    ["UTM source", field(lead, "utm_source")],
    ["UTM medium", field(lead, "utm_medium")],
    ["UTM campaign", field(lead, "utm_campaign")],
    ["Form type", clean(lead.form_type)],
  ];
  return rows.filter(([, v]) => v);
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata", day: "2-digit", month: "short",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function initialsOf(name: string): string {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/* --- Small presentational pieces ------------------------------------------- */

function Pill({ tone, children }: { tone: "qa" | "website" | "other" | "student" | "professional" | "unknown"; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    qa: "bg-brand-cyan/10 text-brand-cyan ring-brand-cyan/30",
    website: "bg-brand-blue/15 text-sky-300 ring-brand-blue/40",
    other: "bg-white/5 text-slate-400 ring-white/10",
    student: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
    professional: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
    unknown: "bg-white/5 text-slate-500 ring-white/10",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ring-1 ring-inset whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Stat({ label, value, accent, hint }: { label: string; value: number; accent: string; hint?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 backdrop-blur-sm">
      <div className={`absolute -right-6 -top-10 h-24 w-24 rounded-full blur-2xl ${accent}`} />
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-white">{value}</p>
        {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

/** A labelled block inside the record drawer. Renders nothing when empty. */
function Section({ title, rows }: { title: string; rows: [string, string][] }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan/70">{title}</h4>
      <dl className="mt-3 space-y-2.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-4 text-sm">
            <dt className="w-32 shrink-0 text-slate-500">{k}</dt>
            <dd className="min-w-0 break-words font-medium text-slate-200">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* --- Page ------------------------------------------------------------------ */

export default function AdminDashboard() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/leads?passcode=${encodeURIComponent(passcode)}`);
      if (res.ok) {
        setLeads(await res.json());
        setIsAuthenticated(true);
        sessionStorage.setItem("msc_admin_passcode", passcode);
      } else {
        const errorData = await res.json();
        setAuthError(errorData.error || "Invalid passcode. Please try again.");
      }
    } catch {
      setAuthError("Network error. Failed to verify passcode.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedPasscode = sessionStorage.getItem("msc_admin_passcode");
    if (savedPasscode) {
      setPasscode(savedPasscode);
      setLoading(true);
      fetch(`/api/leads?passcode=${encodeURIComponent(savedPasscode)}`)
        .then((res) => { if (res.ok) return res.json(); throw new Error("Stale token"); })
        .then((data) => { setLeads(data); setIsAuthenticated(true); })
        .catch(() => sessionStorage.removeItem("msc_admin_passcode"))
        .finally(() => setLoading(false));
    }
  }, []);

  // Esc closes the record drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("msc_admin_passcode");
    setIsAuthenticated(false);
    setPasscode("");
    setLeads([]);
    setSelected(null);
  };

  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase().trim();
    // `mobile` is nullable in the schema — guard before string methods.
    const hay = [
      lead.full_name, lead.email, lead.mobile, field(lead, "city"),
      professionalOf(lead).organization, educationOf(lead).institute,
    ].map((v) => String(v ?? "").toLowerCase()).join(" ");
    const matchesSearch = !q || hay.includes(q);
    const matchesFilter = filterType === "all" || userTypeOf(lead) === filterType;
    const matchesSource = filterSource === "all" || sourceOf(lead) === filterSource;
    return matchesSearch && matchesFilter && matchesSource;
  });

  const sourceCounts: Record<LeadSource, number> = {
    qa: leads.filter((l) => sourceOf(l) === "qa").length,
    website: leads.filter((l) => sourceOf(l) === "website").length,
    other: leads.filter((l) => sourceOf(l) === "other").length,
  };
  const totalStudents = leads.filter((l) => userTypeOf(l) === "student").length;
  const totalProfessionals = leads.filter((l) => userTypeOf(l) === "professional").length;

  const downloadCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = [
      "ID", "Full Name", "Phone", "Secondary Phone", "Email", "City", "User Type",
      "Source", "Landing Page", "Organization", "Role", "Experience",
      "College / Institute", "Degree / Course", "Year", "Background",
      "UTM Source", "UTM Campaign", "Form Type", "Created At",
    ];
    const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filteredLeads.map((lead) => {
      const c = contactOf(lead), p = professionalOf(lead), e = educationOf(lead);
      return [
        lead.id, q(lead.full_name), q(c.phone), q(c.secondary),
        q(c.emailPending ? "(pending — phone-only lead)" : c.email), q(c.city),
        q(userTypeOf(lead)), q(SOURCE_LABELS[sourceOf(lead)]), q(field(lead, "landing_page")),
        q(p.organization), q(p.role), q(p.experience),
        q(e.institute), q(e.degree), q(e.year), q(clean(lead.background)),
        q(field(lead, "utm_source")), q(field(lead, "utm_campaign")),
        q(clean(lead.form_type)), q(lead.created_at),
      ].join(",");
    });
    const blob = new Blob(["﻿" + [headers.join(","), ...rows].join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medskills_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* --- Login ------------------------------------------------------------- */

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-navy font-body text-slate-100">
        <Head><title>Admin Login — MedSkills Catalyst</title></Head>
        <div className="relative flex min-h-screen flex-col justify-center px-4 py-12">
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-brand-blue/20 blur-[120px]" />
          <div className="relative mx-auto w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cyan/10 text-2xl ring-1 ring-inset ring-brand-cyan/20">
                🛡️
              </div>
              <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-white">
                MedSkills Admin
              </h1>
              <p className="mt-2 text-sm text-slate-400">Secure workspace. Authorized access only.</p>
            </div>
            <div className="mt-8 rounded-3xl border border-white/[0.07] bg-white/[0.03] p-8 shadow-2xl backdrop-blur">
              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="passcode" className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Enter Admin Passcode
                  </label>
                  <input
                    id="passcode" name="passcode" type="password" required
                    value={passcode} onChange={(e) => setPasscode(e.target.value)}
                    placeholder="••••••••••••"
                    className="mt-2 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-3 text-white placeholder-slate-600 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                  />
                </div>
                {authError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                    ⚠️ {authError}
                  </div>
                )}
                <button
                  type="submit" disabled={loading}
                  className="flex w-full justify-center rounded-xl bg-brand-blue px-4 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-brand-blue/80 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 focus:ring-offset-brand-navy disabled:opacity-50"
                >
                  {loading ? "Authenticating…" : "Access Dashboard"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --- Dashboard --------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-brand-navy font-body text-slate-100">
      <Head><title>Leads CRM — MedSkills Catalyst</title></Head>

      {/* Ambient wash — keeps the dark field from reading as flat black */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-brand-blue/10 blur-[140px]" />
        <div className="absolute -right-40 top-1/3 h-[420px] w-[420px] rounded-full bg-brand-cyan/[0.06] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-6 py-8 lg:px-10">
        {/* Top bar */}
        <header className="flex flex-col gap-4 border-b border-white/[0.07] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-cyan/70">
              MedSkills Catalyst
            </p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-white">
              Leads CRM
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              {leads.length} total records · showing {filteredLeads.length}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 md:self-auto"
          >
            Sign Out
          </button>
        </header>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Stat label="Total Leads" value={leads.length} accent="bg-brand-blue/40" />
          <Stat label="Q&A Page" value={sourceCounts.qa} accent="bg-brand-cyan/30" hint="Live Q&A registrations" />
          <Stat label="Website" value={sourceCounts.website} accent="bg-sky-500/30" hint="Homepage forms" />
          <Stat label="Professionals" value={totalProfessionals} accent="bg-emerald-500/25" />
          <Stat label="Students" value={totalStudents} accent="bg-amber-500/25" />
        </div>

        {/* Toolbar */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">🔍</span>
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, phone, city, organization…"
              className="w-full rounded-xl border border-white/10 bg-brand-navy/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan"
            />
          </div>
          <select
            value={filterSource} onChange={(e) => setFilterSource(e.target.value)}
            className="cursor-pointer rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-cyan"
          >
            <option value="all">All Sources ({leads.length})</option>
            <option value="qa">Q&amp;A Page ({sourceCounts.qa})</option>
            <option value="website">Website ({sourceCounts.website})</option>
            <option value="other">Other Pages ({sourceCounts.other})</option>
          </select>
          <select
            value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="cursor-pointer rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-cyan"
          >
            <option value="all">All Types</option>
            <option value="professional">Professionals</option>
            <option value="student">Students</option>
          </select>
          <button
            onClick={downloadCSV} disabled={filteredLeads.length === 0}
            className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-brand-blue/80 disabled:opacity-40"
          >
            Export CSV ({filteredLeads.length})
          </button>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          {filteredLeads.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-4xl">📭</p>
              <p className="mt-4 font-medium text-slate-400">No leads match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/[0.07] text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-5 py-4">Lead</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Segment</th>
                    <th className="px-5 py-4">Professional</th>
                    <th className="px-5 py-4">College / Institute</th>
                    <th className="px-5 py-4">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredLeads.map((lead) => {
                    const c = contactOf(lead);
                    const p = professionalOf(lead);
                    const e = educationOf(lead);
                    const ut = userTypeOf(lead);
                    const src = sourceOf(lead);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelected(lead)}
                        className="cursor-pointer align-top transition hover:bg-white/[0.03]"
                      >
                        {/* Lead — identity only */}
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue/20 text-xs font-bold text-brand-cyan ring-1 ring-inset ring-brand-cyan/20">
                              {initialsOf(lead.full_name)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-white">{lead.full_name}</p>
                              {c.city && <p className="mt-0.5 text-xs text-slate-500">📍 {c.city}</p>}
                            </div>
                          </div>
                        </td>

                        {/* Contact — phone / email / secondary, each on its own line */}
                        <td className="px-5 py-4">
                          <div className="space-y-1 text-sm">
                            {c.phone ? (
                              <p className="flex items-center gap-2 text-slate-200">
                                <span className="text-slate-600">📞</span>{c.phone}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-600">No number</p>
                            )}
                            {c.emailPending ? (
                              <p className="flex items-center gap-2 text-xs text-amber-300/80">
                                <span className="text-slate-600">✉️</span>Pending — phone-only lead
                              </p>
                            ) : c.email ? (
                              <p className="flex items-center gap-2 text-slate-400">
                                <span className="text-slate-600">✉️</span>{c.email}
                              </p>
                            ) : null}
                            {c.secondary && (
                              <p className="flex items-center gap-2 text-slate-400">
                                <span className="text-slate-600">📱</span>{c.secondary}
                                <span className="text-[10px] uppercase tracking-wide text-slate-600">alt</span>
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Segment */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            <Pill tone={src}>{SOURCE_LABELS[src]}</Pill>
                            <Pill tone={ut || "unknown"}>
                              {ut === "student" ? "Student" : ut === "professional" ? "Professional" : "Unknown"}
                            </Pill>
                          </div>
                        </td>

                        {/* Professional */}
                        <td className="px-5 py-4 text-sm">
                          {p.organization || p.role ? (
                            <div>
                              {p.organization && <p className="font-medium text-slate-200">{p.organization}</p>}
                              {p.role && <p className="mt-0.5 text-xs text-slate-500">{p.role}</p>}
                              {p.experience && <p className="mt-0.5 text-xs text-slate-600">{p.experience} yrs exp</p>}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>

                        {/* Education */}
                        <td className="px-5 py-4 text-sm">
                          {e.institute || e.degree ? (
                            <div>
                              {e.institute && <p className="font-medium text-slate-200">{e.institute}</p>}
                              {e.degree && <p className="mt-0.5 text-xs text-slate-500">{e.degree}</p>}
                              {e.year && <p className="mt-0.5 text-xs text-slate-600">{e.year}</p>}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {fmtDate(lead.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-brand-navy shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/[0.07] bg-brand-navy/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue/20 text-sm font-bold text-brand-cyan ring-1 ring-inset ring-brand-cyan/20">
                  {initialsOf(selected.full_name)}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white">{selected.full_name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{fmtDate(selected.created_at)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm text-slate-400 transition hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="space-y-7 px-6 py-6">
              <div className="flex flex-wrap gap-2">
                <Pill tone={sourceOf(selected)}>{SOURCE_LABELS[sourceOf(selected)]}</Pill>
                <Pill tone={userTypeOf(selected) || "unknown"}>
                  {userTypeOf(selected) === "student" ? "Student"
                    : userTypeOf(selected) === "professional" ? "Professional" : "Unknown type"}
                </Pill>
              </div>

              <Section
                title="Contact"
                rows={(() => {
                  const c = contactOf(selected);
                  const r: [string, string][] = [];
                  if (c.phone) r.push(["Number", c.phone]);
                  r.push(["Email ID", c.emailPending ? "Pending — phone-only lead" : c.email || "—"]);
                  if (c.secondary) r.push(["Secondary number", c.secondary]);
                  if (c.city) r.push(["City", c.city]);
                  return r;
                })()}
              />
              <Section
                title="Professional"
                rows={(() => {
                  const p = professionalOf(selected);
                  const r: [string, string][] = [];
                  if (p.organization) r.push(["Organization", p.organization]);
                  if (p.role) r.push(["Role", p.role]);
                  if (p.experience) r.push(["Experience", `${p.experience} yrs`]);
                  return r;
                })()}
              />
              <Section
                title="College / Education"
                rows={(() => {
                  const e = educationOf(selected);
                  const r: [string, string][] = [];
                  if (e.institute) r.push(["Institute", e.institute]);
                  if (e.degree) r.push(["Degree / Course", e.degree]);
                  if (e.year) r.push(["Year", e.year]);
                  return r;
                })()}
              />
              <Section title="Other Details" rows={otherDetailsOf(selected)} />
              <Section title="Attribution" rows={attributionOf(selected)} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
