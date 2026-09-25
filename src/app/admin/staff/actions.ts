"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError, requirePermission } from "@/src/lib/auth";
import { Permission } from "@/src/lib/permissions";
import { StaffRole } from "@/src/generated/prisma/enums";
import { addStaff, StaffError, updateStaff } from "@/src/modules/staff/service";
import { ZodError } from "zod";

function message(err: unknown) {
  if (err instanceof StaffError || err instanceof AuthError) return err.message;
  if (err instanceof ZodError) return "Check the name, email and role.";
  console.error("[staff action]", err);
  return "Something went wrong";
}

export async function addStaffAction(formData: FormData) {
  try {
    const actor = await requirePermission(Permission.StaffManage, { individual: true });
    await addStaff(
      { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? ""), role: formData.get("role") as StaffRole },
      actor,
    );
  } catch (err) {
    redirect(`/admin/staff?error=${encodeURIComponent(message(err))}`);
  }
  revalidatePath("/admin/staff");
  redirect("/admin/staff?ok=added");
}

export async function updateStaffAction(formData: FormData) {
  try {
    const actor = await requirePermission(Permission.StaffManage, { individual: true });
    const id = String(formData.get("id") ?? "");
    const role = formData.get("role");
    const active = formData.get("is_active");
    await updateStaff(
      id,
      {
        ...(role && Object.values(StaffRole).includes(role as StaffRole) ? { role: role as StaffRole } : {}),
        ...(active === "true" || active === "false" ? { is_active: active === "true" } : {}),
      },
      actor,
    );
  } catch (err) {
    redirect(`/admin/staff?error=${encodeURIComponent(message(err))}`);
  }
  revalidatePath("/admin/staff");
  redirect("/admin/staff?ok=updated");
}
