import { StaffRole } from "@/src/generated/prisma/enums";

/**
 * Central permission matrix. Pages, server actions and API routes ask
 * "can this role do X?" — never "is this role ADMIN?" — so the matrix is the
 * single place to change who may do what.
 *
 * Existing CRM pages still use the older rank check (requireStaff(minRole));
 * the credential system uses permissions exclusively.
 */
export const Permission = {
  /** Search/list credentials and see public-equivalent fields + status. */
  CredentialsView: "credentials.view",
  /** See private learner data on credentials (email, delivery addresses). */
  CredentialsViewPrivate: "credentials.view_private",
  CredentialsIssue: "credentials.issue",
  CredentialsBulkIssue: "credentials.bulk_issue",
  CredentialsResend: "credentials.resend",
  CredentialsRevoke: "credentials.revoke",
  CredentialsReissue: "credentials.reissue",
  ProgramsManage: "programs.manage",
  CohortsManage: "cohorts.manage",
  TemplatesManage: "templates.manage",
  SettingsManage: "credential_settings.manage",
  /** Full audit trail, including internal revocation reasons. */
  AuditViewFull: "audit.view_full",
  StaffManage: "staff.manage",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const VIEW: Permission[] = [Permission.CredentialsView];

const ISSUE: Permission[] = [
  ...VIEW,
  Permission.CredentialsViewPrivate,
  Permission.CredentialsIssue,
  Permission.CredentialsBulkIssue,
  Permission.CredentialsResend,
];

const ALL: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Record<StaffRole, ReadonlySet<Permission>> = {
  [StaffRole.ADMIN]: new Set(ALL),
  // ISSUER is the PRD's "Issuer / Operations" role. ACCOUNTS carries the same
  // credential rights by decision (2026-09-25) and does NOT revoke by default.
  [StaffRole.ISSUER]: new Set(ISSUE),
  [StaffRole.ACCOUNTS]: new Set(ISSUE),
  // Not named in the credential role model: least privilege → read-only.
  [StaffRole.COUNSELOR]: new Set(VIEW),
  [StaffRole.VIEWER]: new Set(VIEW),
};

export function can(role: StaffRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  [StaffRole.ADMIN]: "Admin",
  [StaffRole.ISSUER]: "Issuer",
  [StaffRole.ACCOUNTS]: "Accounts",
  [StaffRole.COUNSELOR]: "Counselor",
  [StaffRole.VIEWER]: "Viewer",
};
