import { randomBytes, randomInt } from "node:crypto";
import { CERTIFICATE_ID_FORMAT, VERIFICATION_TOKEN_BYTES } from "./config";

/** Uniform random string from the certificate-ID alphabet (no modulo bias: randomInt). */
export function randomSuffix(
  length: number = CERTIFICATE_ID_FORMAT.randomLength,
  rand: (max: number) => number = randomInt,
): string {
  const a = CERTIFICATE_ID_FORMAT.alphabet;
  let out = "";
  for (let i = 0; i < length; i++) out += a[rand(a.length)];
  return out;
}

const PROGRAM_CODE_RE = new RegExp(`^${CERTIFICATE_ID_FORMAT.programCodePattern}$`);

export function isValidProgramCode(code: string): boolean {
  return PROGRAM_CODE_RE.test(code);
}

export function generateCertificateId(
  opts: { programCode: string; year: number },
  rand?: (max: number) => number,
): string {
  if (!isValidProgramCode(opts.programCode)) {
    throw new Error(`Invalid program code "${opts.programCode}"`);
  }
  return CERTIFICATE_ID_FORMAT.template
    .replace("{PREFIX}", CERTIFICATE_ID_FORMAT.prefix)
    .replace("{YEAR}", String(opts.year))
    .replace("{PROGRAM}", opts.programCode)
    .replace("{RANDOM}", randomSuffix(CERTIFICATE_ID_FORMAT.randomLength, rand));
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const CERT_ID_RE = new RegExp(
  "^" +
    CERTIFICATE_ID_FORMAT.template
      .split(/(\{[A-Z]+\})/)
      .map((part) => {
        switch (part) {
          case "{PREFIX}":
            return escapeRe(CERTIFICATE_ID_FORMAT.prefix);
          case "{YEAR}":
            return "\\d{4}";
          case "{PROGRAM}":
            return CERTIFICATE_ID_FORMAT.programCodePattern;
          case "{RANDOM}":
            return `[${CERTIFICATE_ID_FORMAT.alphabet}]{${CERTIFICATE_ID_FORMAT.randomLength}}`;
          default:
            return escapeRe(part);
        }
      })
      .join("") +
    "$",
);

/**
 * Normalize what a person typed into the /verify box: trim, uppercase, unify
 * dash look-alikes, drop internal whitespace. Exact match only after this —
 * no fuzzy matching (PRD §7).
 */
export function normalizeCertificateId(input: string): string {
  return input
    .slice(0, 64)
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[‐-―−﹘﹣－_]/g, "-")
    .replace(/\s+/g, "")
    .replace(/-+/g, "-")
    .trim();
}

export function isWellFormedCertificateId(id: string): boolean {
  return id.length <= 40 && CERT_ID_RE.test(id);
}

export function generateVerificationToken(): string {
  return randomBytes(VERIFICATION_TOKEN_BYTES).toString("base64url");
}

const TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;

export function isWellFormedToken(token: string): boolean {
  return TOKEN_RE.test(token);
}
