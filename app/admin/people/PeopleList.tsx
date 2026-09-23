"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ROLES, type StaffRole } from "@/lib/staff-roles";
import { changeRole, grantAccess, revokeAccess } from "./actions";

export type Person = {
  userId: string;
  email: string | null;
  name: string | null;
  role: StaffRole;
  note: string | null;
  lastSignInAt: string | null;
  createdAt: string;
  /** True for the person looking at the page. */
  isYou: boolean;
};

/**
 * The people with access, and the form for adding one.
 *
 * YOUR OWN ROW HAS NO CONTROLS
 *
 * Not hidden — shown, plainly, with the controls absent and a reason. The
 * database refuses a self-demotion anyway, but discovering that by pressing a
 * button and reading an exception is a worse way to learn it than seeing that
 * the button was never there.
 */
export default function PeopleList({
  people,
  canManage,
}: {
  people: Person[];
  canManage: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, onOk?: () => void) =>
    start(async () => {
      setError(null);
      const result = await fn();
      if (!result.ok) setError(result.error);
      else onOk?.();
    });

  const owners = people.filter((p) => p.role === "owner").length;

  return (
    <>
      {canManage &&
        (adding ? (
          <form
            action={(fd) => run(() => grantAccess(fd), () => setAdding(false))}
            className="grid gap-3 rounded-2xl border border-border px-4 py-4 sm:grid-cols-2"
          >
            <label className="block sm:col-span-2">
              <span className="block text-[10.5px] uppercase tracking-wide text-subtle">
                Email of somebody who already has an account
              </span>
              <input
                name="email"
                type="email"
                required
                placeholder="them@example.com"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-subtle focus:border-border-3"
              />
            </label>

            <label className="block">
              <span className="block text-[10.5px] uppercase tracking-wide text-subtle">Role</span>
              <select
                name="role"
                defaultValue="guest"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground"
              >
                {ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-[10.5px] uppercase tracking-wide text-subtle">
                Note — optional
              </span>
              <input
                name="note"
                placeholder="Accounts team"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-subtle focus:border-border-3"
              />
            </label>

            <div className="flex items-center gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-background disabled:opacity-50"
              >
                Grant access
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-lg px-3 py-2 text-[13px] text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-2.5 text-[13px] text-muted-foreground hover:text-foreground"
          >
            <Plus size={15} /> Give somebody access
          </button>
        ))}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-destructive-light px-3 py-2 text-[12.5px] text-destructive">
          {error}
        </p>
      )}

      <ul className="mt-6 space-y-2">
        {people.map((p) => (
          <li
            key={p.userId}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border px-4 py-3"
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-[14px] font-medium text-foreground">
                  {p.name ?? p.email ?? "Unnamed account"}
                </span>
                {p.isYou && (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] text-muted-foreground">
                    you
                  </span>
                )}
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                {p.email ?? "no email"}
                {p.note && ` · ${p.note}`}
              </span>
              <span className="mt-0.5 block truncate font-mono text-[10.5px] text-subtle">
                {p.userId}
              </span>
            </span>

            {canManage && !p.isYou ? (
              <select
                value={p.role}
                disabled={pending}
                onChange={(e) => run(() => changeRole(p.userId, e.target.value))}
                aria-label={`Role for ${p.email ?? p.userId}`}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12.5px] text-foreground"
              >
                {ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="rounded-full bg-surface-2 px-3 py-1 text-[12px] text-muted-foreground">
                {ROLES.find((r) => r.role === p.role)?.label ?? p.role}
              </span>
            )}

            {canManage && !p.isYou && (
              <button
                type="button"
                disabled={pending || (p.role === "owner" && owners === 1)}
                title={
                  p.role === "owner" && owners === 1
                    ? "This is the last owner. Make somebody else an owner first."
                    : undefined
                }
                onClick={() => {
                  if (confirm(`Remove back-office access for ${p.email ?? p.userId}?`)) {
                    run(() => revokeAccess(p.userId));
                  }
                }}
                aria-label="Remove access"
                className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive-light disabled:opacity-30"
              >
                <Trash2 size={15} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
