import { db } from "@/src/lib/db";
import type { StaffUser } from "@/src/generated/prisma/client";
import { LeadStatus, ActivityType } from "@/src/generated/prisma/enums";

/**
 * Funnel transitions (docs/CRM_ARCHITECTURE.md §1.5).
 * LOST is reachable from any non-terminal stage and requires a reason.
 * LOST → NEW allows re-opening a lead.
 * CONVERTED is set by the enrollment/payment pipeline (Phase 2), but a
 * manual override is allowed from LINK_SENT for offline payments.
 */
export const ALLOWED: Record<LeadStatus, LeadStatus[]> = {
  NEW: [LeadStatus.CONTACTED, LeadStatus.DISCOVERY_CALL, LeadStatus.LOST],
  CONTACTED: [LeadStatus.DISCOVERY_CALL, LeadStatus.QUALIFIED, LeadStatus.LOST],
  DISCOVERY_CALL: [LeadStatus.QUALIFIED, LeadStatus.CONTACTED, LeadStatus.LOST],
  QUALIFIED: [LeadStatus.LINK_SENT, LeadStatus.LOST],
  LINK_SENT: [LeadStatus.CONVERTED, LeadStatus.QUALIFIED, LeadStatus.LOST],
  CONVERTED: [],
  LOST: [LeadStatus.NEW],
};

export class LeadServiceError extends Error {}

export async function transitionLead(
  actor: StaffUser,
  leadId: bigint,
  to: LeadStatus,
  reason?: string,
) {
  return db.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new LeadServiceError("Lead not found");
    if (lead.status === to) return lead;

    if (!ALLOWED[lead.status].includes(to)) {
      throw new LeadServiceError(`Cannot move a ${lead.status} lead to ${to}`);
    }
    if (to === LeadStatus.LOST && !reason?.trim()) {
      throw new LeadServiceError("Marking a lead LOST requires a reason");
    }

    const updated = await tx.lead.update({
      where: { id: leadId },
      data: {
        status: to,
        lost_reason: to === LeadStatus.LOST ? reason!.trim() : null,
        updated_at: new Date(),
      },
    });

    await tx.activity.create({
      data: {
        type: ActivityType.STATUS_CHANGE,
        body:
          `${lead.status} → ${to}` +
          (to === LeadStatus.LOST ? ` — ${reason!.trim()}` : ""),
        lead_id: leadId,
        actor_id: actor.id,
      },
    });

    await tx.auditLog.create({
      data: {
        actor_id: actor.id,
        action: "lead.transition",
        entity_type: "lead",
        entity_id: leadId.toString(),
        before: { status: lead.status },
        after: { status: to, lost_reason: to === LeadStatus.LOST ? reason : null },
      },
    });

    return updated;
  });
}

export async function addLeadActivity(
  actor: StaffUser,
  leadId: bigint,
  type: "NOTE" | "CALL",
  body: string,
) {
  const lead = await db.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) throw new LeadServiceError("Lead not found");

  return db.activity.create({
    data: {
      type: type === "CALL" ? ActivityType.CALL : ActivityType.NOTE,
      body,
      lead_id: leadId,
      actor_id: actor.id,
    },
  });
}

export async function assignLead(actor: StaffUser, leadId: bigint, staffId: string | null) {
  return db.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new LeadServiceError("Lead not found");

    const updated = await tx.lead.update({
      where: { id: leadId },
      data: { assigned_to_id: staffId, updated_at: new Date() },
    });

    const target = staffId
      ? await tx.staffUser.findUnique({ where: { id: staffId }, select: { name: true } })
      : null;

    await tx.activity.create({
      data: {
        type: ActivityType.SYSTEM,
        body: target ? `Assigned to ${target.name}` : "Unassigned",
        lead_id: leadId,
        actor_id: actor.id,
      },
    });

    return updated;
  });
}
