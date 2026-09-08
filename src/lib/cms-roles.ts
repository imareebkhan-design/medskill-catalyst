import { CmsRole } from "@/src/generated/prisma/enums";

/**
 * Roles and capabilities for the CMS.
 *
 * This module is intentionally dependency-free (no `server-only`, no Prisma
 * client, no Node built-ins) so the same capability table drives both the
 * server-side gate and the buttons a client component decides to render.
 * The server check is the real one — the client use is cosmetic.
 */

export const ROLE_RANK: Record<CmsRole, number> = {
  [CmsRole.SUPER_ADMIN]: 3,
  [CmsRole.CONTENT_ADMIN]: 2,
  [CmsRole.CONTENT_EDITOR]: 1,
};

export const ROLE_LABELS: Record<CmsRole, string> = {
  [CmsRole.SUPER_ADMIN]: "Super Admin",
  [CmsRole.CONTENT_ADMIN]: "Content Admin",
  [CmsRole.CONTENT_EDITOR]: "Content Editor",
};

export const ROLE_DESCRIPTIONS: Record<CmsRole, string> = {
  [CmsRole.SUPER_ADMIN]: "Full access, including team management and version rollback.",
  [CmsRole.CONTENT_ADMIN]: "Can edit and publish all content, but cannot manage the team.",
  [CmsRole.CONTENT_EDITOR]: "Can write and save drafts, but cannot publish them.",
};

/**
 * Named capabilities. Prefer these over raw role comparisons at call sites —
 * `can(user, "content:publish")` survives a future role change; a scattered
 * `role === CONTENT_ADMIN` does not.
 */
export type Capability =
  | "content:create"
  | "content:edit"
  | "content:publish"
  | "content:archive"
  | "content:delete"
  | "content:reorder"
  | "content:restoreVersion"
  | "users:manage"
  | "activity:view"
  | "settings:access";

const CAPABILITIES: Record<Capability, CmsRole[]> = {
  "content:create": [CmsRole.SUPER_ADMIN, CmsRole.CONTENT_ADMIN, CmsRole.CONTENT_EDITOR],
  "content:edit": [CmsRole.SUPER_ADMIN, CmsRole.CONTENT_ADMIN, CmsRole.CONTENT_EDITOR],
  "content:reorder": [CmsRole.SUPER_ADMIN, CmsRole.CONTENT_ADMIN],
  "content:publish": [CmsRole.SUPER_ADMIN, CmsRole.CONTENT_ADMIN],
  "content:archive": [CmsRole.SUPER_ADMIN, CmsRole.CONTENT_ADMIN],
  // Permanent deletion is Super Admin only; everyone else archives (soft delete).
  "content:delete": [CmsRole.SUPER_ADMIN],
  "content:restoreVersion": [CmsRole.SUPER_ADMIN],
  "users:manage": [CmsRole.SUPER_ADMIN],
  // Content Admins can see what changed and who changed it, but this grants
  // no access to Settings, user management, or system configuration.
  "activity:view": [CmsRole.SUPER_ADMIN, CmsRole.CONTENT_ADMIN],
  "settings:access": [CmsRole.SUPER_ADMIN],
};

export function roleCan(role: CmsRole, capability: Capability): boolean {
  return CAPABILITIES[capability].includes(role);
}

export function can(user: { role: CmsRole } | null | undefined, capability: Capability): boolean {
  return !!user && roleCan(user.role, capability);
}

/** True when `role` sits at or above `minRole` in the hierarchy. */
export function roleAtLeast(role: CmsRole, minRole: CmsRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}
