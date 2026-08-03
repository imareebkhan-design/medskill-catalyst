import "server-only";
import crypto from "crypto";

/**
 * Razorpay Standard Checkout — server-side helpers.
 *
 * We talk to the Orders API over raw fetch (matching the codebase's existing
 * pattern for external services — Resend, Meta CAPI) and verify signatures with
 * node:crypto, so no extra SDK dependency is needed. The KEY_SECRET is read
 * from env here and NEVER leaves the server.
 */

function creds() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing).",
    );
  }
  return { keyId, keySecret };
}

/** Publishable key id for checkout.js (safe to send to the browser). */
export function publicKeyId(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
}

export type RazorpayOrder = {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: string;
};

/**
 * Create an order server-side. `amountPaise` is the trusted amount computed from
 * the database — never a value supplied by the browser. Minimum 100 paise.
 */
export async function createRazorpayOrder(input: {
  amountPaise: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const { keyId, keySecret } = creds();

  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) {
    throw new Error("Order amount must be an integer of at least 100 paise.");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: input.currency ?? "INR",
      receipt: input.receipt?.slice(0, 40),
      notes: input.notes ?? {},
      payment_capture: 1,
    }),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 500);
    throw new Error(`Razorpay order creation failed (${res.status}): ${detail}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/**
 * Verify the checkout success signature:
 *   HMAC_SHA256(order_id + "|" + payment_id, KEY_SECRET) === razorpay_signature
 */
export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = creds();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return timingSafeEqualHex(expected, input.signature);
}

/**
 * Verify a webhook:
 *   HMAC_SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET) === X-Razorpay-Signature
 * The raw (unparsed) request body MUST be used.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqualHex(expected, signature);
}

/** Constant-time comparison of two hex strings. */
function timingSafeEqualHex(a: string, b: string): boolean {
  let ba: Buffer;
  let bb: Buffer;
  try {
    ba = Buffer.from(a, "hex");
    bb = Buffer.from(b, "hex");
  } catch {
    return false;
  }
  if (ba.length === 0 || ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
