import { icsContent } from "@/lib/calendar";

export const runtime = "nodejs";

export function GET() {
  return new Response(icsContent(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="medskills-webinar.ics"',
    },
  });
}
