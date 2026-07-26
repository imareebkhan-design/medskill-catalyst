import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Env lives in .env.local (Vercel convention); the generated .env is only a placeholder.
loadEnv({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI operations (introspect/migrate) must use the DIRECT connection,
    // never the transaction pooler. Runtime uses DATABASE_URL via src/lib/db.ts.
    url: process.env["DIRECT_URL"],
  },
});
