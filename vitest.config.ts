import { defineConfig } from "vitest/config";
import path from "node:path";

const root = path.resolve(__dirname);

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: root + "/" },
      { find: /^server-only$/, replacement: path.join(root, "tests/stubs/server-only.ts") },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgresql://postgres@localhost:5433/msc_test?host=/tmp",
      CREDENTIAL_STORAGE: "local",
      CREDENTIAL_PUBLIC_BASE_URL: "https://medskillscatalyst.com",
      CREDENTIAL_EMAIL_MODE: "off",
      ADMIN_AUTH_MODE: "passcode",
    },
  },
});
