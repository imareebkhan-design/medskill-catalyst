"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientKey } from "@/src/lib/rate-limit";
import { VERIFY_RATE_LIMIT_SURFACE, verifyByCertificateId } from "@/src/modules/credentials/verify";

/** /verify form: exact certificate-ID lookup → the same canonical page the QR opens. */
export async function verifyCertificateIdAction(formData: FormData): Promise<void> {
  const raw = String(formData.get("certificateId") ?? "").slice(0, 64);
  const outcome = await verifyByCertificateId(raw, clientKey(await headers(), VERIFY_RATE_LIMIT_SURFACE));
  if (outcome.kind === "found") redirect(`/verify/${outcome.token}`);
  if (outcome.kind === "rate_limited") redirect(`/verify?e=busy`);
  redirect(`/verify?e=not-found&id=${encodeURIComponent(raw.trim().slice(0, 40))}`);
}
