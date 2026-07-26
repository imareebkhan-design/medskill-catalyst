"use server";

import { z } from "zod";
import { enrollmentApplicationSchema } from "@/src/modules/enroll/schemas";
import { completeEnrollment, EnrollError } from "@/src/modules/enroll/service";

export type EnrollResult =
  | { status: "success"; enrollmentId: string }
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
    return { status: "success", enrollmentId: result.enrollmentId };
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
