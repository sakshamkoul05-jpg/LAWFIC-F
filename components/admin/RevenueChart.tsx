"use client";

import { useId, useState } from "react";
import { formatPaise } from "@/lib/money";
import type { Bucket } from "@/lib/analytics";

/**
 * Revenue over time, as bars.
 *
 * WHY BARS AND NOT A LINE
 *
 * Each value is a discrete total for a closed period, not a sample of a
 * continuous quantity. A line drawn between Monday and Wednesday implies a
 * Tuesday value on the way between them; with real daily takings, Tuesday is
 * very often zero, and the line draws straight through the middle of a day
 * nothing was sold. Bars say "this day, this much" and say nothing at all about
 * the space between.
 *
 * ONE SERIES, SO NO LEGEND
 *
 * The heading names what the bars are. A legend box holding a single swatch
 * beside the same word is furniture.
 *
 * THE ZERO DAYS ARE DRAWN
 *
 * `revenueByDay` emits every day in the window including the empty ones, and
 * they render as a hairline on the baseline rather than as nothing. A gap the
 * eye can see is the difference between "six sales across a month" and "six
 * consecutive days of trade", which is what a chart that only plots non-zero
 * days silently shows instead.
 *
 * THE SCALE IS NAMED, NOT INFERRED
 *
 * One tick, at the top, labelled with the value it actually reaches. Bars with
 * no axis at all are a shape; an axis with rounded-up round numbers is a
 * different lie, because the tallest bar then does not touch the line it is
 * supposed to be measured against.
 */

export default function RevenueChart({
  buckets,
  heading,
  note,
}: {
  buckets: Bucket[];
  heading: string;
  note: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const tableId = useId();
  const [showTable, setShowTable] = useState(false);

  const peak = Math.max(...buckets.map((b) => b.paise), 1);
  const total = buckets.reduce((n, b) => n + b.paise, 0);
  const active = hover !== null ? buckets[hover] : null;

  /* Every label would be unreadable at thirty bars, so only the ends and the
     hovered one are printed. Selective, not absent. */
  const labelAt = (i: number) =>
    i === 0 || i === buckets.length - 1 || i === hover;

  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">{heading}</h3>
          <p className="mt-1 text-[12px] text-muted">{note}</p>
        </div>
        <p className="type-data text-[19px] text-foreground">{formatPaise(total)}</p>
      </div>

      {/* The readout sits above the plot and holds its height whether or not
          anything is hovered, so the chart does not jump as the pointer
          crosses it. */}
      <p className="mt-5 h-[18px] text-[12.5px] leading-none text-muted">
        {active ? (
          <>
            <span className="text-foreground">{active.label}</span> ·{" "}
            <span className="type-data text-foreground">{formatPaise(active.paise)}</span>
            {active.count > 0 && (
              <>
                {" "}
                · {active.count} order{active.count === 1 ? "" : "s"}
              </>
            )}
          </>
        ) : (
          <span className="text-subtle">Peak {formatPaise(peak)}</span>
        )}
      </p>

      <div
        className="relative mt-2"
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`${heading}. ${note}. Total ${formatPaise(total)}. The figures are in the table below.`}
      >
        {/* The one tick, at the value the tallest bar actually reaches. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 border-t border-dashed border-border"
        />

        <div className="flex h-[132px] items-end gap-[2px]">
          {buckets.map((b, i) => {
            const pct = (b.paise / peak) * 100;
            return (
              <button
                key={b.key}
                type="button"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${b.label}: ${formatPaise(b.paise)}`}
                /* The hit target is the full column height, not the bar. A 2px
                   bar on a zero day is impossible to point at otherwise. */
                className="group relative flex h-full flex-1 items-end outline-none"
              >
                <span
                  className="w-full rounded-t transition-colors"
                  style={{
                    /* A floor of 2px so an empty day is a mark on the baseline
                       rather than an absence. */
                    height: `max(2px, ${pct}%)`,
                    /* The resting fill is the accent at 55%, not the
                       `primary-light` token. That token is tuned for large
                       tinted panels and on a dark surface a 3px bar drawn in
                       it is barely separable from the background — the chart
                       read as a smudge. Same hue, enough of it to see. */
                    background:
                      hover === i
                        ? "var(--color-primary)"
                        : b.paise > 0
                          ? "color-mix(in oklab, var(--color-primary) 55%, transparent)"
                          : "var(--color-border-3, var(--color-border))",
                  }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-t ring-1 ring-transparent group-focus-visible:ring-primary"
                />
              </button>
            );
          })}
        </div>

        <div aria-hidden className="mt-2 flex gap-[2px]">
          {buckets.map((b, i) => (
            <span
              key={b.key}
              className={`min-w-0 flex-1 truncate text-center text-[9.5px] leading-none ${
                i === hover ? "text-foreground" : "text-subtle"
              }`}
            >
              {labelAt(i) ? b.label : ""}
            </span>
          ))}
        </div>
      </div>

      {/* A chart is a picture of numbers; the numbers themselves have to be
          reachable. Collapsed rather than hidden, so it is available to anyone
          who wants to read or copy the figures — not only to a screen reader. */}
      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        aria-expanded={showTable}
        aria-controls={tableId}
        className="mt-4 text-[11.5px] text-muted underline underline-offset-4 transition-colors hover:text-foreground"
      >
        {showTable ? "Hide the figures" : "Show the figures"}
      </button>

      {showTable && (
        <div id={tableId} className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                <th className="type-label px-3 py-2 text-muted">Period</th>
                <th className="type-label px-3 py-2 text-right text-muted">Revenue</th>
                <th className="type-label px-3 py-2 text-right text-muted">Orders</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((b) => (
                <tr key={b.key} className="border-t border-border">
                  <td className="px-3 py-1.5 text-[12px] text-foreground">{b.label}</td>
                  <td className="type-data px-3 py-1.5 text-right text-[12px] text-foreground">
                    {formatPaise(b.paise)}
                  </td>
                  <td className="type-data px-3 py-1.5 text-right text-[12px] text-muted">
                    {b.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
