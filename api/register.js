// Vercel Serverless Function — served at /api/register.
//
// Stores each website lead in Supabase (table: public.leads), upserted
// on email so repeat submissions update instead of duplicating.
//
// Required env vars (Vercel > Project > Settings > Environment Variables):
//   SUPABASE_URL               e.g. https://abcd1234.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  Supabase > Settings > API > service_role key
//
// (NEXT_PUBLIC_SUPABASE_URL is accepted as a fallback for SUPABASE_URL.)

const BACKGROUND_LABELS = {
  pharma_mr: "Pharma Medical Representative (MR)",
  pharm_grad: "B.Pharm / M.Pharm Graduate",
  biotech_grad: "B.Tech / M.Tech / Life Science Graduate",
  clinical_tech: "Lab / Clinical Technician",
  other: "Other Sales / Graduate",
};

function normalizeMobile(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  let ten = digits;
  if (ten.length > 10 && ten.startsWith("0")) ten = ten.slice(1);
  if (ten.length === 12 && ten.startsWith("91")) ten = ten.slice(2);
  ten = ten.slice(-10);
  return ten.length === 10 ? "+91" + ten : String(raw || "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[Leads] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.");
    return res.status(500).json({
      error: "Lead storage is not configured. Please contact us on WhatsApp.",
    });
  }

  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const {
      full_name, email, mobile, background, form_type, consent,
      utm_source, utm_medium, utm_campaign, landing_page,
      ...rest
    } = body;

    if (!email || !full_name) {
      return res.status(422).json({ error: "Name and email are required." });
    }

    const row = {
      full_name: String(full_name).trim(),
      email: String(email).trim().toLowerCase(),
      mobile: normalizeMobile(mobile),
      form_type: (form_type === "counseling" || form_type === "cohort_registration") ? form_type : "masterclass",
      background: BACKGROUND_LABELS[background] || String(background || ""),
      consent: consent !== false,
      utm_source: utm_source || "",
      utm_medium: utm_medium || "",
      utm_campaign: utm_campaign || "",
      landing_page: landing_page || "",
      extra: rest && typeof rest === "object" ? rest : {},
    };

    // Upsert via Supabase REST (PostgREST). merge-duplicates + on_conflict=email
    // updates the existing row when the same email registers again.
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
      return res.status(502).json({ error: "Could not save your details. Please WhatsApp us." });
    }

    console.log("[Leads] Saved: " + row.email + " (" + row.form_type + ")");
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
