// Vercel Serverless Function — served at /api/register for any project type
// (framework-agnostic; lives in the repo-root /api folder).
//
// 1. Upserts each website lead into HubSpot as a contact (keyed on email)
//    with the custom MedSkills properties.
// 2. Fires an instant Slack alert so a counselor can act fast (best-effort).
//
// Env vars:
//   HUBSPOT_ACCESS_TOKEN  (required) HubSpot service key — contacts read+write
//   SLACK_WEBHOOK_URL     (optional) Slack incoming webhook for new-lead alerts

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

// Best-effort Slack alert. Never throws — a notify failure must not break capture.
async function notifySlack(p) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  const isCounseling = p.form_type === "counseling";
  const heading = isCounseling
    ? ":telephone_receiver: *New COUNSELING lead — call within 10 min*"
    : ":mortar_board: *New Masterclass registration*";
  const utm = [p.utm_source, p.utm_medium, p.utm_campaign].filter(Boolean).join(" / ") || "direct";
  const text =
    heading + "\n" +
    "*Name:* " + p.full_name + "\n" +
    "*Phone:* " + p.phone + "\n" +
    "*Email:* " + p.email + "\n" +
    "*Background:* " + (p.background || "-") + "\n" +
    "*Source:* " + utm;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    console.error("[Slack] alert failed:", e);
  }
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
    const phone = normalizeMobile(mobile);
    const ft = form_type === "counseling" ? "counseling" : "masterclass";
    const bg = BACKGROUND_LABELS[background] || String(background || "");

    const properties = {
      firstname,
      lastname,
      phone,
      form_type: ft,
      background: bg,
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

    // Fire the instant alert (best-effort; won't block or break the response).
    await notifySlack({
      full_name, email: String(email).trim().toLowerCase(), phone,
      form_type: ft, background: bg, utm_source, utm_medium, utm_campaign,
    });

    console.log("[HubSpot] Lead upserted: " + email + " (" + ft + ")");
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
