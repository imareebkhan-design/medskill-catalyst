/**
 * Create the first CMS Super Admin (or add another CMS user).
 *
 *   npx tsx scripts/create-cms-admin.ts
 *
 * Credentials are prompted for interactively — never passed as arguments,
 * because argv is visible in shell history and to `ps` on a shared machine.
 * The password is read with terminal echo disabled, confirmed twice, hashed
 * with the same production scrypt implementation the login route uses, and
 * then dropped. The plaintext is never printed, logged, or stored.
 *
 * Safe to re-run: an existing email is reported and left untouched.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", quiet: true });

import { createInterface } from "node:readline/promises";
import { stdin, stdout, exit } from "node:process";
import { PrismaClient } from "../src/generated/prisma/client";
import { CmsRole, CmsUserStatus } from "../src/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword, passwordProblem, MIN_PASSWORD_LENGTH } from "../src/lib/password";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CTRL_C = "\u0003";    // Ctrl-C
const BACKSPACE = "\u007f"; // DEL

/** Read a line with echo suppressed, so the password never appears on screen. */
async function promptHidden(question: string): Promise<string> {
  stdout.write(question);
  const wasRaw = stdin.isTTY ? stdin.isRaw : false;
  if (stdin.isTTY) stdin.setRawMode(true);

  return new Promise<string>((resolve, reject) => {
    let value = "";

    const cleanup = () => {
      stdin.off("data", onData);
      if (stdin.isTTY) stdin.setRawMode(wasRaw);
      stdin.pause();
    };

    const onData = (chunk: Buffer) => {
      for (const ch of chunk.toString("utf8")) {
        if (ch === "\r" || ch === "\n") {
          cleanup();
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === CTRL_C) {
          cleanup();
          stdout.write("\n");
          reject(new Error("Cancelled."));
          return;
        }
        if (ch === BACKSPACE || ch === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += ch;
      }
    };

    stdin.resume();
    stdin.on("data", onData);
  });
}

/**
 * Refuse to create accounts against a non-local database unless the operator
 * has explicitly opted in.
 *
 * This script loads .env.local, which on this project points at the PRODUCTION
 * Supabase instance. Running it bare would therefore target production by
 * default — a footgun that has to be closed at the script, not by remembering
 * to type an env prefix every time.
 */
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

function describeTarget(url: string): { host: string; database: string; isLocal: boolean } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { host: "(unparseable)", database: "(unknown)", isLocal: false };
  }
  const host = parsed.hostname;
  return {
    host,
    database: parsed.pathname.replace(/^\//, "") || "(default)",
    isLocal: LOCAL_HOSTS.has(host),
  };
}

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DIRECT_URL (or DATABASE_URL) is not set. Check .env.local.");
    exit(1);
  }

  // Always state the target before asking for anything. Credentials are never
  // printed — only the host and database name.
  const target = describeTarget(url);
  console.log(`\n  Target database: ${target.database} on ${target.host}`);

  if (!target.isLocal && process.env.CMS_ALLOW_REMOTE !== "1") {
    console.error(
      "\n✗ Refusing to run: that is not a local database.\n" +
        "\n  This script loads .env.local, which points at production.\n" +
        "  For local development, prefix the command with a local connection:\n" +
        "\n    DIRECT_URL=\"postgresql://$(whoami)@127.0.0.1:5432/medskills_cms_dev\" \\\n" +
        "      npx tsx scripts/create-cms-admin.ts\n" +
        "\n  If you genuinely intend to create an account on the remote database,\n" +
        "  re-run with CMS_ALLOW_REMOTE=1 set.\n",
    );
    exit(1);
  }

  if (!stdin.isTTY) {
    console.error("✗ This script must be run in an interactive terminal.");
    exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  try {
    console.log("\n  MedSkills CMS — create an admin account\n");

    const email = (await rl.question("  Email:      ")).trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      console.error("\n✗ That does not look like a valid email address.");
      exit(1);
    }

    // Reject duplicates before asking for anything else.
    const existing = await db.cmsUser.findUnique({
      where: { email },
      select: { id: true, role: true, status: true },
    });
    if (existing) {
      console.error(
        `\n✗ ${email} already has a CMS account (${existing.role}, ${existing.status}).` +
          `\n  Nothing was changed. Use the CMS team settings to edit it.`,
      );
      exit(1);
    }

    const fullName = (await rl.question("  Full name:  ")).trim();
    if (fullName.length < 2) {
      console.error("\n✗ Please enter a full name.");
      exit(1);
    }

    const roleAnswer = (await rl.question("  Role [super_admin]: ")).trim().toLowerCase();
    const role =
      roleAnswer === "" || roleAnswer === "super_admin"
        ? CmsRole.SUPER_ADMIN
        : roleAnswer === "content_admin"
          ? CmsRole.CONTENT_ADMIN
          : roleAnswer === "content_editor"
            ? CmsRole.CONTENT_EDITOR
            : null;
    if (!role) {
      console.error("\n✗ Role must be super_admin, content_admin or content_editor.");
      exit(1);
    }

    // rl must release stdin before raw-mode reading, or both consume keystrokes.
    rl.pause();

    console.log(`\n  Password must be at least ${MIN_PASSWORD_LENGTH} characters,`);
    console.log("  with at least one letter and one number. Input is hidden.\n");

    const password = await promptHidden("  Password:   ");
    const problem = passwordProblem(password);
    if (problem) {
      console.error(`\n✗ ${problem}`);
      exit(1);
    }

    const confirm = await promptHidden("  Confirm:    ");
    if (confirm !== password) {
      console.error("\n✗ The two passwords do not match. Nothing was created.");
      exit(1);
    }

    const password_hash = await hashPassword(password);

    const user = await db.cmsUser.create({
      data: {
        email,
        full_name: fullName,
        password_hash,
        role,
        status: CmsUserStatus.ACTIVE,
      },
      select: { id: true, email: true, full_name: true, role: true },
    });

    console.log("\n✓ CMS account created.\n");
    console.log(`    Name:  ${user.full_name}`);
    console.log(`    Email: ${user.email}`);
    console.log(`    Role:  ${user.role}`);
    console.log(`    ID:    ${user.id}\n`);
    console.log("  Sign in at /cms/login\n");
  } finally {
    rl.close();
    await db.$disconnect();
  }
}

main().catch((err) => {
  // Print only the message — an exception object could carry connection details.
  console.error(`\n✗ ${err instanceof Error ? err.message : "Unexpected error."}`);
  exit(1);
});
