import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

// Invoicing API (Phase 1) — CRM-integrated invoice creation + listing.
// Auth mirrors /api/careers/admin: ADMIN_PASSCODE via "x-admin-passcode"
// header or ?passcode=. All money is computed here; the client never sets
// subtotal/tax/total, and the invoice number is issued atomically in Postgres.

function checkAuth(request: Request): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    console.error("[Invoices] ADMIN_PASSCODE is not configured.");
    return false;
  }
  const url = new URL(request.url);
  const given =
    request.headers.get("x-admin-passcode") || url.searchParams.get("passcode");
  return given === expected;
}

// Round to 2 decimals without float drift (e.g. 12500.005 -> 12500.01).
function money(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
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

  const billName = String(body.bill_name || "").trim();
  if (!billName) {
    return NextResponse.json({ error: "Bill-to name is required." }, { status: 400 });
  }

  // Normalise + validate line items.
  const rawItems = Array.isArray(body.items) ? (body.items as ItemIn[]) : [];
  const items = rawItems
    .map((it, i) => {
      const description = String(it.description || "").trim();
      const hsn = String(it.hsn || "").trim() || null;
      const quantity = money(Number(it.quantity) || 0);
      const rate = money(Number(it.rate) || 0);
      return { position: i, description, hsn, quantity, rate, amount: money(quantity * rate) };
    })
    .filter((it) => it.description !== "");

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Add at least one line item with a description." },
      { status: 400 }
    );
  }

  // Server-authoritative totals.
  const subtotal = money(items.reduce((s, it) => s + it.amount, 0));
  const taxRate = body.tax_rate === undefined ? 18 : money(Number(body.tax_rate) || 0);
  const taxAmount = money((subtotal * taxRate) / 100);
  const total = money(subtotal + taxAmount);

  const leadId =
    body.lead_id === undefined || body.lead_id === null || body.lead_id === ""
      ? null
      : Number(body.lead_id);

  try {
    const supabase = getServiceClient();

    // Atomic invoice number (INV-2026-001) from Postgres.
    const { data: noData, error: noErr } = await supabase.rpc("next_invoice_no");
    if (noErr || !noData) {
      console.error("[Invoices] numbering error:", noErr);
      return NextResponse.json({ error: "Could not issue an invoice number." }, { status: 502 });
    }
    const invoiceNo = String(noData);

    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert({
        invoice_no: invoiceNo,
        lead_id: Number.isFinite(leadId as number) ? leadId : null,
        bill_name: billName,
        bill_email: String(body.bill_email || "").trim() || null,
        bill_phone: String(body.bill_phone || "").trim() || null,
        bill_company: String(body.bill_company || "").trim() || null,
        bill_gstin: String(body.bill_gstin || "").trim() || null,
        bill_address: String(body.bill_address || "").trim() || null,
        bill_state: String(body.bill_state || "").trim() || null,
        issue_date: String(body.issue_date || "").trim() || undefined,
        due_date: String(body.due_date || "").trim() || null,
        currency: String(body.currency || "INR").trim() || "INR",
        tax_rate: taxRate,
        subtotal,
        tax_amount: taxAmount,
        total,
        status: "draft",
        notes: String(body.notes || "").trim() || null,
        seller_gstin: String(body.seller_gstin || "").trim() || null,
        place_of_supply: String(body.place_of_supply || "").trim() || null,
      })
      .select()
      .single();

    if (invErr || !inv) {
      console.error("[Invoices] insert error:", invErr);
      return NextResponse.json({ error: "Failed to create the invoice." }, { status: 502 });
    }

    const { data: savedItems, error: itemsErr } = await supabase
      .from("invoice_items")
      .insert(items.map((it) => ({ ...it, invoice_id: inv.id })))
      .select();

    if (itemsErr) {
      // Roll back the header so we never leave an invoice with no line items.
      await supabase.from("invoices").delete().eq("id", inv.id);
      console.error("[Invoices] items insert error:", itemsErr);
      return NextResponse.json({ error: "Failed to save invoice items." }, { status: 502 });
    }

    return NextResponse.json({ ...inv, invoice_items: savedItems ?? [] }, { status: 201 });
  } catch (err) {
    console.error("[Invoices] POST failure:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
