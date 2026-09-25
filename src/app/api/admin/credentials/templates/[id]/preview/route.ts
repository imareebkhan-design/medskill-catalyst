import { NextResponse } from "next/server";
import { AuthError, requirePermission } from "@/src/lib/auth";
import { Permission } from "@/src/lib/permissions";
import { CredentialError } from "@/src/modules/credentials/errors";
import { previewTemplate } from "@/src/modules/credentials/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sample rendering of a template version (not a credential; nothing stored). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(Permission.CredentialsView);
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
    const bytes = await previewTemplate(id);
    return new NextResponse(Buffer.from(bytes), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="template-preview.pdf"`, "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    if (e instanceof AuthError) return new NextResponse("Unauthorized", { status: e.status });
    if (e instanceof CredentialError) return new NextResponse(e.message, { status: 400 });
    console.error("[template preview]", e);
    return new NextResponse("Preview failed", { status: 500 });
  }
}
