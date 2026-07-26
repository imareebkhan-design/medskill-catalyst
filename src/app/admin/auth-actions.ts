"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, cookieTokenFor, isValidPasscode } from "@/src/lib/auth";

/** Validate the passcode and start a session (httpOnly cookie). */
export async function loginAction(formData: FormData): Promise<void> {
  const passcode = String(formData.get("passcode") ?? "");
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
