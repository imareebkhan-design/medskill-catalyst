import { db } from "@/src/lib/db";
import type { Prisma } from "@/src/generated/prisma/client";
import { LeadStatus, LeadSource } from "@/src/generated/prisma/enums";
import type { ListFilters } from "./schemas";

export const PAGE_SIZE = 25;

export async function listLeads(filters: ListFilters) {
  const where: Prisma.LeadWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;
  if (filters.q) {
    where.OR = [
      { full_name: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { mobile: { contains: filters.q } },
    ];
  }

  const [total, leads] = await Promise.all([
    db.lead.count({ where }),
    db.lead.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { assigned_to: { select: { name: true } } },
    }),
  ]);

  return { total, leads, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getLead(id: bigint) {
  return db.lead.findUnique({
    where: { id },
    include: {
      assigned_to: { select: { id: true, name: true } },
      course_interest: { select: { id: true, name: true } },
      activities: {
        orderBy: { created_at: "desc" },
        take: 50,
        include: { actor: { select: { name: true } } },
      },
      invoices: { select: { id: true, invoice_no: true, total: true, status: true } },
    },
  });
}

export async function listActiveStaff() {
  return db.staffUser.findMany({
    where: { is_active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
}

export async function dashboardStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [total, byStatus, bySource, newThisWeek, recent] = await Promise.all([
    db.lead.count(),
    db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    db.lead.groupBy({ by: ["source"], _count: { _all: true } }),
    db.lead.count({ where: { created_at: { gte: weekAgo } } }),
    db.lead.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      select: { id: true, full_name: true, email: true, status: true, created_at: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    Object.values(LeadStatus).map((s) => [s, 0]),
  ) as Record<LeadStatus, number>;
  for (const row of byStatus) statusCounts[row.status] = row._count._all;

  const sourceCounts = Object.fromEntries(
    Object.values(LeadSource).map((s) => [s, 0]),
  ) as Record<LeadSource, number>;
  for (const row of bySource) sourceCounts[row.source] = row._count._all;

  return { total, statusCounts, sourceCounts, newThisWeek, recent };
}
