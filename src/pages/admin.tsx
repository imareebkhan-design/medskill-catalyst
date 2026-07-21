import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

/* ============================================================================
   MedSkills Catalyst — Leads & Invoices CRM Dashboard
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

interface InvoiceItem {
  id?: string;
  description: string;
  hsn: string;
  quantity: number;
  rate: number;
  amount?: number;
}

interface Invoice {
  id: string;
  invoice_no: string;
  created_at: string;
  lead_id: number | null;
  bill_name: string;
  bill_company: string | null;
  bill_email: string | null;
  bill_phone: string | null;
  bill_gstin: string | null;
  bill_address: string | null;
  bill_state: string | null;
  issue_date: string;
  due_date: string | null;
  tax_rate: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: string;
  notes: string | null;
  invoice_items?: InvoiceItem[];
}

const PLACEHOLDERS = new Set(["n/a", "na", "none", "-", "undefined", "null"]);

function clean(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim();
  if (!s || PLACEHOLDERS.has(s.toLowerCase())) return "";
  return s;
}

function field(lead: Lead, key: string): string {
  const top = clean((lead as unknown as Record<string, unknown>)[key]);
  if (top) return top;
  return clean(lead.extra?.[key]);
}

function firstOf(lead: Lead, ...keys: string[]): string {
  for (const k of keys) {
    const v = field(lead, k);
    if (v) return v;
  }
  return "";
}

function isPartial(lead: Lead): boolean {
  return !!lead.email && lead.email.endsWith("@partial.medskillscatalyst.com");
}

type LeadSource = "qa" | "website" | "other";

const SOURCE_LABELS: Record<LeadSource, string> = {
  qa: "Q&A Page",
  website: "Website",
  other: "Other Pages",
};

function sourceOf(lead: Lead): LeadSource {
  if (lead.form_type === "qa_session") return "qa";
  if (field(lead, "source") === "Q&A Registration") return "qa";
  const path = field(lead, "landing_page");
  if (path.includes("qnaregistration")) return "qa";
  if (path === "/" || path === "/index.html") return "website";
  return "other";
}

function userTypeOf(lead: Lead): "student" | "professional" | "" {
  const raw = firstOf(lead, "user_type", "category").toLowerCase();
  if (raw.includes("student")) return "student";
  if (raw.includes("professional")) return "professional";
  return "";
}

function contactOf(lead: Lead) {
  const partial = isPartial(lead);
  return {
    phone: field(lead, "mobile"),
    secondary: firstOf(lead, "secondary_mobile", "alt_mobile", "alternate_phone", "phone2"),
    email: partial ? "" : field(lead, "email"),
    emailPending: partial,
    city: field(lead, "city"),
  };
}

function professionalOf(lead: Lead) {
  return {
    organization: firstOf(lead, "company_name", "organization"),
    role: firstOf(lead, "current_role", "job_title"),
    experience: field(lead, "experience"),
  };
}

function educationOf(lead: Lead) {
  return {
    institute: firstOf(lead, "college_name", "institute"),
    degree: firstOf(lead, "degree", "course"),
    year: firstOf(lead, "current_year", "graduation_year"),
  };
}

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

function todayISO(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(n || 0);
}

function initialsOf(name: string): string {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

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

function Stat({ label, value, accent, hint }: { label: string; value: string | number; accent: string; hint?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 backdrop-blur-sm">
      <div className={`absolute -right-6 -top-10 h-24 w-24 rounded-full blur-2xl ${accent}`} />
      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-white">{value}</p>
        {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

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

export default function AdminDashboard() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Tab toggling
  const [activeTab, setActiveTab] = useState<"leads" | "invoices">("leads");
  
  // Search / Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  
  // Record Drawer
  const [selected, setSelected] = useState<Lead | null>(null);

  // Invoice builder modal state
  const [showInvModal, setShowInvModal] = useState(false);
  const [invLead, setInvLead] = useState<Lead | null>(null);
  const [invError, setInvError] = useState("");
  const [generatingInv, setGeneratingInv] = useState(false);
  
  const [invForm, setInvForm] = useState({
    bill_name: "",
    bill_company: "",
    bill_email: "",
    bill_phone: "",
    bill_gstin: "",
    bill_state: "",
    bill_address: "",
    issue_date: "",
    due_date: "",
    tax_rate: 18,
    notes: "",
    create_lead: false,
  });
  
  const [invItems, setInvItems] = useState<InvoiceItem[]>([
    { description: "", hsn: "9983", quantity: 1, rate: 0 }
  ]);
  
  const [leadSearchText, setLeadSearchText] = useState("");
  const [showLeadSuggestions, setShowLeadSuggestions] = useState(false);

  const fetchInvoices = async (pass: string) => {
    try {
      const res = await fetch(`/api/invoices?passcode=${encodeURIComponent(pass)}`);
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch (err) {
      console.error("[Invoices] fetch failure:", err);
    }
  };

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
        localStorage.setItem("msc_pass", passcode);
        fetchInvoices(passcode);
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
        .then((data) => {
          setLeads(data);
          setIsAuthenticated(true);
          localStorage.setItem("msc_pass", savedPasscode);
          fetchInvoices(savedPasscode);
        })
        .catch(() => sessionStorage.removeItem("msc_admin_passcode"))
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("msc_admin_passcode");
    localStorage.removeItem("msc_pass");
    setIsAuthenticated(false);
    setPasscode("");
    setLeads([]);
    setInvoices([]);
    setSelected(null);
  };

  const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === invoiceId ? data.invoice : inv))
        );
      } else {
        const errorData = await res.json();
        alert(`Failed to update status: ${errorData.error}`);
      }
    } catch (err) {
      console.error("[Invoices] update status error:", err);
      alert("Network error updating status.");
    }
  };

  // Autocomplete suggestions for invoice lead selection
  const leadSuggestions = leadSearchText.trim()
    ? leads.filter((l) => {
        const query = leadSearchText.toLowerCase();
        return (
          l.full_name.toLowerCase().includes(query) ||
          (l.email && l.email.toLowerCase().includes(query)) ||
          (l.mobile && l.mobile.includes(query))
        );
      }).slice(0, 5)
    : [];

  const handleSelectLeadSuggestion = (lead: Lead) => {
    setInvLead(lead);
    setLeadSearchText("");
    setShowLeadSuggestions(false);
    
    const c = contactOf(lead);
    const p = professionalOf(lead);
    const e = educationOf(lead);
    
    setInvForm((prev) => ({
      ...prev,
      bill_name: lead.full_name || "",
      bill_company: p.organization || e.institute || "",
      bill_email: c.emailPending ? "" : c.email || "",
      bill_phone: c.phone || "",
    }));
  };

  const openInvoiceModal = (lead: Lead | null) => {
    setInvLead(lead);
    setLeadSearchText("");
    setShowLeadSuggestions(false);
    setInvError("");
    
    const c = lead ? contactOf(lead) : null;
    const p = lead ? professionalOf(lead) : null;
    const e = lead ? educationOf(lead) : null;
    
    setInvForm({
      bill_name: lead?.full_name || "",
      bill_company: lead ? (p?.organization || e?.institute || "") : "",
      bill_email: lead ? (c?.emailPending ? "" : c?.email || "") : "",
      bill_phone: lead ? (c?.phone || "") : "",
      bill_gstin: "",
      bill_state: "",
      bill_address: "",
      issue_date: todayISO(),
      due_date: "",
      tax_rate: 18,
      notes: "",
      create_lead: false,
    });
    setInvItems([
      { description: "", hsn: "9983", quantity: 1, rate: 0 }
    ]);
    setShowInvModal(true);
  };

  const closeInvoiceModal = () => {
    setShowInvModal(false);
  };

  const addInvItemRow = () => {
    setInvItems((prev) => [...prev, { description: "", hsn: "9983", quantity: 1, rate: 0 }]);
  };

  const removeInvItemRow = (index: number) => {
    if (invItems.length > 1) {
      setInvItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateInvItem = (index: number, key: keyof InvoiceItem, val: any) => {
    setInvItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return { ...item, [key]: val };
      })
    );
  };

  const getSubtotal = () => {
    return invItems.reduce((acc, it) => {
      const q = Number(it.quantity) || 0;
      const r = Number(it.rate) || 0;
      return acc + (q * r);
    }, 0);
  };

  const getTax = () => {
    const sub = getSubtotal();
    return (sub * (Number(invForm.tax_rate) || 0)) / 100;
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvError("");
    
    const name = invForm.bill_name.trim();
    if (!name) {
      setInvError("Buyer name is required.");
      return;
    }
    
    const validItems = invItems
      .map((it) => ({
        description: it.description.trim(),
        hsn: it.hsn.trim() || "9983",
        quantity: Number(it.quantity) || 0,
        rate: Number(it.rate) || 0,
      }))
      .filter((it) => it.description !== "");
      
    if (validItems.length === 0) {
      setInvError("Add at least one line item with a description.");
      return;
    }
    
    setGeneratingInv(true);
    
    try {
      let resolvedLeadId = invLead ? invLead.id : null;
      
      // Auto-create lead if checked, email provided, and lead doesn't exist
      if (!resolvedLeadId && invForm.create_lead && invForm.bill_email.trim()) {
        const email = invForm.bill_email.trim();
        const existingLead = leads.find((l) => l.email?.toLowerCase() === email.toLowerCase());
        
        if (existingLead) {
          resolvedLeadId = existingLead.id;
        } else {
          const regRes = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              full_name: name,
              email: email,
              mobile: invForm.bill_phone.trim(),
              form_type: "counseling",
              background: "other",
              landing_page: "/admin-crm-invoice-builder",
            }),
          });
          
          if (regRes.ok) {
            const refreshRes = await fetch(`/api/leads?passcode=${encodeURIComponent(passcode)}`);
            if (refreshRes.ok) {
              const freshLeads = await refreshRes.json();
              setLeads(freshLeads);
              const newLead = freshLeads.find((l: any) => l.email?.toLowerCase() === email.toLowerCase());
              if (newLead) {
                resolvedLeadId = newLead.id;
              }
            }
          }
        }
      }
      
      const payload = {
        lead_id: resolvedLeadId,
        bill_name: name,
        bill_company: invForm.bill_company.trim(),
        bill_email: invForm.bill_email.trim(),
        bill_phone: invForm.bill_phone.trim(),
        bill_gstin: invForm.bill_gstin.trim(),
        bill_state: invForm.bill_state.trim(),
        bill_address: invForm.bill_address.trim(),
        issue_date: invForm.issue_date || undefined,
        due_date: invForm.due_date || null,
        tax_rate: Number(invForm.tax_rate) || 0,
        notes: invForm.notes.trim(),
        items: validItems,
      };
      
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setInvError(data.error || `Error ${res.status}`);
        return;
      }
      
      setInvoices((prev) => [data, ...prev]);
      localStorage.setItem("msc_invoice", JSON.stringify(data));
      window.open("/invoice", "_blank");
      setShowInvModal(false);
      
    } catch (err) {
      console.error("[Invoices] submit error:", err);
      setInvError("Network error generating invoice.");
    } finally {
      setGeneratingInv(false);
    }
  };

  /* --- Filtering Logic --------------------------------------------------- */

  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase().trim();
    const hay = [
      lead.full_name, lead.email, lead.mobile, field(lead, "city"),
      professionalOf(lead).organization, educationOf(lead).institute,
    ].map((v) => String(v ?? "").toLowerCase()).join(" ");
    const matchesSearch = !q || hay.includes(q);
    const matchesFilter = filterType === "all" || userTypeOf(lead) === filterType;
    const matchesSource = filterSource === "all" || sourceOf(lead) === filterSource;
    return matchesSearch && matchesFilter && matchesSource;
  });

  const filteredInvoices = invoices.filter((inv) => {
    const q = invoiceSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const hay = [
      inv.invoice_no, inv.bill_name, inv.bill_email, inv.bill_phone, inv.bill_company, inv.status,
    ].map((v) => String(v ?? "").toLowerCase()).join(" ");
    return hay.includes(q);
  });

  const sourceCounts: Record<LeadSource, number> = {
    qa: leads.filter((l) => sourceOf(l) === "qa").length,
    website: leads.filter((l) => sourceOf(l) === "website").length,
    other: leads.filter((l) => sourceOf(l) === "other").length,
  };
  const totalStudents = leads.filter((l) => userTypeOf(l) === "student").length;
  const totalProfessionals = leads.filter((l) => userTypeOf(l) === "professional").length;

  const revenuePaid = invoices.filter(i => i.status === 'paid').reduce((acc, i) => acc + Number(i.total), 0);
  const revenuePending = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((acc, i) => acc + Number(i.total), 0);

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

  const leadInvoices = selected
    ? invoices.filter(
        (inv) => inv.lead_id === Number(selected.id) || (inv.bill_email && inv.bill_email.toLowerCase() === selected.email?.toLowerCase())
      )
    : [];

  /* --- Login Page -------------------------------------------------------- */

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

  /* --- Dashboard View ---------------------------------------------------- */

  return (
    <div className="min-h-screen bg-brand-navy font-body text-slate-100">
      <Head><title>{activeTab === "leads" ? "Leads CRM" : "Invoice Dashboard"} — MedSkills Catalyst</title></Head>

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
              Internal CRM
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              {activeTab === "leads"
                ? `${leads.length} leads · showing ${filteredLeads.length}`
                : `${invoices.length} invoices · showing ${filteredInvoices.length}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/careers"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Careers Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="mt-6 flex border-b border-white/[0.07]">
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition ${
              activeTab === "leads"
                ? "border-brand-cyan text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Leads ({leads.length})
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition ${
              activeTab === "invoices"
                ? "border-brand-cyan text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Invoices ({invoices.length})
          </button>
        </div>

        {activeTab === "leads" ? (
          /* --- LEADS VIEW --- */
          <>
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

            {/* Leads Table */}
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
                            <td className="px-5 py-4">
                              <div className="flex flex-col items-start gap-1.5">
                                <Pill tone={src}>{SOURCE_LABELS[src]}</Pill>
                                <Pill tone={ut || "unknown"}>
                                  {ut === "student" ? "Student" : ut === "professional" ? "Professional" : "Unknown"}
                                </Pill>
                              </div>
                            </td>
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
          </>
        ) : (
          /* --- INVOICES VIEW --- */
          <>
            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
              <Stat label="Total Invoices" value={invoices.length} accent="bg-brand-blue/40" />
              <Stat label="Paid Invoices" value={invoices.filter(i => i.status === 'paid').length} accent="bg-emerald-500/25" />
              <Stat label="Draft / Unpaid" value={invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length} accent="bg-amber-500/25" />
              <Stat label="Revenue Collected" value={formatINR(revenuePaid)} accent="bg-brand-cyan/30" />
              <Stat label="Projected Total" value={formatINR(revenuePaid + revenuePending)} accent="bg-sky-500/30" />
            </div>

            {/* Toolbar */}
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">🔍</span>
                <input
                  type="text" value={invoiceSearchQuery} onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  placeholder="Search invoice number, buyer name, email…"
                  className="w-full rounded-xl border border-white/10 bg-brand-navy/60 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan"
                />
              </div>
              <button
                onClick={() => openInvoiceModal(null)}
                className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-brand-blue/80"
              >
                ＋ New Invoice
              </button>
            </div>

            {/* Invoices Table */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              {filteredInvoices.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-4xl">🧾</p>
                  <p className="mt-4 font-medium text-slate-400">No invoices found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-white/[0.07] text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        <th className="px-5 py-4">Invoice No</th>
                        <th className="px-5 py-4">Billed To</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Taxable Value</th>
                        <th className="px-5 py-4">Grand Total</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="align-top transition hover:bg-white/[0.03]">
                          <td className="px-5 py-4 font-semibold text-white">
                            <a href={`/invoice?id=${inv.id}`} target="_blank" rel="noreferrer" className="text-brand-cyan hover:underline">
                              {inv.invoice_no}
                            </a>
                          </td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-semibold text-white">{inv.bill_name}</p>
                              {inv.bill_company && <p className="text-xs text-slate-500">{inv.bill_company}</p>}
                              {inv.bill_email && <p className="text-xs text-slate-500">{inv.bill_email}</p>}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm whitespace-nowrap">
                            {fmtDate(inv.issue_date || inv.created_at).split(",")[0]}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold tabular-nums text-slate-300">
                            {formatINR(inv.subtotal)}
                          </td>
                          <td className="px-5 py-4 text-sm font-bold tabular-nums text-white">
                            {formatINR(inv.total)}
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={inv.status}
                              onChange={(e) => handleStatusUpdate(inv.id, e.target.value)}
                              className={`rounded-lg border border-white/10 bg-brand-navy/60 px-2.5 py-1 text-xs font-bold uppercase transition focus:outline-none focus:ring-1 focus:ring-brand-cyan cursor-pointer ${
                                inv.status === 'paid' ? 'text-emerald-400' :
                                inv.status === 'cancelled' ? 'text-slate-500' :
                                'text-amber-400'
                              }`}
                            >
                              <option value="draft">Draft</option>
                              <option value="sent">Sent</option>
                              <option value="viewed">Viewed</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <a
                              href={`/invoice?id=${inv.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-blue/20 border border-brand-blue/30 px-3 py-1.5 text-xs font-bold text-sky-300 transition hover:bg-brand-blue/30"
                            >
                              Print / View ↗
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Record Drawer */}
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

              {/* CRM Invoice History */}
              <div className="border-t border-white/[0.07] pt-5 mt-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-cyan/70">Invoice History</h4>
                  <button
                    onClick={() => openInvoiceModal(selected)}
                    className="rounded-lg bg-brand-blue/20 border border-brand-blue/30 px-2 py-1 text-xs font-bold text-sky-300 hover:bg-brand-blue/30 transition"
                  >
                    ＋ Generate Invoice
                  </button>
                </div>
                {leadInvoices.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-500 italic">No invoices generated yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {leadInvoices.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 text-xs">
                        <div>
                          <p className="font-semibold text-white">{inv.invoice_no}</p>
                          <p className="mt-0.5 text-slate-500">{fmtDate(inv.issue_date || inv.created_at).split(",")[0]}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-200">{formatINR(inv.total)}</p>
                          <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                            inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                            inv.status === 'cancelled' ? 'bg-white/5 text-slate-500' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                        <a
                          href={`/invoice?id=${inv.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-3 text-brand-cyan hover:underline font-bold"
                        >
                          View ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Invoice Builder Modal */}
      {showInvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeInvoiceModal} />
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/[0.07] bg-brand-navy p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
              <h2 className="font-display text-2xl font-semibold text-white">
                {invLead ? `Invoice for ${invLead.full_name}` : "New Invoice Builder"}
              </h2>
              <button onClick={closeInvoiceModal} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="mt-5 space-y-5">
              {/* Autocomplete prefill (Manual builder only) */}
              {!invLead && (
                <div className="relative">
                  <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Import / Pre-fill from CRM Lead
                  </label>
                  <input
                    type="text"
                    value={leadSearchText}
                    onChange={(e) => {
                      setLeadSearchText(e.target.value);
                      setShowLeadSuggestions(true);
                    }}
                    onFocus={() => setShowLeadSuggestions(true)}
                    placeholder="Search by name, email, or mobile..."
                    className="mt-2 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan text-sm"
                  />
                  {showLeadSuggestions && leadSuggestions.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full rounded-xl border border-white/10 bg-brand-navy shadow-xl divide-y divide-white/[0.05] overflow-hidden">
                      {leadSuggestions.map((l) => (
                        <li
                          key={l.id}
                          onClick={() => handleSelectLeadSuggestion(l)}
                          className="px-4 py-2.5 text-sm hover:bg-white/[0.05] cursor-pointer"
                        >
                          <p className="font-semibold text-white">{l.full_name}</p>
                          <p className="text-xs text-slate-500">{l.email || "No email"} · {l.mobile || "No phone"}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Billed To Details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan/80">Billed To (Buyer)</h3>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium">Name / Company *</label>
                    <input
                      type="text" required
                      value={invForm.bill_name}
                      onChange={(e) => setInvForm(prev => ({ ...prev, bill_name: e.target.value }))}
                      placeholder="John Doe / Acme Corp"
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium">Contact Person (Optional)</label>
                    <input
                      type="text"
                      value={invForm.bill_company}
                      onChange={(e) => setInvForm(prev => ({ ...prev, bill_company: e.target.value }))}
                      placeholder="Attn: Jane Doe"
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium">Email</label>
                    <input
                      type="email"
                      value={invForm.bill_email}
                      onChange={(e) => setInvForm(prev => ({ ...prev, bill_email: e.target.value }))}
                      placeholder="buyer@gmail.com"
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium">Phone</label>
                    <input
                      type="text"
                      value={invForm.bill_phone}
                      onChange={(e) => setInvForm(prev => ({ ...prev, bill_phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium">GSTIN/UIN</label>
                    <input
                      type="text"
                      value={invForm.bill_gstin}
                      onChange={(e) => setInvForm(prev => ({ ...prev, bill_gstin: e.target.value }))}
                      placeholder="09AABCC1234D1ZF"
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium">State (with code)</label>
                    <input
                      type="text"
                      value={invForm.bill_state}
                      onChange={(e) => setInvForm(prev => ({ ...prev, bill_state: e.target.value }))}
                      placeholder="Uttar Pradesh (Code 09)"
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-500 font-medium">Address</label>
                    <textarea
                      value={invForm.bill_address}
                      onChange={(e) => setInvForm(prev => ({ ...prev, bill_address: e.target.value }))}
                      placeholder="Flat, Street, Area, City, PIN Code"
                      rows={2}
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium">Invoice Date</label>
                  <input
                    type="date" required
                    value={invForm.issue_date}
                    onChange={(e) => setInvForm(prev => ({ ...prev, issue_date: e.target.value }))}
                    className="mt-1 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={invForm.due_date}
                    onChange={(e) => setInvForm(prev => ({ ...prev, due_date: e.target.value }))}
                    className="mt-1 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-brand-cyan text-sm"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cyan/80">Line Items</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.07] text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="pb-2 w-[45%]">Particulars (title/subtitle)</th>
                        <th className="pb-2 w-[15%]">HSN/SAC</th>
                        <th className="pb-2 w-[10%]">Qty</th>
                        <th className="pb-2 w-[15%]">Rate (₹)</th>
                        <th className="pb-2 w-[15%] text-right">Amount</th>
                        <th className="pb-2 w-[5%]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {invItems.map((item, index) => (
                        <tr key={index} className="align-top">
                          <td className="py-2.5 pr-2">
                            <textarea
                              required
                              value={item.description}
                              onChange={(e) => updateInvItem(index, "description", e.target.value)}
                              placeholder="Particulars (Line 1 = Title, Line 2 = Subtitle)"
                              rows={2}
                              className="w-full rounded-lg border border-white/10 bg-brand-navy/60 px-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan text-xs resize-none"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="text"
                              value={item.hsn}
                              onChange={(e) => updateInvItem(index, "hsn", e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-brand-navy/60 px-2 py-1.5 text-white text-xs"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="number" min="0" step="1"
                              value={item.quantity}
                              onChange={(e) => updateInvItem(index, "quantity", Number(e.target.value))}
                              className="w-full rounded-lg border border-white/10 bg-brand-navy/60 px-2 py-1.5 text-white text-xs"
                            />
                          </td>
                          <td className="py-2.5 pr-2">
                            <input
                              type="number" min="0" step="0.01"
                              value={item.rate}
                              onChange={(e) => updateInvItem(index, "rate", Number(e.target.value))}
                              placeholder="0.00"
                              className="w-full rounded-lg border border-white/10 bg-brand-navy/60 px-2 py-1.5 text-white text-xs"
                            />
                          </td>
                          <td className="py-2.5 text-right font-semibold tabular-nums text-slate-200 pr-2">
                            {formatINR(Number(item.quantity || 0) * Number(item.rate || 0))}
                          </td>
                          <td className="py-2.5 text-center">
                            {invItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeInvItemRow(index)}
                                className="text-red-400 hover:text-red-300 text-lg"
                              >
                                &times;
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={addInvItemRow}
                  className="mt-3 rounded-lg border border-dashed border-white/15 hover:border-white/35 px-4 py-2 text-xs font-bold text-slate-300 transition"
                >
                  ＋ Add Item Row
                </button>
              </div>

              {/* Calculations & GST */}
              <div className="flex flex-col md:flex-row md:justify-between border-t border-white/[0.07] pt-5 gap-6">
                <div className="flex-1 space-y-4">
                  {!invLead && invForm.bill_email && (
                    <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={invForm.create_lead}
                        onChange={(e) => setInvForm(prev => ({ ...prev, create_lead: e.target.checked }))}
                        className="rounded bg-brand-navy/60 border-white/10 text-brand-cyan focus:ring-0"
                      />
                      <span className="text-slate-300">Create lead record in CRM for this customer</span>
                    </label>
                  )}
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium">Remarks / Payment terms</label>
                    <textarea
                      value={invForm.notes}
                      onChange={(e) => setInvForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Being invoice raised for training fees... (Will appear on invoice)"
                      rows={2}
                      className="mt-1 block w-full rounded-xl border border-white/10 bg-brand-navy/60 px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan text-xs resize-none"
                    />
                  </div>
                </div>

                <div className="w-full md:w-80 space-y-3 bg-white/[0.01] border border-white/[0.05] rounded-2xl p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Taxable Value:</span>
                    <span className="font-semibold text-slate-200">{formatINR(getSubtotal())}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      IGST @ 
                      <input
                        type="number" min="0" step="0.5"
                        value={invForm.tax_rate}
                        onChange={(e) => setInvForm(prev => ({ ...prev, tax_rate: Number(e.target.value) }))}
                        className="w-12 rounded-lg border border-white/10 bg-brand-navy/60 px-1 py-0.5 text-white text-center text-xs focus:outline-none"
                      />
                      %
                    </span>
                    <span className="font-semibold text-slate-200">{formatINR(getTax())}</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 text-base">
                    <span className="font-bold text-white">TOTAL:</span>
                    <span className="font-extrabold text-brand-cyan">{formatINR(getTotal())}</span>
                  </div>
                </div>
              </div>

              {invError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                  ⚠️ {invError}
                </div>
              )}

              <div className="border-t border-white/[0.07] pt-4 flex justify-end gap-3">
                <button
                  type="button" onClick={closeInvoiceModal}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={generatingInv}
                  className="rounded-xl bg-brand-blue px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-brand-blue/80 disabled:opacity-50"
                >
                  {generatingInv ? "Generating…" : "Generate & Print Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
