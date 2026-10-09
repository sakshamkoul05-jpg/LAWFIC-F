"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * "What we need from you", as a checklist the customer can tick while they
 * gather things — so they arrive at the request form with everything, instead
 * of finding out at the quote that a proof is missing.
 *
 * Ticks live in this browser only (localStorage, per service). They are a
 * convenience, not a record, so a private window or cleared storage simply
 * starts unticked.
 */
export function DocumentChecklist({ slug, documents }: { slug: string; documents: string[] }) {
  const key = `lawfic.checklist.${slug}`;
  const [ticked, setTicked] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setTicked(new Set(JSON.parse(raw) as number[]));
    } catch {
      /* storage unavailable — start empty */
    }
  }, [key]);

  function toggle(i: number) {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      try {
        localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const done = documents.filter((_, i) => ticked.has(i)).length;
  const pct = documents.length ? Math.round((done / documents.length) * 100) : 0;

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border" aria-hidden>
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-[12px] tabular-nums text-muted" aria-live="polite">
          {done}/{documents.length} ready
        </span>
      </div>
      <ul className="grid gap-px overflow-hidden rounded border border-border sm:grid-cols-2">
        {documents.map((d, i) => {
          const on = ticked.has(i);
          return (
            <li key={d}>
              <label className="flex h-full cursor-pointer items-start gap-3 bg-surface-2 px-5 py-4 text-[14px] leading-relaxed text-muted transition-colors hover:bg-surface">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(i)}
                  className="mt-1 size-4 shrink-0 accent-[var(--color-primary)]"
                />
                <span className={on ? "text-foreground line-through decoration-primary/40" : ""}>{d}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[12.5px] text-subtle">
        {done === documents.length && documents.length > 0 ? "All set — go ahead and request it above. " : "Ticks are saved in this browser. "}
        Keep the originals in your{" "}
        <Link href="/vault" className="text-primary hover:underline">
          document vault
        </Link>{" "}
        so you never hunt for them twice.
      </p>
    </div>
  );
}
