import { STATUS_META, TIMELINE, timelineIndex, type OrderStatus } from "@/lib/orders";

const TONE: Record<string, string> = {
  neutral: "border-border text-muted",
  action: "border-primary bg-primary-light text-primary",
  good: "border-success/30 bg-success-light text-success",
  bad: "border-destructive/30 bg-destructive-light text-destructive",
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
      <div className="rounded border border-destructive/30 bg-destructive-light px-5 py-4">
        <p className="label text-destructive">Closed</p>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
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
            } ${done || now ? "border-primary/30" : "border-border"}`}
            style={{ marginLeft: 4 }}
          >
            <span
              className="absolute left-0 top-1 size-2.5 -translate-x-1/2 rounded-full border-2"
              style={{
                background: now ? "var(--color-primary)" : "var(--color-surface)",
                borderColor: done || now ? "var(--color-primary)" : "var(--color-border)",
              }}
              aria-hidden
            />
            <p className={`text-[14.5px] ${now ? "text-foreground" : done ? "text-muted" : "text-subtle"}`}>
              {meta.label}
            </p>
            {now && <p className="text-[13px] leading-relaxed text-muted">{meta.blurb}</p>}
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
      <p className="text-[14px] leading-relaxed text-muted">
        Not priced yet. We will send a quote before anything is charged.
      </p>
    );
  }

  const govt = governmentPaise ?? 0;
  const total = govt + professionalPaise;

  return (
    <dl className="flex flex-col gap-px overflow-hidden rounded border border-border">
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
    <div className="flex items-baseline justify-between gap-4 bg-surface-2 px-4 py-3">
      <dt className={`text-[13.5px] ${strong ? "text-foreground" : "text-muted"}`}>
        {label}
        {note && <span className="ml-2 text-[12px] text-subtle">{note}</span>}
      </dt>
      <dd className={`shrink-0 font-mono text-[14px] tabular-nums ${strong ? "text-primary" : "text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}
