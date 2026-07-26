"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "./auth-actions";

function LoginInner() {
  const error = useSearchParams()?.get("error");
  return (
    <div className="w-full max-w-sm rounded-msc-lg bg-surface p-8 shadow-msc-md">
      <h1 className="text-center font-display text-2xl font-bold text-brand-navy">
        MedSkills <span className="text-brand-blue">CRM</span>
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Enter the admin passcode to continue.
      </p>
      {error && (
        <p className="mt-4 rounded-msc border border-danger/30 bg-red-50 px-3 py-2 text-center text-sm text-danger">
          {error}
        </p>
      )}
      <form action={loginAction} className="mt-6 space-y-3">
        <input
          type="password"
          name="passcode"
          autoFocus
          required
          placeholder="Passcode"
          className="flex h-11 w-full rounded-msc border border-brand-navy/15 bg-surface px-3.5 text-sm text-ink focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20"
        />
        <button
          type="submit"
          className="h-11 w-full rounded-pill bg-brand-blue text-sm font-semibold text-white transition hover:bg-brand-navy"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}

export function AdminLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 font-body">
      <Suspense>
        <LoginInner />
      </Suspense>
    </div>
  );
}
