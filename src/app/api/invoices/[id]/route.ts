import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

// Single-invoice read + workflow updates (status / notes / dates).
// Money and line items are immutable here — re-issue a new invoice instead.

function checkAuth(request: Request): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) return false;
  const url = new URL(request.url);
  const given =
    request.headers.get("x-admin-passcode") || url.searchParams.get("passcode");
  return given === expected;
}

const ALLOWED_STATUS = ["draft", "sent", "viewed", "paid", "overdue", "cancelled"];

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Invoices] GET one failure:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await ctx.params;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) {
    const s = String(body.status);
    if (!ALLOWED_STATUS.includes(s)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    update.status = s;
  }
  if (body.notes !== undefined) update.notes = String(body.notes || "").trim() || null;
  if (body.due_date !== undefined) update.due_date = String(body.due_date || "").trim() || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("invoices")
      .update(update)
      .eq("id", id)
      .select("*, invoice_items(*)")
      .single();

    if (error || !data) {
      console.error("[Invoices] update error:", error);
      return NextResponse.json({ error: "Failed to update invoice." }, { status: 502 });
    }
    return NextResponse.json({ success: true, invoice: data });
  } catch (err) {
    console.error("[Invoices] PATCH failure:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
