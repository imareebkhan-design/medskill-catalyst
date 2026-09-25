import { NextResponse } from "next/server";
import { AuthError, requirePermission } from "@/src/lib/auth";
import { Permission } from "@/src/lib/permissions";
import { db } from "@/src/lib/db";
import { credentialStorage } from "@/src/modules/credentials/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Staff view of any credential's stored PDF (including revoked/superseded). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(Permission.CredentialsView);
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 500;
    return new NextResponse(status === 500 ? "Error" : "Unauthorized", { status });
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const c = await db.credential.findUnique({ where: { id }, select: { pdf_path: true, certificate_id: true } });
  if (!c?.pdf_path) return new NextResponse("Not found", { status: 404 });
  const bytes = await credentialStorage().get(c.pdf_path);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${c.certificate_id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
