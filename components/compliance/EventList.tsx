import Link from "next/link";
import type { ReactNode } from "react";
import { daysBetween, formatDue, stateOf, type ComplianceEvent } from "@/lib/compliance/calendar";
import { fileWithLawficHref } from "@/lib/compliance/links";
import { Chip } from "./ui";

/**
 * A list of obligations with their state. Used by the free calendar (no
 * account, nothing marked filed) and the dashboard (which passes `filed` and
 * an `action` slot for the "Mark filed" button).
 */
export function EventList({
  events,
  today,
  filed = new Set<string>(),
  action,
  empty = "Nothing due in this window.",
}: {
  events: ComplianceEvent[];
  today: string;
  filed?: Set<string>;
  action?: (e: ComplianceEvent, isFiled: boolean) => ReactNode;
  empty?: string;
}) {
  if (events.length === 0) {
    return <p className="rounded-2xl border border-border bg-surface px-5 py-6 text-[13.5px] text-muted">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {events.map((e) => {
        const st = stateOf(e, today, filed);
        const d = daysBetween(today, e.due);
        const [y, m, day] = e.due.split("-");
        return (
          <li key={e.key} className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center ${st === "filed" ? "opacity-60" : ""}`}>
            <div className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-border bg-background/50 py-1.5 text-center" aria-hidden>
              <span className="font-mono text-[18px] leading-none tabular-nums text-foreground">{Number(day)}</span>
              <span className="type-label mt-1 text-[10px] text-subtle">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]} {y.slice(2)}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-medium text-foreground">{e.title}</p>
                <span className="text-[12px] text-subtle">· {e.period}</span>
                {st === "filed" && <Chip tone="good">Filed</Chip>}
                {st === "overdue" && <Chip tone="bad">{-d} day{d === -1 ? "" : "s"} overdue</Chip>}
                {st === "due-soon" && <Chip tone="warn">{d === 0 ? "Due today" : `Due in ${d} day${d === 1 ? "" : "s"}`}</Chip>}
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                {e.what} <span className="text-subtle">· {e.authority} · due {formatDue(e.due)}</span>
              </p>
              {e.caveat && <p className="mt-0.5 text-[11.5px] text-subtle">{e.caveat}</p>}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {st !== "filed" && (
                <Link
                  href={fileWithLawficHref(e.serviceSlug)}
                  className="rounded-full border border-border px-3.5 py-1.5 text-[12px] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  File with LAWFIC
                </Link>
              )}
              {action?.(e, st === "filed")}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
