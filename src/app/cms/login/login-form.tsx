"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-pill bg-brand-blue text-sm font-semibold text-white transition hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

const FIELD =
  "flex h-11 w-full rounded-msc border border-brand-navy/15 bg-surface px-3.5 text-sm text-ink focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20";

export function CmsLoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <div className="w-full max-w-sm rounded-msc-lg bg-surface p-8 shadow-msc-md">
      <h1 className="text-center font-display text-2xl font-bold text-brand-navy">
        MedSkills <span className="text-brand-blue">Content</span>
      </h1>
      <p className="mt-2 text-center text-sm text-muted">
        Sign in to manage website content.
      </p>

      {state.error && (
        <p
          role="alert"
          className="mt-5 rounded-msc border border-danger/30 bg-red-50 px-3 py-2 text-center text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="cms-email" className="block text-xs font-semibold text-muted">
            Email
          </label>
          <input
            id="cms-email"
            type="email"
            name="email"
            autoComplete="username"
            defaultValue={state.email ?? ""}
            autoFocus
            required
            placeholder="you@medskillscatalyst.com"
            className={FIELD}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cms-password" className="block text-xs font-semibold text-muted">
            Password
          </label>
          <input
            id="cms-password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
            className={FIELD}
          />
        </div>

        <SubmitButton />
      </form>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        Access is granted by invitation. If you cannot sign in, ask a Super Admin
        to check your account.
      </p>
    </div>
  );
}
