"use client";

import { SignOutButton, UserButton } from "@clerk/nextjs";

/** Account menu shown in the admin header in clerk mode. */
export function ClerkAccountMenu() {
  return <UserButton />;
}

/**
 * Shown to a signed-in person who has no (active) staff record, or to any
 * request that reaches the admin without a session in clerk mode.
 */
export function NotAuthorized({ message, clerk }: { message: string; clerk: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 font-body">
      <div className="w-full max-w-sm rounded-msc-lg bg-surface p-8 text-center shadow-msc-md">
        <h1 className="font-display text-2xl font-bold text-brand-navy">
          MedSkills <span className="text-brand-blue">CRM</span>
        </h1>
        <p className="mt-4 text-sm text-ink">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          {clerk ? (
            <>
              <a
                href="/staff-sign-in"
                className="rounded-msc bg-brand-blue px-4 py-2 text-sm font-semibold text-white"
              >
                Sign in
              </a>
              <SignOutButton>
                <button className="rounded-msc border border-brand-navy/15 px-4 py-2 text-sm font-semibold text-brand-navy">
                  Sign out
                </button>
              </SignOutButton>
            </>
          ) : (
            <a href="/admin" className="rounded-msc bg-brand-blue px-4 py-2 text-sm font-semibold text-white">
              Back
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
