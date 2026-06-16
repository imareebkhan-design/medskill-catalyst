// Vercel Serverless Function — served at /api/register for any project type
// (framework-agnostic; lives in the repo-root /api folder).
//
// Upserts each website lead into HubSpot as a contact, keyed on email,
// with the custom MedSkills properties:
//   form_type, background, consent, utm_source, utm_medium, utm_campaign, landing_page
//
// Requires env var HUBSPOT_ACCESS_TOKEN (HubSpot service key /
// private-app token with crm.objects.contacts.read + .write).

const HUBSPOT_BASE = "https://api.hubapi.com/crm/v3/objects/contacts";

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

function splitName(full) {
  const parts = String(full || "").trim().split(/\s+/);
  return { firstname: parts[0] || "", lastname: parts.slice(1).join(" ") };
}

async function hubspotUpsert(token, email, properties) {
  const headers = {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };
  const createRes = await fetch(HUBSPOT_BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ properties: { email, ...properties } }),
  });
  if (createRes.ok) return { ok: true, status: createRes.status };
  if (createRes.status === 409) {
    const updateRes = await fetch(
      HUBSPOT_BASE + "/" + encodeURIComponent(email) + "?idProperty=email",
      { method: "PATCH", headers, body: JSON.stringify({ properties }) }
    );
    if (updateRes.ok) return { ok: true, status: updateRes.status };
    return { ok: false, status: updateRes.status, detail: await updateRes.text() };
  }
  return { ok: false, status: createRes.status, detail: await createRes.text() };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    console.error("[HubSpot] Missing HUBSPOT_ACCESS_TOKEN env var.");
    return res.status(500).json({
      error: "Lead storage is not configured. Please contact us on WhatsApp.",
    });
  }

  try {
    // Vercel parses JSON bodies automatically; guard for string just in case.
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const {
      full_name, email, mobile, background, form_type, consent,
      utm_source, utm_medium, utm_campaign, landing_page,
    } = body;

    if (!email || !full_name) {
      return res.status(422).json({ error: "Name and email are required." });
    }

    const { firstname, lastname } = splitName(full_name);

    const properties = {
      firstname,
      lastname,
      phone: normalizeMobile(mobile),
      form_type: form_type === "counseling" ? "counseling" : "masterclass",
      background: BACKGROUND_LABELS[background] || String(background || ""),
      consent: consent === false ? "false" : "true",
      utm_source: utm_source || "",
      utm_medium: utm_medium || "",
      utm_campaign: utm_campaign || "",
      landing_page: landing_page || "",
    };

    const result = await hubspotUpsert(
      token,
      String(email).trim().toLowerCase(),
      properties
    );

    if (!result.ok) {
      console.error("[HubSpot] Upsert failed (" + result.status + "):", result.detail);
      return res.status(502).json({ error: "Could not save your details. Please WhatsApp us." });
    }

    console.log("[HubSpot] Lead upserted: " + email + " (" + properties.form_type + ")");
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
