"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { attemptLogin, destroySession } from "@/src/lib/cms-auth";
import { clientIpFrom } from "@/src/lib/cms-rate-limit";

export type LoginState = {
  error?: string;
  /** Echoed back so a failed attempt never wipes what the user typed. */
  email?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email.trim()) return { error: "Enter your email address.", email };
  if (!password) return { error: "Enter your password.", email };

  const h = await headers();
  const userAgent = h.get("user-agent");
  const ip = clientIpFrom((name) => h.get(name));

  let result: Awaited<ReturnType<typeof attemptLogin>>;
  try {
    result = await attemptLogin(email, password, userAgent, ip);
  } catch (err) {
    // Database unreachable, or the CMS migration has not been applied yet.
    // Surface something a human can act on instead of a 500, and keep the
    // typed email so nothing entered is lost.
    //
    // Log server-side: swallowing this silently would leave a real outage
    // with no diagnostic. The email is safe to log; the password is not, and
    // is never in scope here.
    console.error("[cms] login failed to reach the database:", err);
    return {
      error: "We could not reach the account service. Please try again in a moment.",
      email,
    };
  }

  // Keep the email so the form re-renders populated; never echo the password.
  if (!result.ok) return { error: result.message, email };

  // redirect() signals via a thrown control-flow error — it must sit outside
  // any try/catch, and after every await that must complete.
  redirect("/cms");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/cms/login");
}
