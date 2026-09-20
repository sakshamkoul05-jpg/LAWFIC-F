"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { formatPaise } from "@/lib/money";

/**
 * The customer list, with the search box.
 *
 * WHY THE FILTERING IS IN THE BROWSER
 *
 * Every keystroke filtering server-side is a round trip, a loading state and a
 * race between responses arriving out of order. The rows are already on the
 * page — the server sent them — so matching against them costs nothing and
 * happens between frames. `useDeferredValue` keeps the input responsive if the
 * list ever gets big enough for the filter to take a frame of its own.
 *
 * This holds because the page is a back office with one row per signed-up
 * customer. If that list ever reaches the tens of thousands the fix is to
 * paginate on the server and search there — see the note in the page.
 */

export type DirectoryRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  businessType: string | null;
  balancePaise: number;
  filings: number;
  waiting: number;
  lastSignInAt: string | null;
  createdAt: string;
};

/** Short, absolute, and unambiguous — "2 days ago" hides which Tuesday. */
function shortDate(iso: string | null): string {
  if (!iso) return "never";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export default function CustomerDirectory({ rows }: { rows: DirectoryRow[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.phone, r.city, r.businessType, r.id]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [rows, deferred]);

  return (
    <>
      <div className="mb-5">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, phone, city or user id…"
          aria-label="Search customers"
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[13.5px] text-foreground outline-none placeholder:text-subtle focus:border-border-3"
        />
        {deferred.trim() && (
          <p className="mt-2 text-[12px] text-muted-foreground">
            {filtered.length} of {rows.length}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-border px-5 py-10 text-center text-[14px] text-muted-foreground">
          {rows.length === 0 ? "Nobody has signed up yet." : "Nobody matches that."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => {
            const idle = daysSince(r.lastSignInAt);
            return (
              <li key={r.id}>
                <Link
                  href={`/admin/customers/${r.id}`}
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border px-5 py-4 transition-colors hover:border-border-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-medium text-foreground">
                      {r.name ?? "Unnamed account"}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                      {r.email ?? "no email on record"}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-subtle">
                      {[r.phone, r.city, r.businessType].filter(Boolean).join(" · ") ||
                        "No details given"}
                    </span>
                  </span>

                  {r.waiting > 0 && (
                    <span className="rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-medium text-primary">
                      {r.waiting} waiting
                    </span>
                  )}

                  <span className="w-24 text-right">
                    <span className="block font-mono text-[13.5px] tabular-nums text-foreground">
                      {formatPaise(r.balancePaise)}
                    </span>
                    <span className="block text-[11px] text-subtle">wallet</span>
                  </span>

                  <span className="w-16 text-right">
                    <span className="block font-mono text-[13.5px] tabular-nums text-foreground">
                      {r.filings}
                    </span>
                    <span className="block text-[11px] text-subtle">
                      filing{r.filings === 1 ? "" : "s"}
                    </span>
                  </span>

                  {/* Last seen, with the number of days only when it is long
                      enough to mean something. "Yesterday" is noise; "90 days"
                      is a reason to call. */}
                  <span className="w-24 text-right">
                    <span className="block text-[12.5px] tabular-nums text-foreground">
                      {shortDate(r.lastSignInAt)}
                    </span>
                    <span className="block text-[11px] text-subtle">
                      {idle !== null && idle >= 14 ? `${idle} days idle` : "last seen"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
