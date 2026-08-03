"use server";

import { z } from "zod";
import crypto from "crypto";
import { headers } from "next/headers";
import { enrollmentApplicationSchema } from "@/src/modules/enroll/schemas";
import {
  completeEnrollment,
  completePublicEnrollment,
  createPaymentOrder,
  createPaymentOrderForEnrollment,
  settleCapturedPayment,
  markPaymentFailed,
  EnrollError,
  type PaymentOrderInfo,
} from "@/src/modules/enroll/service";
import { verifyPaymentSignature } from "@/src/lib/razorpay";
import { sendMetaEvent, metaContext } from "@/src/lib/meta-capi";

export type EnrollResult =
  | { status: "success"; enrollmentId: string; eventId?: string }
  | { status: "error"; message: string };

/**
 * Funnel step 7 — full enrollment application submit.
 * Values are validated on the client (zodResolver) and re-validated here.
 */
export async function submitEnrollmentApplication(
  token: string,
  values: unknown,
): Promise<EnrollResult> {
  const parsed = enrollmentApplicationSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Some details didn't pass validation. Please review the form." };
  }

  try {
    const result = await completeEnrollment(token, parsed.data);

    // Meta Conversions API — CompleteRegistration. The event id is returned to
    // the client, which fires the browser pixel with the same id so the pair
    // deduplicates. Failures never affect the enrollment (sendMetaEvent no-ops
    // on missing config and never throws).
    const eventId = crypto.randomUUID();
    const ctx = metaContext(await headers());
    const d = parsed.data as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v : undefined);
    await sendMetaEvent({
      eventName: "CompleteRegistration",
      eventId,
      eventSourceUrl: ctx.eventSourceUrl,
      user: {
        email: str(d.email),
        phone: str(d.phone),
        firstName: str(d.first_name),
        lastName: str(d.last_name),
        city: str(d.city),
        state: str(d.state),
        country: str(d.country),
        fbp: ctx.fbp,
        fbc: ctx.fbc,
        clientIp: ctx.clientIp,
        userAgent: ctx.userAgent,
      },
      customData: { content_name: "Enrollment completed" },
    });

    return { status: "success", enrollmentId: result.enrollmentId, eventId };
  } catch (err) {
    if (err instanceof EnrollError) return { status: "error", message: err.message };
    if (err instanceof z.ZodError) return { status: "error", message: "Invalid submission." };
    console.error("[enroll] submit failed", err);
    return {
      status: "error",
      message: "Something went wrong on our side. Please try again or reach us on WhatsApp.",
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Razorpay checkout — create order + verify payment
// ─────────────────────────────────────────────────────────────

export type CreateOrderResult =
  | { status: "success"; order: PaymentOrderInfo }
  | { status: "error"; message: string };

/** Server-side order creation. Amount is derived from trusted DB records. */
export async function createOrderAction(token: string): Promise<CreateOrderResult> {
  try {
    const order = await createPaymentOrder(token);
    return { status: "success", order };
  } catch (err) {
    if (err instanceof EnrollError) return { status: "error", message: err.message };
    console.error("[enroll] create order failed", err);
    return {
      status: "error",
      message: "We couldn't start the payment. Please try again or reach us on WhatsApp.",
    };
  }
}

export type VerifyPaymentResult =
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * Verifies the checkout signature server-side, then records the capture and runs
 * fulfillment. The signature is authoritative proof for the fast-path UI; the
 * webhook independently confirms and reconciles. Never trusts the browser's word
 * that payment succeeded — only a valid signature passes.
 */
export async function verifyPaymentAction(payload: {
  token: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<VerifyPaymentResult> {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return { status: "error", message: "Missing payment details." };
  }

  const valid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!valid) {
    console.error("[enroll] payment signature mismatch", { order: razorpay_order_id });
    return { status: "error", message: "We couldn't verify this payment. Please contact us before retrying." };
  }

  try {
    // Fulfillment (invoice/email) is idempotent and also driven by the webhook,
    // so a captured payment is a success even if a post-step is still settling.
    await settleCapturedPayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
    return { status: "success" };
  } catch (err) {
    console.error("[enroll] settle payment failed", err);
    // Payment is verified/captured; the webhook will complete fulfillment.
    return { status: "success" };
  }
}

/** Records a checkout `payment.failed` so the transaction reflects reality. */
export async function markPaymentFailedAction(orderId: string, reason?: string): Promise<void> {
  try {
    if (orderId) await markPaymentFailed(orderId, reason);
  } catch (err) {
    console.error("[enroll] mark payment failed error", err);
  }
}

// ─────────────────────────────────────────────────────────────
// Public (token-less) enrollment — /[programme]/enroll pages
// ─────────────────────────────────────────────────────────────

/** Funnel step 7 for the public per-course pages (no token). */
export async function submitPublicEnrollmentApplication(
  courseSlug: string,
  values: unknown,
): Promise<EnrollResult> {
  const parsed = enrollmentApplicationSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Some details didn't pass validation. Please review the form." };
  }

  try {
    const result = await completePublicEnrollment(courseSlug, parsed.data);

    const eventId = crypto.randomUUID();
    const ctx = metaContext(await headers());
    const d = parsed.data as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v : undefined);
    await sendMetaEvent({
      eventName: "CompleteRegistration",
      eventId,
      eventSourceUrl: ctx.eventSourceUrl,
      user: {
        email: str(d.email),
        phone: str(d.phone),
        firstName: str(d.first_name),
        lastName: str(d.last_name),
        city: str(d.city),
        state: str(d.state),
        country: str(d.country),
        fbp: ctx.fbp,
        fbc: ctx.fbc,
        clientIp: ctx.clientIp,
        userAgent: ctx.userAgent,
      },
      customData: { content_name: "Enrollment completed" },
    });

    return { status: "success", enrollmentId: result.enrollmentId, eventId };
  } catch (err) {
    if (err instanceof EnrollError) return { status: "error", message: err.message };
    if (err instanceof z.ZodError) return { status: "error", message: "Invalid submission." };
    console.error("[enroll] public submit failed", err);
    return {
      status: "error",
      message: "Something went wrong on our side. Please try again or reach us on WhatsApp.",
    };
  }
}

/** Token-less order creation for the public pages, keyed by enrollment id. */
export async function createPublicOrderAction(enrollmentId: string): Promise<CreateOrderResult> {
  try {
    const order = await createPaymentOrderForEnrollment(enrollmentId);
    return { status: "success", order };
  } catch (err) {
    if (err instanceof EnrollError) return { status: "error", message: err.message };
    console.error("[enroll] public create order failed", err);
    return {
      status: "error",
      message: "We couldn't start the payment. Please try again or reach us on WhatsApp.",
    };
  }
}
