import { WEBINAR } from "./webinar.config";

function toICSDate(iso: string): string {
  // 2026-07-04T11:00:00+05:30 -> 20260704T053000Z (UTC)
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `MedSkills Catalyst — ${WEBINAR.title}`,
    dates: `${toICSDate(WEBINAR.startISO)}/${toICSDate(WEBINAR.endISO)}`,
    details: `${WEBINAR.subtitle}\n\nThe Zoom link will be sent to you on WhatsApp and email.`,
    location: WEBINAR.platformLabel,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Self-contained .ics body for Apple/Outlook download. */
export function icsContent(): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MedSkills Catalyst//Webinar//EN",
    "BEGIN:VEVENT",
    `UID:webinar-${WEBINAR.startISO}@medskillscatalyst.com`,
    `DTSTAMP:${toICSDate(new Date().toISOString())}`,
    `DTSTART:${toICSDate(WEBINAR.startISO)}`,
    `DTEND:${toICSDate(WEBINAR.endISO)}`,
    `SUMMARY:MedSkills Catalyst — ${WEBINAR.title}`,
    `DESCRIPTION:${WEBINAR.subtitle}`,
    `LOCATION:${WEBINAR.platformLabel}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
