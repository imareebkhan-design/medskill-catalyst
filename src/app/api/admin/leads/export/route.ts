import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { getStaff } from "@/src/lib/auth";
import { db } from "@/src/lib/db";
import type { Prisma } from "@/src/generated/prisma/client";
import { LeadStatus, LeadSource } from "@/src/generated/prisma/enums";
import { STATUS_LABELS, SOURCE_LABELS, leadCode } from "@/src/app/admin/ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = [
  "Lead ID", "Captured", "Name", "Email", "Mobile",
  "Type", "Stage", "Source", "Background", "UTM Source", "UTM Campaign", "Assigned to",
];

export async function GET(req: NextRequest) {
  // Passcode session gate (same as the admin pages).
  if (!(await getStaff())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const status = sp.get("status");
  const source = sp.get("source");
  const format = sp.get("format") === "xlsx" ? "xlsx" : "csv";

  const where: Prisma.LeadWhereInput = {};
  if (status && (Object.values(LeadStatus) as string[]).includes(status)) where.status = status as LeadStatus;
  if (source && (Object.values(LeadSource) as string[]).includes(source)) where.source = source as LeadSource;
  if (q) {
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { mobile: { contains: q } },
    ];
  }

  const leads = await db.lead.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: { assigned_to: { select: { name: true } } },
  });

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(d);

  const rows = leads.map((l) => [
    leadCode(l.id),
    fmtDate(l.created_at),
    l.full_name,
    l.email,
    l.mobile ?? "",
    l.form_type,
    STATUS_LABELS[l.status],
    SOURCE_LABELS[l.source],
    l.background ?? "",
    l.utm_source ?? "",
    l.utm_campaign ?? "",
    l.assigned_to?.name ?? "",
  ]);

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "xlsx") {
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
    ws["!cols"] = HEADERS.map((h, i) => ({
      wch: Math.min(40, Math.max(h.length, ...rows.map((r) => String(r[i] ?? "").length)) + 2),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="medskills-leads-${stamp}.xlsx"`,
      },
    });
  }

  // CSV (with BOM so Excel opens UTF-8 correctly)
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = "﻿" + [HEADERS, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="medskills-leads-${stamp}.csv"`,
    },
  });
}
