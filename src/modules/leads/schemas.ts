import { z } from "zod";
import { LeadStatus, LeadSource } from "@/src/generated/prisma/enums";

export const leadStatusSchema = z.nativeEnum(LeadStatus);
export const leadSourceSchema = z.nativeEnum(LeadSource);

export const transitionSchema = z.object({
  leadId: z.string().min(1),
  to: leadStatusSchema,
  reason: z.string().trim().max(500).optional(),
});

export const noteSchema = z.object({
  leadId: z.string().min(1),
  type: z.enum(["NOTE", "CALL"]),
  body: z.string().trim().min(1, "Note cannot be empty").max(2000),
});

export const assignSchema = z.object({
  leadId: z.string().min(1),
  staffId: z.string().min(1).nullable(),
});

export const listFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: leadStatusSchema.optional(),
  source: leadSourceSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type ListFilters = z.infer<typeof listFiltersSchema>;
