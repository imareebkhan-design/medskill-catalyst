import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClerkProvider, SignIn } from "@clerk/nextjs";
import { adminAuthMode, STAFF_SIGN_IN_PATH } from "@/src/lib/auth-mode";

export const metadata: Metadata = {
  title: "Staff sign-in · MedSkills Catalyst",
  robots: { index: false, follow: false },
};

/** Staff sign-in (clerk mode only). In passcode mode the admin has its own login. */
export default function StaffSignInPage() {
  if (adminAuthMode() !== "clerk") redirect("/admin");
  return (
    <ClerkProvider>
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
        <SignIn routing="path" path={STAFF_SIGN_IN_PATH} forceRedirectUrl="/admin" />
      </div>
    </ClerkProvider>
  );
}
