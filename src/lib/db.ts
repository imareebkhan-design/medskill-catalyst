import { PrismaClient } from "@/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Runtime connections go through the Supabase transaction pooler (DATABASE_URL).
// Migrations/introspection use DIRECT_URL via prisma.config.ts — never swap them.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });
  // DB region is ap-northeast-1 — a cross-region round trip costs ~300ms+,
  // so the default 2s maxWait/5s timeout are too tight for interactive txs.
  return new PrismaClient({
    adapter,
    transactionOptions: { maxWait: 10_000, timeout: 20_000 },
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
