import React, { useState, useEffect } from "react";
import Head from "next/head";

interface Lead {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  user_type: string;
  company_name?: string;
  college_name?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    
    try {
      const res = await fetch(`/api/leads?passcode=${encodeURIComponent(passcode)}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        setIsAuthenticated(true);
        // Save passcode in session storage so they don't have to enter it again on reload
        sessionStorage.setItem("msc_admin_passcode", passcode);
      } else {
        const errorData = await res.json();
        setAuthError(errorData.error || "Invalid passcode. Please try again.");
      }
    } catch (err) {
      setAuthError("Network error. Failed to verify passcode.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if passcode was already entered in this session
    const savedPasscode = sessionStorage.getItem("msc_admin_passcode");
    if (savedPasscode) {
      setPasscode(savedPasscode);
      setLoading(true);
      fetch(`/api/leads?passcode=${encodeURIComponent(savedPasscode)}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Stale token");
        })
        .then((data) => {
          setLeads(data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          sessionStorage.removeItem("msc_admin_passcode");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("msc_admin_passcode");
    setIsAuthenticated(false);
    setPasscode("");
    setLeads([]);
  };

  const downloadCSV = () => {
    if (filteredLeads.length === 0) return;
    
    const headers = ["ID", "Full Name", "Email", "WhatsApp", "User Type", "Company Name", "College Name", "Created At"];
    const csvRows = [
      headers.join(","),
      ...filteredLeads.map((lead) => {
        return [
          lead.id,
          `"${lead.full_name.replace(/"/g, '""')}"`,
          `"${lead.email.replace(/"/g, '""')}"`,
          `"${lead.mobile.replace(/"/g, '""')}"`,
          `"${lead.user_type}"`,
          `"${(lead.company_name || "").replace(/"/g, '""')}"`,
          `"${(lead.college_name || "").replace(/"/g, '""')}"`,
          `"${lead.created_at}"`
        ].join(",");
      })
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `medskills_leads_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and search logic
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.mobile.includes(searchQuery);
      
    const matchesFilter = 
      filterType === "all" || 
      (filterType === "student" && lead.user_type === "student") ||
      (filterType === "professional" && lead.user_type === "professional");
      
    return matchesSearch && matchesFilter;
  });

  const totalLeads = leads.length;
  const totalStudents = leads.filter(l => l.user_type === "student").length;
  const totalProfessionals = leads.filter(l => l.user_type === "professional").length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <Head>
          <title>Admin Login — MedSkills Catalyst</title>
        </Head>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 text-2xl font-bold shadow-inner">
            🛡️
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            MedSkills Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Secure workspace. Authorized access only.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/50">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="passcode" className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Enter Admin Passcode
                </label>
                <div className="mt-2">
                  <input
                    id="passcode"
                    name="passcode"
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate-700 bg-slate-900/50 text-white rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {authError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0 text-red-400">⚠️</div>
                    <div className="ml-3">
                      <p className="text-sm text-red-200">{authError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 active:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500 transition-all disabled:opacity-50"
                >
                  {loading ? "Authenticating..." : "Access Dashboard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 sm:p-10">
      <Head>
        <title>Leads Dashboard — MedSkills Catalyst</title>
      </Head>

      <div className="max-w-7xl mx-auto">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Lead Accelerator</h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Manage webinar registrations and lead captures for MedSkills Catalyst.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-sm transition-all border border-slate-700/50"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          {[
            { label: "Total Registrations", value: totalLeads, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
            { label: "Working Professionals", value: totalProfessionals, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Life Science Students", value: totalStudents, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" }
          ].map((stat, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border ${stat.bg} shadow-lg flex flex-col justify-between`}>
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">{stat.label}</span>
              <span className={`text-4xl font-extrabold mt-4 ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Controls block */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                🔍
              </div>
              <input
                type="text"
                placeholder="Search leads by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-800 bg-slate-950/60 rounded-xl placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm transition-all"
              />
            </div>
            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-slate-800 bg-slate-950/60 rounded-xl text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm cursor-pointer"
            >
              <option value="all">All Registrations</option>
              <option value="professional">Professionals Only</option>
              <option value="student">Students Only</option>
            </select>
          </div>

          <div>
            <button
              onClick={downloadCSV}
              disabled={filteredLeads.length === 0}
              className="w-full md:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              📥 Download CSV ({filteredLeads.length})
            </button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">📭</span>
              <p className="mt-4 text-slate-400 font-medium">No registrations match your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/60 text-[0.75rem] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left">Name</th>
                    <th scope="col" className="px-6 py-4 text-left">Contact Info</th>
                    <th scope="col" className="px-6 py-4 text-left">Type</th>
                    <th scope="col" className="px-6 py-4 text-left">Organization / College</th>
                    <th scope="col" className="px-6 py-4 text-left">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                        {lead.full_name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{lead.email}</span>
                          <span className="text-xs text-slate-500">{lead.mobile}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                          lead.user_type === 'student' 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {lead.user_type === 'student' ? 'Student' : 'Professional'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {lead.user_type === 'student' 
                          ? lead.college_name || 'N/A' 
                          : lead.company_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                        {new Date(lead.created_at).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
