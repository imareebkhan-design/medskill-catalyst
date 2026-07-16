import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

// Live Q&A registration — stores into the shared `leads` table (upsert on
// email so an existing lead is updated, not duplicated) and, when Resend is
// configured, emails the joining link. Self-contained so it does not depend on
// the (currently in-flux) /api/register implementation.

const EVENT = {
  title: "Cohort 1 Live Q&A",
  dateLine: "Saturday, 18 July 2026",
  timeLine: "6:00 PM IST onwards",
};

// Email-client-safe (table layout + inline styles), matching the site brand.
// Mirrors emails/qna-registration.html — keep the two in sync.
function qaEmailHtml(firstName: string): string {
  const li = (t: string) =>
    `<tr><td style="font-size:15px;line-height:2;color:#3A4D60;">&#8226;&nbsp; ${t}</td></tr>`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background-color:#F1F3F4;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:#F1F3F4;">You're registered for the MedSkills Catalyst Cohort 1 Live Q&amp;A — Sat, 18 July 2026, 6:00 PM IST.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F1F3F4;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #D9E0E6;font-family:'Plus Jakarta Sans','Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td align="center" style="background-color:#0A2A43;padding:36px 40px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" valign="middle" style="padding-right:12px;"><img src="https://www.medskillscatalyst.com/brand/logo/MedSkills-Catalyst_Logo.png" width="44" height="44" alt="MedSkills Catalyst" style="display:block;width:44px;height:44px;border-radius:50%;background-color:#FFFFFF;"></td>
<td align="left" valign="middle"><div style="font-family:Georgia,'Times New Roman',serif;color:#FFFFFF;font-size:24px;font-weight:700;">MedSkills Catalyst</div><div style="color:#4AD0FF;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;margin-top:4px;">Cohort 1 Live Q&amp;A Registration</div></td>
</tr></table></td></tr>
<tr><td style="padding:40px 40px 8px 40px;"><h1 style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#0A2A43;font-weight:700;">You're Registered! &#127881;</h1>
<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#3A4D60;">Hi <strong style="color:#0A2A43;">${firstName}</strong>,</p>
<p style="margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#3A4D60;">Thank you for registering for the <strong style="color:#0A2A43;">MedSkills Catalyst Cohort 1 Live Q&amp;A Session</strong>. We're looking forward to answering all your questions.</p></td></tr>
<tr><td style="padding:16px 40px 0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F9FB;border:1px solid #E3EAF0;border-radius:12px;"><tr><td style="padding:20px 22px;">
<div style="font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#00589E;margin-bottom:12px;">Session Details</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:15px;line-height:1.9;color:#0F1B27;">&#128197; &nbsp;<strong>Date:</strong> ${EVENT.dateLine}</td></tr><tr><td style="font-size:15px;line-height:1.9;color:#0F1B27;">&#128368; &nbsp;<strong>Time:</strong> ${EVENT.timeLine}</td></tr><tr><td style="font-size:15px;line-height:1.9;color:#0F1B27;">&#127909; &nbsp;<strong>Mode:</strong> Online (Zoom) &middot; Live &amp; Interactive</td></tr></table>
</td></tr></table></td></tr>
<tr><td align="center" style="padding:26px 40px 6px 40px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#00589E" style="border-radius:100px;">
<a href="https://us06web.zoom.us/j/86311217303?pwd=KEhZKLNO0GMA62ocAjSi1byGKpr4d8.1" target="_blank" style="display:inline-block;padding:15px 34px;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:100px;">Join Zoom Meeting &rarr;</a>
</td></tr></table></td></tr>
<tr><td align="center" style="padding:8px 40px 4px 40px;"><p style="margin:0;font-size:14px;line-height:1.8;color:#3A4D60;"><strong style="color:#0A2A43;">Meeting ID:</strong> 863 1121 7303 &nbsp;&middot;&nbsp; <strong style="color:#0A2A43;">Passcode:</strong> 851398</p></td></tr>
<tr><td style="padding:22px 40px 0 40px;"><div style="border-top:1px solid #E3EAF0;height:1px;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
<tr><td style="padding:22px 40px 0 40px;"><h2 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-size:19px;color:#0A2A43;font-weight:700;">During the session we'll cover</h2>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">${li("Program curriculum")}${li("Career opportunities in MedTech")}${li("Eligibility")}${li("Projects &amp; practical learning")}${li("Time commitment")}${li("Fees &amp; admissions")}${li("Live Q&amp;A")}</table></td></tr>
<tr><td style="padding:22px 40px 0 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F7F9FB;border:1px solid #E3EAF0;border-left:3px solid #00589E;border-radius:10px;"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.6;color:#3A4D60;">Please join the meeting <strong style="color:#0A2A43;">5&ndash;10 minutes early</strong> to ensure a smooth start.</td></tr></table></td></tr>
<tr><td style="padding:26px 40px 40px 40px;"><p style="margin:0 0 4px 0;font-size:15px;line-height:1.6;color:#3A4D60;">We look forward to meeting you.</p><p style="margin:0;font-size:15px;line-height:1.6;color:#0A2A43;font-weight:700;">Team MedSkills Catalyst</p></td></tr>
<tr><td align="center" style="background-color:#0A2A43;padding:22px 40px;"><p style="margin:0;color:#96A1AA;font-size:12px;line-height:1.6;">&copy; 2026 MedSkills Catalyst Private Limited. All rights reserved.<br><a href="https://www.medskillscatalyst.com/" target="_blank" style="color:#4AD0FF;text-decoration:none;">medskillscatalyst.com</a></p></td></tr>
</table></td></tr></table></body></html>`;
}

function normalizeMobile(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  let ten = digits;
  if (ten.length > 10 && ten.startsWith("0")) ten = ten.slice(1);
  if (ten.length === 12 && ten.startsWith("91")) ten = ten.slice(2);
  ten = ten.slice(-10);
  return ten.length === 10 ? "+91" + ten : String(raw || "").trim();
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidIndianMobile(v: string) {
  const d = String(v).replace(/\D/g, "").replace(/^0/, "").replace(/^91/, "");
  return d.length === 10 && /^[6-9]/.test(d);
}

export async function POST(req: Request) {
  let body: Record<string, string> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const full_name = String(body.full_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.mobile || body.phone || "").trim();
  const institute = String(body.institute || "").trim();
  const category = String(body.category || "").trim();
  const city = String(body.city || "").trim();

  // Server-side validation — never trust the client.
  if (!full_name || !email || !phone || !institute || !category || !city) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 422 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
  }
  if (!isValidIndianMobile(phone)) {
    return NextResponse.json({ error: "Please enter a valid 10-digit Indian mobile number." }, { status: 422 });
  }

  // 1) Store the registration (upsert on email preserves the lead).
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("leads").upsert(
      {
        full_name,
        email,
        mobile: normalizeMobile(phone),
        form_type: "masterclass",
        consent: true,
        extra: {
          source: "Q&A Registration",
          event: EVENT.title,
          institute,
          category,
          city,
          utm_source: body.utm_source || "",
          utm_medium: body.utm_medium || "",
          utm_campaign: body.utm_campaign || "",
          landing_page: body.landing_page || "/qnaregistration",
        },
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("[QA] Supabase upsert error:", error);
      return NextResponse.json({ error: "Could not save your registration. Please try again." }, { status: 502 });
    }
  } catch (err) {
    console.error("[QA] Storage failure:", err);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }

  // 2) Send the joining-link email via Resend (only when configured). A failed
  //    email must not fail the registration — the lead is already saved.
  let emailed = false;
  let emailReason = ""; // TEMP diagnostic — surfaces why an email didn't send.
  const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.Resend_Api_key;
  if (!RESEND_API_KEY) emailReason = "RESEND_API_KEY missing in this deployment's env";
  if (RESEND_API_KEY) {
    const firstName = full_name.split(" ")[0] || "there";
    const html = qaEmailHtml(firstName);

    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MedSkills Catalyst <info@medskillscatalyst.com>",
          to: [email],
          subject: "You're Registered! | MedSkills Catalyst Cohort 1 Live Q&A",
          html,
        }),
      });
      emailed = r.ok;
      if (!r.ok) {
        const detail = (await r.text()).slice(0, 300);
        emailReason = "resend_" + r.status + ": " + detail;
        console.error("[QA] Resend send failed:", r.status, detail);
      }
    } catch (e) {
      emailReason = "resend_exception: " + (e instanceof Error ? e.message : String(e));
      console.error("[QA] Resend error:", e);
    }
  }

  return NextResponse.json({ ok: true, emailed, emailReason });
}
