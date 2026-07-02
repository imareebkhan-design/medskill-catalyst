// Vercel Serverless Function — served at /api/leads.
// Read-only feed for the admin dashboard (/admin.html).
//
// Auth: requires the ADMIN_PASSCODE env var; caller must send it in the
// "x-admin-passcode" header (or ?passcode= for the CSV download link).
//
// GET /api/leads                 → JSON array (newest first)
// GET /api/leads?format=csv      → CSV file download
//
// Required env vars: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL),
// SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSCODE.

const COLUMNS = [
  "id", "created_at", "full_name", "email", "mobile",
  "form_type", "background", "consent",
  "utm_source", "utm_medium", "utm_campaign", "landing_page",
];

function csvEscape(v) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    console.error("[Leads] ADMIN_PASSCODE env var is not set.");
    return res.status(500).json({ error: "Dashboard is not configured." });
  }
  const given = req.headers["x-admin-passcode"] || (req.query && req.query.passcode);
  if (given !== expected) {
    return res.status(401).json({ error: "Invalid passcode." });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: "Lead storage is not configured." });
  }

  try {
    const r = await fetch(
      url + "/rest/v1/leads?select=*&order=created_at.desc&limit=10000",
      { headers: { apikey: key, Authorization: "Bearer " + key } }
    );
    if (!r.ok) {
      console.error("[Leads] Supabase read failed (" + r.status + "): " + (await r.text()).slice(0, 300));
      return res.status(502).json({ error: "Could not load leads." });
    }
    const leads = await r.json();

    if (req.query && req.query.format === "csv") {
      const header = COLUMNS.join(",");
      const rows = leads.map((l) => COLUMNS.map((c) => csvEscape(l[c])).join(","));
      const csv = "﻿" + [header].concat(rows).join("\r\n"); // BOM so Excel opens UTF-8 correctly
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="medskills-leads-' + new Date().toISOString().slice(0, 10) + '.csv"'
      );
      return res.status(200).send(csv);
    }

    return res.status(200).json(leads);
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
