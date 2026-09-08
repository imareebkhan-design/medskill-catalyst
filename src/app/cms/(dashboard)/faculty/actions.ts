"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CmsAuthError, requireCapability } from "@/src/lib/cms-auth";
import {
  changeFacultyStatus,
  createFaculty,
  reorderFaculty,
  updateFaculty,
  type StatusChange,
} from "@/src/modules/cms/faculty";
import { facultySchema } from "@/src/modules/cms/faculty-schema";
import type { Capability } from "@/src/lib/cms-roles";
import { revalidateSiteContent } from "@/src/lib/site-content";

/**
 * Faculty mutations.
 *
 * Authorization and validation both run here, server-side. The form validates
 * too, but only for feedback — a disabled control in the browser is never what
 * stops an action.
 */

export type FacultyFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Echoed back so a rejected submission never loses what was typed. */
  values?: Record<string, string>;
  /** Expertise is a list, so it is echoed separately from the text fields. */
  expertise?: string[];
};

const FIELDS = [
  "full_name",
  "designation",
  "organization",
  "profile_image_url",
  "years_experience",
  "experience_display",
  "short_bio",
  "full_bio",
] as const;

function readForm(formData: FormData) {
  const raw: Record<string, string> = {};
  for (const f of FIELDS) raw[f] = String(formData.get(f) ?? "");
  const expertise = formData
    .getAll("expertise")
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0);
  return { raw, expertise };
}

function authMessage(err: unknown): string | null {
  if (!(err instanceof CmsAuthError)) return null;
  return err.status === 401
    ? "Your session has ended. Please sign in again."
    : "You do not have permission to do that. Ask a Content Admin.";
}

// ── Create / update ──────────────────────────────────────────────────

export async function saveFacultyAction(
  _prev: FacultyFormState,
  formData: FormData,
): Promise<FacultyFormState> {
  const { raw, expertise } = readForm(formData);
  const id = String(formData.get("id") ?? "").trim();

  let user;
  try {
    // Writing is open to every CMS role, including Content Editors — faculty
    // has a real draft state, and publishing is a separate, gated action.
    user = await requireCapability("content:edit");
  } catch (err) {
    const message = authMessage(err);
    if (message) return { status: "error", message, values: raw, expertise };
    throw err;
  }

  const parsed = facultySchema.safeParse({ ...raw, expertise });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
      values: raw,
      expertise,
    };
  }

  const result = id
    ? await updateFaculty(id, parsed.data, user.id)
    : await createFaculty(parsed.data, user.id);

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "not-found"
          ? "That mentor could not be found. They may have been archived."
          : result.reason === "not-provisioned"
            ? "Your content workspace is still being set up, so this could not be saved. Nothing has been lost."
            : "We could not save your changes just now. Nothing has been lost — please try again in a moment.",
      values: raw,
      expertise,
    };
  }

  revalidatePath("/cms/faculty");
  revalidatePath("/cms");
  revalidateSiteContent("faculty");

  if (!id) redirect(`/cms/faculty/${result.id}?created=1`);

  return {
    status: "success",
    message:
      result.changedFields.length === 0
        ? "No changes to save."
        : "Changes saved successfully.",
  };
}

// ── Status changes ───────────────────────────────────────────────────

const CAPABILITY_FOR: Record<StatusChange, Capability> = {
  publish: "content:publish",
  unpublish: "content:publish",
  archive: "content:archive",
  restore: "content:archive",
};

export async function changeFacultyStatusAction(
  _prev: FacultyFormState,
  formData: FormData,
): Promise<FacultyFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const change = String(formData.get("change") ?? "") as StatusChange;

  if (!id || !(change in CAPABILITY_FOR)) {
    return { status: "error", message: "That action is not available." };
  }

  let user;
  try {
    user = await requireCapability(CAPABILITY_FOR[change]);
  } catch (err) {
    const message = authMessage(err);
    if (message) return { status: "error", message };
    throw err;
  }

  const result = await changeFacultyStatus(id, change, user.id);
  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "not-found"
          ? "That mentor could not be found."
          : "We could not apply that change just now. Please try again in a moment.",
    };
  }

  revalidatePath("/cms/faculty");
  revalidatePath(`/cms/faculty/${id}`);
  revalidatePath("/cms");
  // Status changes are what put a mentor on or off the public site.
  revalidateSiteContent("faculty");

  const MESSAGES: Record<StatusChange, string> = {
    publish: "Published. This mentor is now marked live.",
    unpublish: "Moved back to draft. They are no longer marked live.",
    archive: "Archived. You can restore them at any time.",
    restore: "Restored as a draft.",
  };
  return { status: "success", message: MESSAGES[change] };
}

// ── Reordering ───────────────────────────────────────────────────────

export async function reorderFacultyAction(
  orderedIds: string[],
): Promise<{ ok: boolean; message?: string }> {
  let user;
  try {
    user = await requireCapability("content:reorder");
  } catch (err) {
    const message = authMessage(err);
    if (message) return { ok: false, message };
    throw err;
  }

  const result = await reorderFaculty(orderedIds, user.id);
  if (!result.ok) {
    return { ok: false, message: "We could not save the new order. Please try again." };
  }

  revalidatePath("/cms/faculty");
  revalidateSiteContent("faculty");
  return { ok: true };
}
