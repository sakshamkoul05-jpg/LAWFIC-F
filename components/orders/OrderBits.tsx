import { STATUS_META, TIMELINE, timelineIndex, type OrderStatus } from "@/lib/orders";

const TONE: Record<string, string> = {
  neutral: "border-line-3 text-ash",
  action: "border-brass bg-brass/12 text-brass-hi",
  good: "border-jade/40 bg-jade/10 text-jade",
  bad: "border-rust/40 bg-rust/10 text-rust",
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`label shrink-0 rounded-full border px-2.5 py-1 ${TONE[meta.tone]}`}>
      {meta.label}
    </span>
  );
}

/**
 * Where the order has got to. A rejected order leaves the path, so it gets a
 * plain statement instead of a progress rail that would imply it is still
 * moving.
 */
export function Timeline({ status }: { status: OrderStatus }) {
  if (status === "rejected") {
    return (
      <div className="rounded border border-rust/30 bg-rust/5 px-5 py-4">
        <p className="label text-rust">Closed</p>
        <p className="mt-2 text-[14px] leading-relaxed text-ash">
          {STATUS_META.rejected.blurb}
        </p>
      </div>
    );
  }

  const at = timelineIndex(status);

  return (
    <ol className="flex flex-col">
      {TIMELINE.map((s, i) => {
        const done = i < at;
        const now = i === at;
        const meta = STATUS_META[s];

        return (
          <li
            key={s}
            className={`relative grid gap-1 pb-6 pl-7 last:pb-0 ${
              i === TIMELINE.length - 1 ? "" : "border-l"
            } ${done || now ? "border-brass-dim" : "border-line"}`}
            style={{ marginLeft: 4 }}
          >
            <span
              className="absolute left-0 top-1 size-2.5 -translate-x-1/2 rounded-full border-2"
              style={{
                background: now ? "var(--color-brass)" : "var(--color-ink)",
                borderColor: done || now ? "var(--color-brass)" : "var(--color-line-3)",
              }}
              aria-hidden
            />
            <p className={`text-[14.5px] ${now ? "text-bone" : done ? "text-ash" : "text-slate"}`}>
              {meta.label}
            </p>
            {now && <p className="text-[13px] leading-relaxed text-ash">{meta.blurb}</p>}
          </li>
        );
      })}
    </ol>
  );
}

/** Government fee and our fee, never one blended figure. */
export function FeeBreakdown({
  governmentPaise,
  professionalPaise,
  format,
}: {
  governmentPaise: number | null;
  professionalPaise: number | null;
  format: (paise: number) => string;
}) {
  if (professionalPaise === null) {
    return (
      <p className="text-[14px] leading-relaxed text-ash">
        Not priced yet. We will send a quote before anything is charged.
      </p>
    );
  }

  const govt = governmentPaise ?? 0;
  const total = govt + professionalPaise;

  return (
    <dl className="flex flex-col gap-px overflow-hidden rounded border border-line bg-line">
      <Row label="Government fee" value={format(govt)} note={govt === 0 ? "Free at source" : undefined} />
      <Row label="LAWFIC professional fee" value={format(professionalPaise)} />
      <Row label="Total" value={format(total)} strong />
    </dl>
  );
}

function Row({
  label,
  value,
  note,
  strong,
}: {
  label: string;
  value: string;
  note?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 bg-ink-2 px-4 py-3">
      <dt className={`text-[13.5px] ${strong ? "text-bone" : "text-ash"}`}>
        {label}
        {note && <span className="ml-2 text-[12px] text-slate">{note}</span>}
      </dt>
      <dd className={`shrink-0 font-mono text-[14px] tnum ${strong ? "text-brass" : "text-bone"}`}>
        {value}
      </dd>
    </div>
  );
}
