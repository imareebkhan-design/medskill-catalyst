import { NextResponse } from "next/server";
import { AuthError, requirePermission } from "@/src/lib/auth";
import { can, Permission } from "@/src/lib/permissions";
import { bulkResultsCsv } from "@/src/modules/credentials/bulk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  let includePrivate = false;
  try {
    const staff = await requirePermission(Permission.CredentialsView);
    includePrivate = can(staff.role, Permission.CredentialsViewPrivate);
  } catch (e) {
    return new NextResponse("Unauthorized", { status: e instanceof AuthError ? e.status : 500 });
  }
  const { jobId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return new NextResponse("Not found", { status: 404 });
  const csv = await bulkResultsCsv(jobId, includePrivate);
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bulk-results-${jobId.slice(0, 8)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
