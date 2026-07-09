import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Lead capture → Supabase (table: public.leads), upserted on email.
 * Mirror of the framework-agnostic root function at /api/register.js —
 * keep the two in sync.
 *
 * Required env vars:
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const BACKGROUND_LABELS: Record<string, string> = {
  pharma_mr: "Pharma Medical Representative (MR)",
  pharm_grad: "B.Pharm / M.Pharm Graduate",
  biotech_grad: "B.Tech / M.Tech / Life Science Graduate",
  clinical_tech: "Lab / Clinical Technician",
  other: "Other Sales / Graduate",
};

function normalizeMobile(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  let ten = digits;
  if (ten.length > 10 && ten.startsWith("0")) ten = ten.slice(1);
  if (ten.length === 12 && ten.startsWith("91")) ten = ten.slice(2);
  ten = ten.slice(-10);
  return ten.length === 10 ? `+91${ten}` : String(raw || "").trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[Leads] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.");
    return res
      .status(500)
      .json({ error: "Lead storage is not configured. Please contact us on WhatsApp." });
  }

  try {
    const {
      full_name, email, mobile, background, form_type, consent,
      utm_source, utm_medium, utm_campaign, landing_page,
      ...rest
    } = (req.body || {}) as Record<string, unknown>;

    if (!email || !full_name) {
      return res.status(422).json({ error: "Name and email are required." });
    }

    const row = {
      full_name: String(full_name).trim(),
      email: String(email).trim().toLowerCase(),
      mobile: normalizeMobile(String(mobile || "")),
      form_type: (form_type === "counseling" || form_type === "cohort_registration") ? form_type : "masterclass",
      background: BACKGROUND_LABELS[String(background)] || String(background || ""),
      consent: consent !== false,
      utm_source: (utm_source as string) || "",
      utm_medium: (utm_medium as string) || "",
      utm_campaign: (utm_campaign as string) || "",
      landing_page: (landing_page as string) || "",
      extra: rest && typeof rest === "object" ? rest : {},
    };

    const r = await fetch(url + "/rest/v1/leads?on_conflict=email", {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    });

    if (!r.ok) {
      const detail = (await r.text()).slice(0, 500);
      console.error("[Leads] Supabase insert failed (" + r.status + "): " + detail);
      return res
        .status(502)
        .json({ error: "Could not save your details. Please WhatsApp us." });
    }

    console.log("[Leads] Saved: " + row.email + " (" + row.form_type + ")");
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
