"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";

interface Application {
  id: string;
  application_id: string;
  created_at: string;
  job_slug: string;
  status: string;
  internal_notes: string | null;
  reviewer: string | null;

  // Personal Info
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  gender: string | null;
  dob: string | null;
  city: string;
  state: string;
  country: string;
  address: string | null;

  // Academic Info
  university: string;
  college: string | null;
  degree: string | null;
  course: string | null;
  current_year: string | null;
  graduation_year: string | null;
  cgpa: string | null;

  // Professional Background
  previous_internship: string | null;
  leadership_experience: string | null;
  clubs: string | null;
  volunteer_work: string | null;
  event_experience: string | null;

  // Skills & Online Presence
  skills: string[];
  linkedin: string | null;
  instagram: string | null;
  portfolio: string | null;
  github: string | null;

  // Answers
  why_join: string | null;
  leadership_story: string | null;
  promotion_plan: string | null;

  // Uploads
  resume_url: string;
  certificates_url: string | null;
  portfolio_url: string | null;
  achievements_url: string | null;

  // Metadata
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer_url: string | null;
  device: string | null;
  browser: string | null;
}

const STATUSES = ["New", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"];

export default function CareersAdminDashboard() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Edit fields for selected application
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editReviewer, setEditReviewer] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchApplications = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/careers/admin?passcode=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
        setIsAuthenticated(true);
        sessionStorage.setItem("msc_admin_passcode", code);
      } else {
        const errorData = await res.json();
        setAuthError(errorData.error || "Invalid passcode.");
        sessionStorage.removeItem("msc_admin_passcode");
      }
    } catch (err) {
      setAuthError("Failed to communicate with administration server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    fetchApplications(passcode);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("msc_admin_passcode");
    if (saved) {
      setPasscode(saved);
      fetchApplications(saved);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("msc_admin_passcode");
    setIsAuthenticated(false);
    setPasscode("");
    setApplications([]);
    setSelectedApp(null);
  };

  const openAppDetails = (app: Application) => {
    setSelectedApp(app);
    setEditStatus(app.status);
    setEditNotes(app.internal_notes || "");
    setEditReviewer(app.reviewer || "");
  };

  const handleUpdateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setUpdateLoading(true);
    try {
      const res = await fetch("/api/careers/admin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode
        },
        body: JSON.stringify({
          id: selectedApp.id,
          status: editStatus,
          internal_notes: editNotes,
          reviewer: editReviewer
        })
      });

      if (res.ok) {
        const result = await res.json();
        // Update local application state
        setApplications(prev => prev.map(app => app.id === selectedApp.id ? { ...app, ...result.data } : app));
        setSelectedApp({ ...selectedApp, ...result.data });
        alert("Application updated successfully!");
      } else {
        alert("Failed to update application details.");
      }
    } catch (err) {
      alert("Network error updating application.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const downloadCSV = () => {
    if (filteredApps.length === 0) return;
    
    const headers = [
      "ID", "App ID", "Date", "Job Role", "Status", "Reviewer",
      "Full Name", "Email", "Phone", "WhatsApp", "Gender", "City", "State",
      "University", "Degree", "Course", "Graduation Year", "CGPA",
      "Internship Experience", "Skills", "LinkedIn", "Resume Link"
    ];

    const csvRows = [
      headers.join(","),
      ...filteredApps.map(app => [
        app.id,
        app.application_id,
        app.created_at,
        app.job_slug,
        app.status,
        `"${(app.reviewer || "").replace(/"/g, '""')}"`,
        `"${app.full_name.replace(/"/g, '""')}"`,
        `"${app.email.replace(/"/g, '""')}"`,
        `"${app.phone.replace(/"/g, '""')}"`,
        `"${app.whatsapp.replace(/"/g, '""')}"`,
        `"${app.gender || ""}"`,
        `"${app.city.replace(/"/g, '""')}"`,
        `"${app.state.replace(/"/g, '""')}"`,
        `"${app.university.replace(/"/g, '""')}"`,
        `"${(app.degree || "").replace(/"/g, '""')}"`,
        `"${(app.course || "").replace(/"/g, '""')}"`,
        `"${app.graduation_year || ""}"`,
        `"${app.cgpa || ""}"`,
        `"${(app.previous_internship || "").slice(0, 100).replace(/"/g, '""')}"`,
        `"${app.skills.join(", ")}"`,
        `"${app.linkedin || ""}"`,
        `"${app.resume_url}"`
      ].join(","))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `medskills_career_applications_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and search
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    const matchesRole = filterRole === "all" || app.job_slug === filterRole;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Unique job slugs for filtering
  const jobRoles = Array.from(new Set(applications.map(app => app.job_slug)));

  // Analytics Metrics
  const totalApps = applications.length;
  const statusCounts = STATUSES.reduce((acc, status) => {
    acc[status] = applications.filter(app => app.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  // Helper for Top items (universities / cities)
  const getTopItems = (field: keyof Application, limit = 4) => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      const val = String(app[field] || "Unknown").trim();
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  };

  const topUniversities = getTopItems("university");
  const topCities = getTopItems("city");
  const topSources = getTopItems("utm_source");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-body">
        <Head>
          <title>Careers Admin Login — MedSkills Catalyst</title>
        </Head>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-teal-mid/10 flex items-center justify-center text-2xl font-bold shadow-inner">
            🛡️
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Careers Recruitment Portal
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Secure admin workspace. Authorized access only.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Enter Admin Passcode
                </label>
                <div className="mt-2">
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate-800 bg-slate-950 text-white rounded-xl shadow-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-leg focus:border-transparent transition-all"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {authError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                  <p className="text-sm text-red-400">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-teal-deep bg-teal-leg hover:bg-cyan-400 transition-all disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Access Dashboard"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body p-6 sm:p-10 text-left">
      <Head>
        <title>Recruitment Dashboard — MedSkills Catalyst</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>🤝</span> Careers Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage student campus ambassadors, job candidates, and applications.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold rounded-lg text-sm border border-slate-800 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Stats Summary Panel */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total Applicants", value: totalApps, color: "text-white" },
            { label: "New", value: statusCounts["New"] || 0, color: "text-blue-400" },
            { label: "Shortlisted", value: statusCounts["Shortlisted"] || 0, color: "text-teal-leg" },
            { label: "Interviews", value: statusCounts["Interview Scheduled"] || 0, color: "text-amber-400" },
            { label: "Selected", value: statusCounts["Selected"] || 0, color: "text-emerald" },
            { label: "Rejected", value: statusCounts["Rejected"] || 0, color: "text-red-400" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
              <span className="block text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
              <span className={`block text-3xl font-extrabold mt-3.5 ${stat.color}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Filters and Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by name, university, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-800 bg-slate-950 rounded-xl placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-leg text-sm transition-all text-white"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-800 bg-slate-950 rounded-xl text-slate-300 focus:outline-none text-sm cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 border border-slate-800 bg-slate-950 rounded-xl text-slate-300 focus:outline-none text-sm cursor-pointer"
            >
              <option value="all">All Roles</option>
              {jobRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button
            onClick={downloadCSV}
            disabled={filteredApps.length === 0}
            className="px-5 py-2.5 bg-teal-mid hover:bg-emerald-dark disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            📥 Export CSV ({filteredApps.length})
          </button>
        </div>

        {/* Table + Analytics Sidebar Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Applications list table */}
          <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {filteredApps.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-4xl">📭</span>
                <p className="mt-4 text-slate-400 font-semibold">No applications found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-950 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-6 py-4">Applicant</th>
                      <th scope="col" className="px-6 py-4">Applied Position</th>
                      <th scope="col" className="px-6 py-4">University</th>
                      <th scope="col" className="px-6 py-4">Status</th>
                      <th scope="col" className="px-6 py-4">Date Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                    {filteredApps.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => openAppDetails(app)}
                        className="hover:bg-slate-800/20 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                          <div>
                            <span className="block">{app.full_name}</span>
                            <span className="block text-[0.72rem] text-slate-500 font-normal mt-0.5">{app.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                          <span className="font-semibold">{app.job_slug}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-300 max-w-[200px] truncate">
                          {app.university}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                            app.status === 'Shortlisted' ? 'bg-teal-mid/10 border-teal-leg text-teal-leg' :
                            app.status === 'Selected' ? 'bg-[#128C7E]/10 border-[#128C7E]/20 text-[#128C7E]' :
                            app.status === 'Rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                            app.status === 'Interview Scheduled' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                            'bg-slate-900 border-slate-700 text-slate-300'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                          {new Date(app.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Demographic / UTM Source Analytics Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Universities */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md text-left">
              <h4 className="text-[0.8rem] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mb-3">
                Top Universities
              </h4>
              <div className="space-y-3">
                {topUniversities.map(([univ, count]) => (
                  <div key={univ} className="text-xs">
                    <div className="flex justify-between font-bold text-slate-300 mb-1">
                      <span className="truncate max-w-[150px]">{univ}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-leg" style={{ width: `${(count / totalApps) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Cities */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md text-left">
              <h4 className="text-[0.8rem] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mb-3">
                Top Cities
              </h4>
              <div className="space-y-3">
                {topCities.map(([city, count]) => (
                  <div key={city} className="text-xs">
                    <div className="flex justify-between font-bold text-slate-300 mb-1">
                      <span>{city}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-mid" style={{ width: `${(count / totalApps) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top UTM Sources */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md text-left">
              <h4 className="text-[0.8rem] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mb-3">
                Traffic Sources
              </h4>
              <div className="space-y-3">
                {topSources.map(([src, count]) => (
                  <div key={src} className="text-xs">
                    <div className="flex justify-between font-bold text-slate-300 mb-1">
                      <span>{src === "null" || !src ? "Direct / Referral" : src}</span>
                      <span>{count}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-pale/40" style={{ width: `${(count / totalApps) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedApp && (
        <div className="fixed inset-0 z-[1000] flex justify-end bg-slate-950/70 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-3xl bg-slate-900 h-full overflow-y-auto shadow-2xl border-l border-slate-800 p-8 text-left flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-5 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">{selectedApp.full_name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Application ID: {selectedApp.application_id}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="h-8 w-8 rounded-full hover:bg-slate-850 flex items-center justify-center text-slate-400 text-lg font-bold border border-slate-800"
                >
                  ×
                </button>
              </div>

              {/* Grid content */}
              <div className="space-y-8">
                {/* Status controls */}
                <form onSubmit={handleUpdateApp} className="p-5 bg-slate-950/40 border border-slate-800 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 mb-2">Update Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-800 bg-slate-900 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-leg"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 mb-2">Reviewer</label>
                    <input
                      type="text"
                      value={editReviewer}
                      onChange={(e) => setEditReviewer(e.target.value)}
                      placeholder="e.g. Shubham Sharma"
                      className="w-full px-3 py-2 border border-slate-800 bg-slate-900 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-leg"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={updateLoading}
                      className="w-full py-2 bg-teal-leg hover:bg-cyan-400 text-teal-deep font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {updateLoading ? "Saving..." : "Save Status"}
                    </button>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-slate-400 mb-2">Internal Notes</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add interview assessment notes or feedback..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-800 bg-slate-900 rounded-lg text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-leg resize-none"
                    />
                  </div>
                </form>

                {/* Personal Information */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-teal-leg mb-3">Personal Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950/20 p-4 border border-slate-800/40 rounded-xl">
                    <div><span className="text-slate-500 block text-xs">Email:</span> <span className="font-semibold text-white">{selectedApp.email}</span></div>
                    <div><span className="text-slate-500 block text-xs">Phone / WhatsApp:</span> <span className="font-semibold text-white">{selectedApp.phone} / {selectedApp.whatsapp}</span></div>
                    <div><span className="text-slate-500 block text-xs">Gender:</span> <span className="font-semibold text-white">{selectedApp.gender || "N/A"}</span></div>
                    <div><span className="text-slate-500 block text-xs">Date of Birth:</span> <span className="font-semibold text-white">{selectedApp.dob || "N/A"}</span></div>
                    <div className="col-span-2"><span className="text-slate-500 block text-xs">City & State:</span> <span className="font-semibold text-white">{selectedApp.city}, {selectedApp.state}, {selectedApp.country}</span></div>
                    {selectedApp.address && <div className="col-span-2"><span className="text-slate-500 block text-xs">Address:</span> <span className="font-semibold text-white">{selectedApp.address}</span></div>}
                  </div>
                </div>

                {/* Academic Information */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-teal-leg mb-3">Academic Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950/20 p-4 border border-slate-800/40 rounded-xl">
                    <div className="col-span-2"><span className="text-slate-500 block text-xs">University / Board:</span> <span className="font-semibold text-white">{selectedApp.university}</span></div>
                    {selectedApp.college && <div className="col-span-2"><span className="text-slate-500 block text-xs">College:</span> <span className="font-semibold text-white">{selectedApp.college}</span></div>}
                    <div><span className="text-slate-500 block text-xs">Degree & Course:</span> <span className="font-semibold text-white">{selectedApp.degree} ({selectedApp.course})</span></div>
                    <div><span className="text-slate-500 block text-xs">Current Year / Graduation:</span> <span className="font-semibold text-white">{selectedApp.current_year} (Class of {selectedApp.graduation_year})</span></div>
                    <div><span className="text-slate-500 block text-xs">CGPA / Percentage:</span> <span className="font-semibold text-white">{selectedApp.cgpa || "N/A"}</span></div>
                  </div>
                </div>

                {/* Background & Skills */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-teal-leg mb-3">Experience & Skills</h4>
                  <div className="space-y-3.5 text-sm bg-slate-950/20 p-4 border border-slate-800/40 rounded-xl">
                    {selectedApp.previous_internship && <div><span className="text-slate-500 block text-xs mb-0.5">Previous Internship:</span> <p className="text-slate-300">{selectedApp.previous_internship}</p></div>}
                    {selectedApp.leadership_experience && <div><span className="text-slate-500 block text-xs mb-0.5">Campus Leadership:</span> <p className="text-slate-300">{selectedApp.leadership_experience}</p></div>}
                    <div className="grid grid-cols-3 gap-2">
                      <div><span className="text-slate-500 block text-xs">Clubs/Societies:</span> <span className="font-semibold text-white">{selectedApp.clubs || "N/A"}</span></div>
                      <div><span className="text-slate-500 block text-xs">Volunteer:</span> <span className="font-semibold text-white">{selectedApp.volunteer_work || "N/A"}</span></div>
                      <div><span className="text-slate-500 block text-xs">Event Mgmt:</span> <span className="font-semibold text-white">{selectedApp.event_experience || "N/A"}</span></div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs mb-1.5">Skill Tags:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApp.skills.map(s => <span key={s} className="px-2 py-0.5 bg-slate-850 text-slate-300 border border-slate-800 rounded text-xs">{s}</span>)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Short Answer Responses */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-teal-leg mb-3">Short Answers</h4>
                  <div className="space-y-4 bg-slate-950/20 p-4 border border-slate-800/40 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-500 block font-bold mb-1">Why do you want to join MedSkills Catalyst?</span>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedApp.why_join}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-bold mb-1">Tell us about a leadership experience:</span>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedApp.leadership_story}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-bold mb-1">How would you promote MedSkills Catalyst in your college?</span>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedApp.promotion_plan}</p>
                    </div>
                  </div>
                </div>

                {/* Files & Document Uploads */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-teal-leg mb-3">Files & Links</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <a
                      href={selectedApp.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-teal-mid/10 border border-teal-leg/20 hover:bg-teal-mid/20 rounded-xl flex items-center justify-between text-teal-leg font-bold"
                    >
                      <span>📄 View Resume PDF</span>
                      <span>↗</span>
                    </a>
                    {selectedApp.certificates_url && (
                      <a
                        href={selectedApp.certificates_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-slate-950/40 border border-slate-800 hover:bg-slate-900 rounded-xl flex items-center justify-between text-slate-300"
                      >
                        <span>🏆 Certificates</span>
                        <span>↗</span>
                      </a>
                    )}
                    {selectedApp.portfolio_url && (
                      <a
                        href={selectedApp.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-slate-950/40 border border-slate-800 hover:bg-slate-900 rounded-xl flex items-center justify-between text-slate-300"
                      >
                        <span>💼 Portfolio File</span>
                        <span>↗</span>
                      </a>
                    )}
                    {selectedApp.achievements_url && (
                      <a
                        href={selectedApp.achievements_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-slate-950/40 border border-slate-800 hover:bg-slate-900 rounded-xl flex items-center justify-between text-slate-300"
                      >
                        <span>🌟 Achievements Document</span>
                        <span>↗</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Social links */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-4">
                  {selectedApp.linkedin && (
                    <a
                      href={selectedApp.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-slate-900 border border-slate-800 text-[#0A66C2] rounded-xl flex items-center gap-2 hover:bg-slate-850"
                    >
                      <span>🔗 LinkedIn:</span>
                      <span className="truncate text-slate-400">{selectedApp.linkedin}</span>
                    </a>
                  )}
                  {selectedApp.instagram && (
                    <a
                      href={selectedApp.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-slate-900 border border-slate-800 text-pink-500 rounded-xl flex items-center gap-2 hover:bg-slate-850"
                    >
                      <span>📸 Instagram:</span>
                      <span className="truncate text-slate-400">{selectedApp.instagram}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="border-t border-slate-800 pt-6 mt-8 flex justify-between gap-4">
              <a
                href={`mailto:${selectedApp.email}?subject=MedSkills%20Catalyst%20-%20Application%20Update%20(ID:%20${selectedApp.application_id})`}
                className="flex-1 text-center py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-lg text-sm transition-colors border border-slate-700/50"
              >
                ✉ Email Applicant
              </a>
              <button
                onClick={() => setSelectedApp(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 font-bold rounded-lg text-sm border border-slate-800 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
