"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, AuthError } from "@/src/lib/auth";
import { StaffRole } from "@/src/generated/prisma/enums";
import { transitionSchema, noteSchema, assignSchema } from "@/src/modules/leads/schemas";
import {
  transitionLead,
  addLeadActivity,
  assignLead,
  LeadServiceError,
} from "@/src/modules/leads/service";

function errorMessage(err: unknown): string {
  if (err instanceof LeadServiceError || err instanceof AuthError) return err.message;
  console.error("[admin action]", err);
  return "Something went wrong";
}

export async function transitionLeadAction(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId") ?? "");
  try {
    const staff = await requireStaff(StaffRole.COUNSELOR);
    const input = transitionSchema.parse({
      leadId,
      to: formData.get("to"),
      reason: formData.get("reason") || undefined,
    });
    await transitionLead(staff, BigInt(input.leadId), input.to, input.reason);
  } catch (err) {
    redirect(`/admin/leads/${leadId}?error=${encodeURIComponent(errorMessage(err))}`);
  }
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

export async function addNoteAction(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId") ?? "");
  try {
    const staff = await requireStaff(StaffRole.COUNSELOR);
    const input = noteSchema.parse({
      leadId,
      type: formData.get("type"),
      body: formData.get("body"),
    });
    await addLeadActivity(staff, BigInt(input.leadId), input.type, input.body);
  } catch (err) {
    redirect(`/admin/leads/${leadId}?error=${encodeURIComponent(errorMessage(err))}`);
  }
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function assignLeadAction(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId") ?? "");
  try {
    const staff = await requireStaff(StaffRole.COUNSELOR);
    const input = assignSchema.parse({
      leadId,
      staffId: formData.get("staffId") || null,
    });
    await assignLead(staff, BigInt(input.leadId), input.staffId);
  } catch (err) {
    redirect(`/admin/leads/${leadId}?error=${encodeURIComponent(errorMessage(err))}`);
  }
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
}
