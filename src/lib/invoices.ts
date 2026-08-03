import "server-only";
import { getServiceClient } from "@/lib/supabase";

/**
 * Shared invoice creation — the single source of truth for issuing an invoice.
 *
 * This is the EXISTING invoice generator's logic, extracted from
 * src/app/api/invoices/route.ts so it can be called both from the admin API
 * route (HTTP, passcode-authed) and server-side from the payment fulfillment
 * flow. It reuses the same tables and the same atomic `next_invoice_no()` RPC
 * (MS/<FY>/<seq>). Money is always computed here — never trusted from a caller
 * that received it from a browser.
 */

export class InvoiceError extends Error {}

export type InvoiceItemInput = {
  description: string;
  hsn?: string | null;
  quantity: number;
  rate: number;
};

export type CreateInvoiceInput = {
  bill_name: string;
  bill_email?: string | null;
  bill_phone?: string | null;
  bill_company?: string | null;
  bill_gstin?: string | null;
  bill_address?: string | null;
  bill_state?: string | null;
  lead_id?: number | null;
  /** Links the invoice to an enrollment; UNIQUE column → idempotency guard. */
  enrollment_id?: string | null;
  items: InvoiceItemInput[];
  tax_rate?: number;
  currency?: string;
  issue_date?: string;
  due_date?: string | null;
  notes?: string | null;
  seller_gstin?: string | null;
  place_of_supply?: string | null;
  status?: string;
};

/** Round to 2 decimals without float drift (e.g. 12500.005 -> 12500.01). */
export function money(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

const trimOrNull = (v: unknown): string | null => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function createInvoice(input: CreateInvoiceInput) {
  const billName = String(input.bill_name ?? "").trim();
  if (!billName) throw new InvoiceError("Bill-to name is required.");

  const items = (input.items ?? [])
    .map((it, i) => {
      const description = String(it.description ?? "").trim();
      const hsn = trimOrNull(it.hsn);
      const quantity = money(Number(it.quantity) || 0);
      const rate = money(Number(it.rate) || 0);
      return { position: i, description, hsn, quantity, rate, amount: money(quantity * rate) };
    })
    .filter((it) => it.description !== "");

  if (items.length === 0) {
    throw new InvoiceError("Add at least one line item with a description.");
  }

  // Server-authoritative totals.
  const subtotal = money(items.reduce((s, it) => s + it.amount, 0));
  const taxRate = input.tax_rate === undefined ? 18 : money(Number(input.tax_rate) || 0);
  const taxAmount = money((subtotal * taxRate) / 100);
  const total = money(subtotal + taxAmount);

  const supabase = getServiceClient();

  // Atomic invoice number (MS/25-26/01) from Postgres.
  const { data: noData, error: noErr } = await supabase.rpc("next_invoice_no");
  if (noErr || !noData) {
    console.error("[Invoices] numbering error:", noErr);
    throw new InvoiceError("Could not issue an invoice number.");
  }
  const invoiceNo = String(noData);

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({
      invoice_no: invoiceNo,
      lead_id:
        input.lead_id === undefined || input.lead_id === null || !Number.isFinite(input.lead_id)
          ? null
          : input.lead_id,
      enrollment_id: input.enrollment_id ?? null,
      bill_name: billName,
      bill_email: trimOrNull(input.bill_email),
      bill_phone: trimOrNull(input.bill_phone),
      bill_company: trimOrNull(input.bill_company),
      bill_gstin: trimOrNull(input.bill_gstin),
      bill_address: trimOrNull(input.bill_address),
      bill_state: trimOrNull(input.bill_state),
      issue_date: trimOrNull(input.issue_date) ?? undefined,
      due_date: trimOrNull(input.due_date),
      currency: trimOrNull(input.currency) ?? "INR",
      tax_rate: taxRate,
      subtotal,
      tax_amount: taxAmount,
      total,
      status: input.status || "draft",
      notes: trimOrNull(input.notes),
      seller_gstin: trimOrNull(input.seller_gstin),
      place_of_supply: trimOrNull(input.place_of_supply),
    })
    .select()
    .single();

  if (invErr || !inv) {
    // Unique violation on enrollment_id → an invoice already exists for this
    // enrollment (concurrent webhook + callback race). Return the existing one.
    if (invErr?.code === "23505" && input.enrollment_id) {
      const existing = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .eq("enrollment_id", input.enrollment_id)
        .maybeSingle();
      if (existing.data) return existing.data;
    }
    console.error("[Invoices] insert error:", invErr);
    throw new InvoiceError("Failed to create the invoice.");
  }

  const { data: savedItems, error: itemsErr } = await supabase
    .from("invoice_items")
    .insert(items.map((it) => ({ ...it, invoice_id: inv.id })))
    .select();

  if (itemsErr) {
    // Roll back the header so we never leave an invoice with no line items.
    await supabase.from("invoices").delete().eq("id", inv.id);
    console.error("[Invoices] items insert error:", itemsErr);
    throw new InvoiceError("Failed to save invoice items.");
  }

  return { ...inv, invoice_items: savedItems ?? [] };
}

/** Look up an existing invoice for an enrollment (idempotency pre-check). */
export async function findInvoiceByEnrollment(enrollmentId: string) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();
  return data;
}
