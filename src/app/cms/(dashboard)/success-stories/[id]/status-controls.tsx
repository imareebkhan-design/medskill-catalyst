"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ContentStatus } from "@/src/generated/prisma/enums";
import { changeStoryStatusAction, type StoryFormState } from "../actions";

/**
 * Publish / unpublish / archive controls.
 *
 * These buttons are hidden from roles that lack the capability, but that is
 * cosmetic only — changeStoryStatusAction calls requireCapability() server-side
 * on every submission, so a crafted POST is refused regardless of what the
 * browser rendered.
 */

function ActionButton({
  label,
  pendingLabel,
  variant,
}: {
  label: string;
  pendingLabel: string;
  variant: "primary" | "ghost";
}) {
  const { pending } = useFormStatus();
  const cls =
    variant === "primary"
      ? "bg-brand-blue text-white shadow-msc-sm hover:bg-brand-navy"
      : "border border-brand-navy/15 text-brand-navy hover:bg-brand-navy/5";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`h-10 rounded-pill px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${cls}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function StatusControls({
  storyId,
  status,
  canPublish,
  canArchive,
}: {
  storyId: string;
  status: ContentStatus;
  canPublish: boolean;
  canArchive: boolean;
}) {
  const [state, formAction] = useActionState<StoryFormState, FormData>(
    changeStoryStatusAction,
    { status: "idle" },
  );
  const [confirmingPublish, setConfirmingPublish] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  if (!canPublish && !canArchive) {
    return (
      <p className="text-xs leading-relaxed text-muted">
        A Content Admin publishes and archives alumni. You can write and save
        changes here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {state.status !== "idle" && state.message && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-msc border px-4 py-2.5 text-sm font-medium ${
            state.status === "error"
              ? "border-danger/25 bg-red-50 text-danger"
              : "border-success/25 bg-emerald-50 text-success"
          }`}
        >
          {state.message}
        </div>
      )}

      {/* Publish / unpublish */}
      {canPublish && status !== ContentStatus.ARCHIVED && (
        <>
          {status === ContentStatus.PUBLISHED ? (
            <form action={formAction}>
              <input type="hidden" name="id" value={storyId} />
              <input type="hidden" name="change" value="unpublish" />
              <ActionButton
                label="Move back to draft"
                pendingLabel="Updating…"
                variant="ghost"
              />
              <p className="mt-2 text-xs text-muted">
                Removes this alumnus from the website.
              </p>
            </form>
          ) : confirmingPublish ? (
            <div className="rounded-msc-lg border border-brand-blue/25 bg-brand-pale/50 px-5 py-4">
              <p className="font-display text-base font-bold text-brand-navy">
                Ready to publish?
              </p>
              <p className="mt-1 text-sm text-ink/75">
                These changes will become visible on the MedSkills Catalyst
                website.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <form action={formAction}>
                  <input type="hidden" name="id" value={storyId} />
                  <input type="hidden" name="change" value="publish" />
                  <ActionButton
                    label="Publish changes"
                    pendingLabel="Publishing…"
                    variant="primary"
                  />
                </form>
                <button
                  type="button"
                  onClick={() => setConfirmingPublish(false)}
                  className="h-10 rounded-pill border border-brand-navy/15 px-5 text-sm font-semibold text-brand-navy transition hover:bg-brand-navy/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingPublish(true)}
              className="h-10 rounded-pill bg-brand-blue px-5 text-sm font-semibold text-white shadow-msc-sm transition hover:bg-brand-navy"
            >
              Publish
            </button>
          )}
        </>
      )}

      {/* Archive / restore */}
      {canArchive && (
        <div className="border-t border-brand-navy/10 pt-4">
          {status === ContentStatus.ARCHIVED ? (
            <form action={formAction}>
              <input type="hidden" name="id" value={storyId} />
              <input type="hidden" name="change" value="restore" />
              <ActionButton label="Restore" pendingLabel="Restoring…" variant="ghost" />
              <p className="mt-2 text-xs text-muted">Brings this back as a draft.</p>
            </form>
          ) : confirmingArchive ? (
            <div className="rounded-msc-lg border border-warning/25 bg-amber-50/60 px-5 py-4">
              <p className="font-display text-base font-bold text-brand-navy">
                Are you sure?
              </p>
              <p className="mt-1 text-sm text-ink/75">
                This alumnus will be moved to the archive and removed from the
                website. Nothing is deleted — you can restore it at any time.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <form action={formAction}>
                  <input type="hidden" name="id" value={storyId} />
                  <input type="hidden" name="change" value="archive" />
                  <ActionButton
                    label="Archive"
                    pendingLabel="Archiving…"
                    variant="ghost"
                  />
                </form>
                <button
                  type="button"
                  onClick={() => setConfirmingArchive(false)}
                  className="h-10 rounded-pill px-5 text-sm font-semibold text-muted transition hover:text-brand-navy"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingArchive(true)}
              className="text-sm font-semibold text-danger transition hover:underline"
            >
              Archive this alumnus
            </button>
          )}
        </div>
      )}
    </div>
  );
}
