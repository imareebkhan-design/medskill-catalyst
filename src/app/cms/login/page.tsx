import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCmsUser } from "@/src/lib/cms-auth";
import { CmsLoginForm } from "./login-form";

// Reads the session cookie, so it can never be statically cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function CmsLoginPage() {
  // Already signed in? Skip the form.
  if (await getCmsUser()) redirect("/cms");

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 font-body">
      <CmsLoginForm />
    </div>
  );
}
