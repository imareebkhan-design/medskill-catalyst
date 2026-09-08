"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CmsAuthError, requireCapability } from "@/src/lib/cms-auth";
import { AlumniCategory } from "@/src/generated/prisma/enums";
import {
  changeStoryStatus,
  createStory,
  reorderStories,
  updateStory,
  type StatusChange,
} from "@/src/modules/cms/success-stories";
import { successStorySchema } from "@/src/modules/cms/success-story-schema";
import type { Capability } from "@/src/lib/cms-roles";
import { revalidateSiteContent } from "@/src/lib/site-content";

/**
 * Success Story mutations.
 *
 * Authorization and validation both happen here, server-side. The client form
 * validates too, but only for feedback — nothing it sends is trusted, and a
 * disabled button in the browser is never what stops an action.
 */

export type StoryFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Echoed back so a rejected submission never loses what was typed. */
  values?: Record<string, string>;
};

const FIELDS = [
  "category",
  "full_name",
  "profile_image_url",
  "linkedin_url",
  "previous_designation",
  "previous_company",
  "current_designation",
  "current_company",
  "growth_headline",
  "growth_description",
  "short_description",
  "full_story",
  "testimonial",
] as const;

function readForm(formData: FormData): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const f of FIELDS) raw[f] = String(formData.get(f) ?? "");
  return raw;
}

/** Turns an auth failure into a message rather than an unhandled throw. */
function authMessage(err: unknown): string | null {
  if (!(err instanceof CmsAuthError)) return null;
  return err.status === 401
    ? "Your session has ended. Please sign in again."
    : "You do not have permission to do that. Ask a Content Admin.";
}

async function gate(capability: Capability) {
  return requireCapability(capability);
}

// ── Create / update ──────────────────────────────────────────────────

export async function saveStoryAction(
  _prev: StoryFormState,
  formData: FormData,
): Promise<StoryFormState> {
  const raw = readForm(formData);
  const id = String(formData.get("id") ?? "").trim();

  let user;
  try {
    // Creating and editing are available to every signed-in CMS role,
    // including Content Editors — success_stories has a real draft state.
    user = await gate("content:edit");
  } catch (err) {
    const message = authMessage(err);
    if (message) return { status: "error", message, values: raw };
    throw err;
  }

  const parsed = successStorySchema.safeParse(raw);
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
    };
  }

  const result = id
    ? await updateStory(id, parsed.data, user.id)
    : await createStory(parsed.data, user.id);

  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "not-found"
          ? "That alumnus could not be found. It may have been archived."
          : result.reason === "not-provisioned"
            ? "Your content workspace is still being set up, so this could not be saved. Nothing has been lost."
            : "We could not save your changes just now. Nothing has been lost — please try again in a moment.",
      values: raw,
    };
  }

  revalidatePath("/cms/success-stories");
  revalidatePath("/cms");
  revalidateSiteContent("stories");

  // A new story lands on its own edit page so publish is one click away.
  if (!id) redirect(`/cms/success-stories/${result.id}?created=1`);

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

export async function changeStoryStatusAction(
  _prev: StoryFormState,
  formData: FormData,
): Promise<StoryFormState> {
  const id = String(formData.get("id") ?? "").trim();
  const change = String(formData.get("change") ?? "") as StatusChange;

  if (!id || !(change in CAPABILITY_FOR)) {
    return { status: "error", message: "That action is not available." };
  }

  let user;
  try {
    user = await gate(CAPABILITY_FOR[change]);
  } catch (err) {
    const message = authMessage(err);
    if (message) return { status: "error", message };
    throw err;
  }

  const result = await changeStoryStatus(id, change, user.id);
  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "not-found"
          ? "That alumnus could not be found."
          : "We could not apply that change just now. Please try again in a moment.",
    };
  }

  revalidatePath("/cms/success-stories");
  revalidatePath(`/cms/success-stories/${id}`);
  revalidatePath("/cms");
  // Status changes are what put a story on or off the public site.
  revalidateSiteContent("stories");

  const MESSAGES: Record<StatusChange, string> = {
    publish: "Published. This story is now marked live.",
    unpublish: "Moved back to draft. It is no longer marked live.",
    archive: "Archived. You can restore it at any time.",
    restore: "Restored as a draft.",
  };
  return { status: "success", message: MESSAGES[change] };
}

// ── Reordering ───────────────────────────────────────────────────────

export async function reorderStoriesAction(
  category: AlumniCategory,
  orderedIds: string[],
): Promise<{ ok: boolean; message?: string }> {
  let user;
  try {
    user = await gate("content:reorder");
  } catch (err) {
    const message = authMessage(err);
    if (message) return { ok: false, message };
    throw err;
  }

  const result = await reorderStories(category, orderedIds, user.id);
  if (!result.ok) {
    return { ok: false, message: "We could not save the new order. Please try again." };
  }

  revalidatePath("/cms/success-stories");
  revalidateSiteContent("stories");
  return { ok: true };
}
