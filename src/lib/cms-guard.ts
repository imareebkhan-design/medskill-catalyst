import "server-only";
import { redirect } from "next/navigation";
import { CmsRole } from "@/src/generated/prisma/enums";
import { can, type Capability } from "@/src/lib/cms-roles";
import { getCmsUser, type CmsSessionUser } from "@/src/lib/cms-auth";

/**
 * Page-level guards.
 *
 * requireCmsUser() throws — right for server actions and route handlers, where
 * an exception becomes an error response. Pages want a redirect instead, so
 * they use these. Both ultimately read the same session.
 *
 * Call one of these as the FIRST statement of every page under /cms, before
 * any data access. The layout deliberately does not do it (see cms/layout.tsx).
 */

/** Signed-in user, or bounce to the login screen. */
export async function guardCmsPage(minRole?: CmsRole): Promise<CmsSessionUser> {
  const user = await getCmsUser();
  if (!user) redirect("/cms/login");

  if (minRole) {
    const { roleAtLeast } = await import("@/src/lib/cms-roles");
    if (!roleAtLeast(user.role, minRole)) redirect("/cms?denied=1");
  }
  return user;
}

/** Signed-in user holding `capability`, or bounce. */
export async function guardCmsCapability(capability: Capability): Promise<CmsSessionUser> {
  const user = await getCmsUser();
  if (!user) redirect("/cms/login");
  if (!can(user, capability)) redirect(`/cms?denied=${encodeURIComponent(capability)}`);
  return user;
}
