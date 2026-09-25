import type { ReactNode } from "react";
import { getStaff, isSharedIdentity } from "@/src/lib/auth";
import { can, Permission } from "@/src/lib/permissions";
import { CredentialNav } from "./_ui";

export const dynamic = "force-dynamic";

export default async function CredentialsLayout({ children }: { children: ReactNode }) {
  const staff = await getStaff();
  if (!staff) return null; // the admin layout already rendered the sign-in state
  if (!can(staff.role, Permission.CredentialsView)) {
    return <p className="rounded-msc bg-red-50 px-4 py-3 text-sm text-danger">You do not have access to credentials.</p>;
  }
  return (
    <div className="space-y-6">
      <CredentialNav />
      {isSharedIdentity(staff) && (
        <p className="rounded-msc border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You are signed in with the shared admin passcode. You can browse credentials, but issuing, revoking, reissuing and template changes
          need an individual staff login so every action is attributable.
        </p>
      )}
      {children}
    </div>
  );
}
