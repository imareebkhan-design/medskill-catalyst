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
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    const meetingLink = (process.env.QA_MEETING_LINK || "").trim();
    const firstName = full_name.split(" ")[0] || "there";
    const linkBlock = meetingLink
      ? `<p>Join using the link below:</p>
         <p><a href="${meetingLink}" style="color:#00589E;font-weight:700">${meetingLink}</a></p>`
      : `<p>Your joining link will be sent to this email address before the session.</p>`;

    const html = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;color:#0F1B27;line-height:1.6;font-size:15px">
        <p>Hi ${firstName},</p>
        <p>Thank you for registering for our Live Q&amp;A Session.</p>
        <p><strong>Here are your session details:</strong><br>
        📅 ${EVENT.dateLine}<br>
        🕕 ${EVENT.timeLine}</p>
        ${linkBlock}
        <p>We're looking forward to answering all your questions and helping you understand whether MedSkills Catalyst is the right next step for your career.</p>
        <p>See you there!<br>Team MedSkills Catalyst</p>
      </div>`;

    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MedSkills Catalyst <admissions@medskillscatalyst.com>",
          to: [email],
          subject: "You're Registered for the MedSkills Catalyst Live Q&A",
          html,
        }),
      });
      emailed = r.ok;
      if (!r.ok) {
        console.error("[QA] Resend send failed:", r.status, (await r.text()).slice(0, 300));
      }
    } catch (e) {
      console.error("[QA] Resend error:", e);
    }
  }

  return NextResponse.json({ ok: true, emailed });
}
