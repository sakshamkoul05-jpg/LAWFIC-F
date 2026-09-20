/**
 * The four back-office roles, and what each may do.
 *
 * THIS IS A MIRROR, NOT THE RULE
 *
 * The rule is in the database: staff_can() decides, RLS enforces, and the
 * trigger on public.staff refuses the two changes that would lock everybody
 * out. What lives here is the same ladder in TypeScript so a page can hide a
 * button a role cannot use and an action can return an honest sentence instead
 * of a policy violation.
 *
 * If the two ever disagree, the database wins and the page is wrong. That is
 * the right way round: a UI check is a courtesy, and a courtesy is not a
 * security boundary.
 */

export type StaffRole = "owner" | "admin" | "staff" | "guest";

export type Capability =
  /** See the back office at all. */
  | "view"
  /** Change orders, customers, content, categories, jobs. */
  | "operate"
  /** Change site settings. */
  | "settings"
  /** Add, change and remove people. */
  | "people";

/** Must match staff_roles.rank in the migration. */
export const ROLE_RANK: Record<StaffRole, number> = {
  owner: 40,
  admin: 30,
  staff: 20,
  guest: 10,
};

const REQUIRED: Record<Capability, number> = {
  view: 10,
  operate: 20,
  settings: 30,
  people: 40,
};

export const ROLES: {
  role: StaffRole;
  label: string;
  description: string;
}[] = [
  {
    role: "owner",
    label: "Super admin",
    description:
      "Everything, including adding and removing people. Only an owner can change who has access.",
  },
  {
    role: "admin",
    label: "Admin",
    description:
      "Everything except managing people: orders, customers, content, categories, jobs and site settings.",
  },
  {
    role: "staff",
    label: "Staff",
    description:
      "The day-to-day work: orders, customers, content, categories and jobs. Cannot change site settings or people.",
  },
  {
    role: "guest",
    label: "Guest",
    description:
      "Read only. Can see the back office and cannot change anything, and cannot see the customer directory.",
  },
];

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && value in ROLE_RANK;
}

export function can(role: StaffRole | null, capability: Capability): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= REQUIRED[capability];
}

export function roleLabel(role: StaffRole | null): string {
  return ROLES.find((r) => r.role === role)?.label ?? "No access";
}

/**
 * What one person may do to another's role.
 *
 * Nobody hands out a role above their own, and nobody edits their own — both
 * are refused by the database trigger as well, but saying so before the click
 * is kinder than a raised exception afterwards.
 */
export function mayChange(
  actor: { id: string; role: StaffRole | null },
  target: { id: string; role: StaffRole },
): { allowed: true } | { allowed: false; reason: string } {
  if (!can(actor.role, "people")) {
    return { allowed: false, reason: "Only an owner can change who has access." };
  }
  if (actor.id === target.id) {
    return { allowed: false, reason: "You cannot change your own role. Ask another owner." };
  }
  return { allowed: true };
}
