import "server-only";
import { z } from "zod";
import { db } from "@/src/lib/db";
import type { StaffUser } from "@/src/generated/prisma/client";
import { StaffRole } from "@/src/generated/prisma/enums";
import { PENDING_IDENTITY_PREFIX, SHARED_PASSCODE_IDENTITY } from "@/src/lib/auth";

/**
 * Staff provisioning for clerk mode. An admin adds a person by email and role;
 * the row is "pending" until that person first signs in with a Clerk account
 * whose VERIFIED email matches (see clerkStaff() in src/lib/auth.ts).
 */

export class StaffError extends Error {}

export const addStaffSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(StaffRole),
});

/** An admin who can actually sign in: active, bound to a real Clerk identity. */
function isLiveAdmin(s: Pick<StaffUser, "role" | "is_active" | "clerk_user_id">) {
  return (
    s.role === StaffRole.ADMIN &&
    s.is_active &&
    s.clerk_user_id !== SHARED_PASSCODE_IDENTITY &&
    !s.clerk_user_id.startsWith(PENDING_IDENTITY_PREFIX)
  );
}

export function isPending(s: Pick<StaffUser, "clerk_user_id">) {
  return s.clerk_user_id.startsWith(PENDING_IDENTITY_PREFIX);
}

export async function listStaff() {
  return db.staffUser.findMany({
    where: { clerk_user_id: { not: SHARED_PASSCODE_IDENTITY } },
    orderBy: [{ is_active: "desc" }, { role: "asc" }, { name: "asc" }],
  });
}

export async function addStaff(input: z.input<typeof addStaffSchema>, actor: StaffUser) {
  const data = addStaffSchema.parse(input);
  const clash = await db.staffUser.findUnique({ where: { email: data.email } });
  if (clash) throw new StaffError("A staff member with this email already exists.");
  const staff = await db.staffUser.create({
    data: { ...data, clerk_user_id: `${PENDING_IDENTITY_PREFIX}${data.email}` },
  });
  await db.auditLog.create({
    data: {
      actor_id: actor.id,
      action: "STAFF_ADDED",
      entity_type: "staff_user",
      entity_id: staff.id,
      after: { email: data.email, role: data.role },
    },
  });
  return staff;
}

/**
 * Change a role or active flag. Serialized with an advisory lock so two admins
 * demoting each other at the same moment cannot both succeed; refuses any change
 * that would leave no live admin (the lockout guard).
 */
export async function updateStaff(
  staffId: string,
  change: { role?: StaffRole; is_active?: boolean },
  actor: StaffUser,
) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('staff_admin_guard'))`;
    const before = await tx.staffUser.findUnique({ where: { id: staffId } });
    if (!before || before.clerk_user_id === SHARED_PASSCODE_IDENTITY) {
      throw new StaffError("Staff member not found.");
    }
    const after = { ...before, ...change };
    if (isLiveAdmin(before) && !isLiveAdmin(after)) {
      const liveAdmins = (await tx.staffUser.findMany({ where: { role: StaffRole.ADMIN, is_active: true } })).filter(
        isLiveAdmin,
      );
      if (liveAdmins.length <= 1) {
        throw new StaffError("This is the last active admin. Add or activate another admin first.");
      }
    }
    const updated = await tx.staffUser.update({ where: { id: staffId }, data: change });
    await tx.auditLog.create({
      data: {
        actor_id: actor.id,
        action: "STAFF_UPDATED",
        entity_type: "staff_user",
        entity_id: staffId,
        before: { role: before.role, is_active: before.is_active },
        after: { role: updated.role, is_active: updated.is_active },
      },
    });
    return updated;
  });
}
