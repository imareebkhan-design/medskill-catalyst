import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { hasAdminPasscode } from "@/lib/admin-auth";
import { createInvoice, InvoiceError } from "@/src/lib/invoices";

export const runtime = "nodejs";

// Invoicing API (Phase 1) — CRM-integrated invoice creation + listing.
// Auth: ADMIN_PASSCODE via the "x-admin-passcode" header only (header-only,
// constant-time — see lib/admin-auth.ts). All money is computed server-side by
// createInvoice() (src/lib/invoices.ts) — the client never sets subtotal/tax/
// total, and the invoice number is issued atomically in Postgres.

function checkAuth(request: Request): boolean {
  return hasAdminPasscode(request.headers.get("x-admin-passcode"));
}

type ItemIn = { description?: unknown; hsn?: unknown; quantity?: unknown; rate?: unknown };

export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Invoices] list error:", error);
      return NextResponse.json({ error: "Failed to load invoices." }, { status: 502 });
    }
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[Invoices] GET failure:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawItems = Array.isArray(body.items) ? (body.items as ItemIn[]) : [];
  const leadId =
    body.lead_id === undefined || body.lead_id === null || body.lead_id === ""
      ? null
      : Number(body.lead_id);

  try {
    const inv = await createInvoice({
      bill_name: String(body.bill_name || ""),
      bill_email: body.bill_email as string | undefined,
      bill_phone: body.bill_phone as string | undefined,
      bill_company: body.bill_company as string | undefined,
      bill_gstin: body.bill_gstin as string | undefined,
      bill_address: body.bill_address as string | undefined,
      bill_state: body.bill_state as string | undefined,
      lead_id: leadId,
      items: rawItems.map((it) => ({
        description: String(it.description ?? ""),
        hsn: (it.hsn as string | undefined) ?? null,
        quantity: Number(it.quantity) || 0,
        rate: Number(it.rate) || 0,
      })),
      tax_rate: body.tax_rate === undefined ? undefined : Number(body.tax_rate),
      currency: body.currency as string | undefined,
      issue_date: body.issue_date as string | undefined,
      due_date: body.due_date as string | undefined,
      notes: body.notes as string | undefined,
      seller_gstin: body.seller_gstin as string | undefined,
      place_of_supply: body.place_of_supply as string | undefined,
      status: "draft",
    });

    return NextResponse.json(inv, { status: 201 });
  } catch (err) {
    if (err instanceof InvoiceError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[Invoices] POST failure:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
