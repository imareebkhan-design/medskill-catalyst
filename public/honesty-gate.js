const fs = require('fs');
const path = require('path');

const BANNED_PATTERNS = [
  /audited certificate approved/i,
  /third-party verified salary/i,
  /verified by third-party/i,
  /A\.\s*K\.\s*Sen/i,
  /M\.\s*Choudhury/i,
  /S\.\s*Raghavan/i,
  /200\+\s*graduates\s*placed/i,
  /93%\s*placed/i,
  /47\s*days\s*average/i,
  /only\s*18\s*seats\s*remaining/i,
  /PASS#\s*MS-2026-9982/i
];

const TARGET_FILE = path.join(__dirname, 'index.html');

console.log('🛡️ Running MedSkills Compliance Honesty Gate...');

if (!fs.existsSync(TARGET_FILE)) {
  console.log(`⚠️ index.html not found at ${TARGET_FILE}, skipping check.`);
  process.exit(0);
}

const content = fs.readFileSync(TARGET_FILE, 'utf8');
let violationsCount = 0;

BANNED_PATTERNS.forEach((pattern) => {
  const match = content.match(pattern);
  if (match) {
    console.error(`❌ Compliance violation: Found banned pattern "${match[0]}" in index.html`);
    violationsCount++;
  }
});

if (violationsCount > 0) {
  console.error(`🚨 Honesty Gate failed with ${violationsCount} violation(s). Build aborted.`);
  process.exit(1);
} else {
  console.log('✅ Honesty Gate passed. Code is clean and compliant.');
  process.exit(0);
}
