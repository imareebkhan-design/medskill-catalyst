"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  cookieTokenFor,
  isPasscodeConfigured,
  isValidPasscode,
} from "@/src/lib/auth";

/** Validate the passcode and start a session (httpOnly cookie). */
export async function loginAction(formData: FormData): Promise<void> {
  const passcode = String(formData.get("passcode") ?? "");
  // Separate "this deployment has no passcode" from "you typed the wrong one".
  // Environment variables do not follow a project when it is moved to another
  // Vercel account or re-created as a new project, so the CRM can end up with
  // no ADMIN_PASSCODE at all — in which case the old, correct passcode is
  // rejected like any other input and "Incorrect passcode" sends whoever is
  // locked out looking for a bug in the code instead of a missing env var.
  if (!isPasscodeConfigured()) {
    redirect(
      "/admin?error=" +
        encodeURIComponent(
          "Admin passcode is not configured on this deployment. Set ADMIN_PASSCODE in the Vercel project's environment variables (Production) and redeploy.",
        ),
    );
  }
  if (!isValidPasscode(passcode)) {
    redirect("/admin?error=" + encodeURIComponent("Incorrect passcode"));
  }
  (await cookies()).set(ADMIN_COOKIE, cookieTokenFor(passcode), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  redirect("/admin");
}

/** Clear the session. */
export async function logoutAction(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin");
}
