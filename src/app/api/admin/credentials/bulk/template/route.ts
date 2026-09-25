import { NextResponse } from "next/server";
import { AuthError, requirePermission } from "@/src/lib/auth";
import { Permission } from "@/src/lib/permissions";
import { bulkTemplateCsv } from "@/src/modules/credentials/bulk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission(Permission.CredentialsBulkIssue);
  } catch (e) {
    return new NextResponse("Unauthorized", { status: e instanceof AuthError ? e.status : 500 });
  }
  return new NextResponse("﻿" + bulkTemplateCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="medskills-credentials-bulk-template.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
