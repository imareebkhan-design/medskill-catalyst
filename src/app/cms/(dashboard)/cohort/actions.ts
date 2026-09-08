"use server";

import { revalidatePath } from "next/cache";
import { CmsAuthError, requireCapability } from "@/src/lib/cms-auth";
import { saveCohort } from "@/src/modules/cms/cohort";
import { cohortSettingsSchema } from "@/src/modules/cms/cohort-schema";
import { revalidateSiteContent } from "@/src/lib/site-content";

/**
 * Cohort mutations.
 *
 * Authorization and validation both happen here, server-side. The client form
 * validates too, but only for feedback — nothing it does is trusted.
 */

export type CohortFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Field-level messages, keyed by input name. */
  fieldErrors?: Record<string, string>;
  /** Echoed so a rejected submission never loses what was typed. */
  values?: Record<string, string>;
};

export async function saveCohortAction(
  _prev: CohortFormState,
  formData: FormData,
): Promise<CohortFormState> {
  const raw = {
    cohort_name: String(formData.get("cohort_name") ?? ""),
    start_date: String(formData.get("start_date") ?? ""),
    start_time: String(formData.get("start_time") ?? ""),
    admissions_status: String(formData.get("admissions_status") ?? ""),
    duration: String(formData.get("duration") ?? ""),
    registration_url: String(formData.get("registration_url") ?? ""),
  };

  // 1. Authorization. Editing cohort settings publishes to the live website,
  //    so it requires the publish capability — never merely being signed in.
  let user;
  try {
    user = await requireCapability("content:publish");
  } catch (err) {
    if (err instanceof CmsAuthError) {
      return {
        status: "error",
        message:
          err.status === 401
            ? "Your session has ended. Please sign in again."
            : "You do not have permission to change the cohort. Ask a Content Admin.",
        values: raw,
      };
    }
    throw err;
  }

  // 2. Validation — the authoritative pass.
  const parsed = cohortSettingsSchema.safeParse(raw);
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

  // 3. Write.
  const result = await saveCohort(parsed.data, user.id);
  if (!result.ok) {
    return {
      status: "error",
      message:
        result.reason === "not-provisioned"
          ? "Your content workspace is still being set up, so this could not be saved. Nothing has been lost — please try again once setup is complete."
          : "We could not save your changes just now. Nothing has been lost — please try again in a moment.",
      values: raw,
    };
  }

  // Refresh the dashboard's cohort card and this page.
  revalidatePath("/cms");
  revalidatePath("/cms/cohort");
  // ...and the public site, so a content change needs no deploy.
  revalidateSiteContent("cohort");

  return {
    status: "success",
    // Deliberately does NOT claim the public website changed: sentinel
    // injection is Phase 9. Saying "the website has been updated" before that
    // exists would be telling the user something untrue.
    message: result.created
      ? "Cohort settings have been saved successfully."
      : result.changedFields.length === 0
        ? "No changes to save."
        : "Cohort settings have been updated successfully.",
  };
}
