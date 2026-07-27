/**
 * Deduplicate leads by phone number (the canonical identity).
 *
 *   npx tsx scripts/dedupe-leads.ts          # dry-run: report only, no changes
 *   npx tsx scripts/dedupe-leads.ts --apply  # perform the merge in a transaction
 *
 * Per phone group we keep ONE survivor (prefer a real-email row over the
 * `@partial…` placeholder, then the most recent), merge useful fields onto it,
 * re-point child records (enrollment links, enrollments, invoices, activities)
 * to the survivor, and delete the redundant rows.
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

const APPLY = process.argv.includes("--apply");

function normPhone(raw?: string | null): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  d = d.slice(-10);
  return d.length === 10 ? d : null;
}
// Phone groups to leave untouched (e.g. genuine name mismatch / collision).
const SKIP_PHONES = new Set(["9971699186"]);
const isPartial = (email: string) => /@partial\.medskillscatalyst\.com$/i.test(email);
const FORM_RANK: Record<string, number> = { masterclass: 1, counseling: 2, cohort_registration: 3 };

async function main() {
  const { db } = await import("../src/lib/db");
  const leads = await db.lead.findMany({ orderBy: { created_at: "asc" } });

  // Group by phone (from mobile, fallback to partial-email local part).
  const groups = new Map<string, typeof leads>();
  let noPhone = 0;
  for (const l of leads) {
    let phone = normPhone(l.mobile);
    if (!phone) {
      const m = l.email.match(/^(\d{10,})@partial/i);
      if (m) phone = normPhone(m[1]);
    }
    if (!phone) { noPhone++; continue; }
    if (!groups.has(phone)) groups.set(phone, [] as unknown as typeof leads);
    groups.get(phone)!.push(l);
  }

  const dupGroups = [...groups.entries()].filter(([phone, g]) => g.length > 1 && !SKIP_PHONES.has(phone));
  const skipped = [...groups.entries()].filter(([phone, g]) => g.length > 1 && SKIP_PHONES.has(phone));
  if (skipped.length) console.log(`Skipping ${skipped.length} group(s) by request: ${skipped.map(([p]) => "+91" + p).join(", ")}`);
  console.log(`\n${APPLY ? "APPLYING MERGE" : "DRY-RUN (no changes)"}`);
  console.log(`Total leads: ${leads.length} | unique phones: ${groups.size} | no-phone (left as-is): ${noPhone}`);
  console.log(`Phone groups with duplicates: ${dupGroups.length}\n`);

  const plan: { survivorId: bigint; loserIds: bigint[]; phone: string; patch: Record<string, unknown> }[] = [];

  for (const [phone, g] of dupGroups) {
    // Survivor: real-email rows first, then most recently created.
    const ranked = [...g].sort((a, b) => {
      const ap = isPartial(a.email) ? 1 : 0, bp = isPartial(b.email) ? 1 : 0;
      if (ap !== bp) return ap - bp; // real email first
      return b.created_at.getTime() - a.created_at.getTime(); // newest first
    });
    const survivor = ranked[0];
    const losers = ranked.slice(1);

    // Merge fields: earliest first-touch, deepest form/status, fill blanks.
    const earliest = g.reduce((a, b) => (a.created_at <= b.created_at ? a : b));
    const realEmail = g.find((l) => !isPartial(l.email))?.email ?? survivor.email;
    const realName =
      g.map((l) => l.full_name).find((n) => n && !/^test$/i.test(n.trim())) ?? survivor.full_name;
    const deepestForm = g.reduce((a, b) => ((FORM_RANK[b.form_type] ?? 0) > (FORM_RANK[a.form_type] ?? 0) ? b : a)).form_type;
    const pick = <K extends keyof typeof survivor>(k: K) =>
      g.map((l) => l[k]).find((v) => v !== null && v !== undefined && v !== "") ?? survivor[k];

    const patch = {
      email: realEmail,
      full_name: realName,
      mobile: `+91${phone}`,
      form_type: deepestForm,
      created_at: earliest.created_at,
      background: pick("background"),
      utm_source: pick("utm_source"),
      utm_campaign: pick("utm_campaign"),
      landing_page: pick("landing_page"),
      converted_student_id: g.map((l) => l.converted_student_id).find(Boolean) ?? null,
      assigned_to_id: g.map((l) => l.assigned_to_id).find(Boolean) ?? null,
    };

    plan.push({ survivorId: survivor.id, loserIds: losers.map((l) => l.id), phone, patch });

    console.log(`📞 +91${phone}`);
    console.log(`   KEEP  id ${survivor.id} → "${realName}" <${realEmail}> [${deepestForm}]`);
    for (const l of losers) console.log(`   DROP  id ${l.id} → "${l.full_name}" <${l.email}> [${l.form_type}]`);
  }

  const totalDrop = plan.reduce((s, p) => s + p.loserIds.length, 0);
  console.log(`\nSurvivors: ${dupGroups.length} | rows to delete: ${totalDrop} | result: ${leads.length - totalDrop} leads`);

  if (!APPLY) {
    console.log("\nDry-run only. Re-run with --apply to perform the merge.");
    return;
  }

  // ── Apply ──
  // Order matters: re-point children and DELETE the duplicates first so their
  // (unique) emails are freed, THEN update survivors — otherwise assigning a
  // duplicate's email to the survivor while it still exists violates the
  // unique-email constraint.
  const loserIds = plan.flatMap((p) => p.loserIds);
  await db.$transaction(async (tx) => {
    for (const p of plan) {
      await tx.enrollmentLink.updateMany({ where: { lead_id: { in: p.loserIds } }, data: { lead_id: p.survivorId } });
      await tx.enrollment.updateMany({ where: { source_lead_id: { in: p.loserIds } }, data: { source_lead_id: p.survivorId } });
      await tx.invoice.updateMany({ where: { lead_id: { in: p.loserIds } }, data: { lead_id: p.survivorId } });
      await tx.activity.updateMany({ where: { lead_id: { in: p.loserIds } }, data: { lead_id: p.survivorId } });
    }
    await tx.lead.deleteMany({ where: { id: { in: loserIds } } });
    for (const p of plan) {
      await tx.lead.update({ where: { id: p.survivorId }, data: p.patch });
    }
  }, { timeout: 30000 });

  console.log(`\n✅ Merge complete. Deleted ${loserIds.length} rows. Leads now: ${await db.lead.count()}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
