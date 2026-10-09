"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";

/**
 * Which law a marriage is registered under, as two threads that come together.
 *
 * Two questions decide the route: has the wedding already happened, and what
 * are the couple's religions. Each answer pulls the threads closer; with both
 * answered they braid into one and the route appears. Under the Special
 * Marriage Act a 30-day notice calendar fills from the date the notice is
 * filed, showing the earliest wedding day and the day the notice lapses.
 *
 * Law as of October 2026: Hindu Marriage Act 1955 s.8; Special Marriage Act
 * 1954 ss.4, 5, 6, 7, 15, 16; Indian Christian Marriage Act 1872.
 */

type Wedded = "yes" | "no";
type Faith = "hbjs" | "christian" | "muslim" | "mixed";

type Route = {
  id: string;
  law: string;
  title: string;
  summary: string;
  steps: string[];
  witnesses: number;
  witnessNote: string;
  time: string;
  notice: boolean;
  aside?: string;
};

const ROUTES: Record<string, Route> = {
  hma: {
    id: "hma",
    law: "Hindu Marriage Act, 1955 — section 8",
    title: "Register the marriage you have already had",
    summary: "For a wedding already performed where both of you are Hindu, Buddhist, Jain or Sikh. No notice period.",
    steps: [
      "Joint application with proof of age, address and the wedding (invitation card, photographs)",
      "Affidavits from both of you on age, marital status and the date of marriage",
      "Both of you appear before the Registrar with your witnesses",
      "The certificate is usually issued the same day",
    ],
    witnesses: 2,
    witnessNote: "Two witnesses who attended the wedding is the usual rule; some states ask for a gazetted officer.",
    time: "Usually 1–3 weeks to get the appointment, then same-day",
    notice: false,
  },
  christian: {
    id: "christian",
    law: "Indian Christian Marriage Act, 1872",
    title: "Get the certified copy of your church registration",
    summary:
      "A church wedding by a licensed minister is entered in the marriage register and sent to the Registrar of Marriages. What most people need is a certified copy of that entry.",
    steps: [
      "The church's marriage certificate and register details",
      "Application to the Registrar of Marriages for a certified extract",
      "If the entry was never sent on, we take it up with the church and the registrar",
    ],
    witnesses: 2,
    witnessNote: "Two witnesses signed at the wedding itself; none are needed for the copy.",
    time: "2–4 weeks",
    notice: false,
  },
  s15: {
    id: "s15",
    law: "Special Marriage Act, 1954 — section 15",
    title: "Register an existing marriage under the Special Marriage Act",
    summary:
      "For a marriage already performed in another form — an interfaith ceremony, or where your state has no simpler route. It becomes a marriage under the Special Marriage Act, with a 30-day public notice first.",
    steps: [
      "Joint application to the Marriage Officer of the district",
      "Public notice for 30 days, for objections",
      "Both of you appear with three witnesses and the marriage is entered",
    ],
    witnesses: 3,
    witnessNote: "Three witnesses sign in front of the Marriage Officer.",
    time: "About 5–6 weeks, most of it the notice period",
    notice: true,
    aside: "Some states also run compulsory registration of all marriages under their own rules, which can be quicker — we check yours first.",
  },
  sma: {
    id: "sma",
    law: "Special Marriage Act, 1954",
    title: "Marry, and register, under the Special Marriage Act",
    summary:
      "A civil marriage open to any two people, of any religion or none. The groom must be at least 21, the bride at least 18, and one of you must have lived in the district for 30 days before giving notice.",
    steps: [
      "Notice of intended marriage to the district's Marriage Officer",
      "The notice is published for 30 days, for objections",
      "After 30 days and within three months, you marry before the Marriage Officer",
      "The certificate is entered and signed the same day",
    ],
    witnesses: 3,
    witnessNote: "Three witnesses sign the declaration with you.",
    time: "31 days at the earliest, from the notice",
    notice: true,
  },
};

function pick(w: Wedded | null, f: Faith | null): Route | null {
  if (!w || !f) return null;
  if (w === "no") return ROUTES.sma;
  if (f === "hbjs") return ROUTES.hma;
  if (f === "christian") return ROUTES.christian;
  return ROUTES.s15;
}

/* ── the threads ───────────────────────────────────────────────────────── */

const W = 140;
const H = 520;
const N = 48;

function threadPath(side: 1 | -1, p: number): string {
  // p: 0 = apart, 1 = braided. Threads run parallel at the top and braid below
  // a join line that rises as p grows.
  const join = H * (1 - 0.82 * p);
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const y = (i / N) * H;
    let x: number;
    if (y < join) {
      const ease = Math.max(0, (join - y) / Math.max(join, 1));
      x = W / 2 + side * (18 + 28 * ease * (1 - p * 0.6));
    } else {
      const k = (y - join) / 56;
      x = W / 2 + side * 18 * Math.cos(k * Math.PI);
    }
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function Threads({ p, reduced, horizontal = false }: { p: number; reduced: boolean; horizontal?: boolean }) {
  const a = useMemo(() => threadPath(1, p), [p]);
  const b = useMemo(() => threadPath(-1, p), [p]);
  const t = { duration: reduced ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] as const };
  return (
    <svg viewBox={horizontal ? `0 0 ${H} ${W}` : `0 0 ${W} ${H}`} className="h-full w-full" aria-hidden>
      <g transform={horizontal ? `translate(0 ${W}) rotate(-90)` : undefined}>
      <motion.path d={a} initial={false} animate={{ d: a }} transition={t} stroke="var(--color-primary)" strokeWidth={5} strokeLinecap="round" fill="none" />
      <motion.path d={b} initial={false} animate={{ d: b }} transition={t} stroke="var(--color-accent)" strokeWidth={5} strokeLinecap="round" fill="none" />
      <motion.circle
        cx={W / 2}
        cy={H - 8}
        r={9}
        fill="var(--color-primary)"
        initial={false}
        animate={{ scale: p >= 1 ? 1 : 0, opacity: p >= 1 ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 14, delay: reduced ? 0 : 0.6 }}
      />
      </g>
    </svg>
  );
}

/* ── the notice calendar ───────────────────────────────────────────────── */

function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n));
}
function addMonths(iso: string, n: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, d));
}
const fmt = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function NoticeCalendar({ reduced }: { reduced: boolean }) {
  const today = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
  const [filed, setFiled] = useState(today);
  /* "After the expiry of thirty days" from the notice: day 31 is the first
     possible wedding day. */
  const earliest = addDays(filed, 31);
  const lapse = addMonths(filed, 3);

  return (
    <div className="mt-8 rounded-3xl border border-border bg-background/40 p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[15px] font-medium text-foreground">The 30-day notice</p>
          <p className="mt-1 text-[13px] text-muted">Pick the day the notice is filed.</p>
        </div>
        <input
          type="date"
          value={filed}
          min={today}
          onChange={(e) => e.target.value && setFiled(e.target.value)}
          className="rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-[14px] text-foreground outline-none focus:border-primary/50"
          aria-label="Date the notice is filed"
        />
      </div>

      <div key={filed} className="mt-6 grid max-w-[560px] grid-cols-10 gap-1.5" role="img" aria-label={`Thirty days of notice from ${fmt(addDays(filed, 0))}`}>
        {Array.from({ length: 30 }, (_, i) => (
          <motion.span
            key={i}
            initial={reduced ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: reduced ? 0 : i * 0.025, type: "spring", stiffness: 400, damping: 22 }}
            className="flex aspect-square items-center justify-center rounded-md bg-accent-light font-mono text-[10px] text-accent"
          >
            {addDays(filed, i + 1).getUTCDate()}
          </motion.span>
        ))}
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-primary-light px-4 py-3">
          <dt className="text-[12px] text-muted">Earliest wedding day</dt>
          <dd className="mt-1 text-[15px] font-medium text-primary">{fmt(earliest)}</dd>
        </div>
        <div className="rounded-2xl bg-surface-2 px-4 py-3">
          <dt className="text-[12px] text-muted">Notice lapses if you have not married by</dt>
          <dd className="mt-1 text-[15px] font-medium text-foreground">{fmt(lapse)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[12px] text-subtle">If anyone objects, the Marriage Officer decides the objection first, which can add time.</p>
    </div>
  );
}

/* ── the whole thing ───────────────────────────────────────────────────── */

function Choice<T extends string>({
  legend,
  value,
  onChange,
  options,
}: {
  legend: string;
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="text-[17px] font-medium tracking-[-0.01em] text-foreground">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label
              key={o.value}
              className={`relative cursor-pointer rounded-full border px-4 py-2 text-[13.5px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50 ${
                on ? "border-primary bg-primary text-background" : "border-border text-foreground hover:border-primary/40"
              }`}
            >
              <input type="radio" className="sr-only" checked={on} onChange={() => onChange(o.value)} />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function MarriageRoutes() {
  const reduced = !!useReducedMotion();
  const [wedded, setWedded] = useState<Wedded | null>(null);
  const [faith, setFaith] = useState<Faith | null>(null);
  const route = pick(wedded, faith);
  const p = ((wedded ? 1 : 0) + (faith ? 1 : 0)) / 2;

  return (
    <div className="grid gap-8 md:grid-cols-[140px_1fr] md:gap-12">
      <div className="hidden md:block">
        <div className="sticky top-40 h-[520px]">
          <Threads p={p} reduced={reduced} />
        </div>
      </div>

      <div className="min-w-0">
        {/* mobile: the threads lie on their side */}
        <div className="mb-6 flex h-16 justify-center md:hidden">
          <Threads p={p} reduced={reduced} horizontal />
        </div>

        <div className="grid gap-8">
          <Choice<Wedded>
            legend="Has the wedding already taken place?"
            value={wedded}
            onChange={setWedded}
            options={[
              { value: "yes", label: "Yes, we are married" },
              { value: "no", label: "Not yet" },
            ]}
          />
          <Choice<Faith>
            legend="Your religions"
            value={faith}
            onChange={setFaith}
            options={[
              { value: "hbjs", label: "Both Hindu, Buddhist, Jain or Sikh" },
              { value: "christian", label: "Both Christian" },
              { value: "muslim", label: "Both Muslim" },
              { value: "mixed", label: "Different religions, or none" },
            ]}
          />
        </div>

        <AnimatePresence mode="wait">
          {route ? (
            <motion.article
              key={route.id}
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.35 }}
              className="mt-10 rounded-[28px] border border-primary/30 bg-surface p-6 sm:p-8"
              aria-live="polite"
            >
              <p className="text-[12.5px] text-primary">{route.law}</p>
              <h3 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.025em] text-foreground">{route.title}</h3>
              <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">{route.summary}</p>

              <ol className="mt-6 grid gap-3">
                {route.steps.map((s, i) => (
                  <li key={s} className="flex gap-4">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[12px] text-muted">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-[14px] leading-relaxed text-foreground">{s}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1.5" aria-hidden>
                    {Array.from({ length: route.witnesses }, (_, i) => (
                      <motion.span
                        key={i}
                        initial={reduced ? false : { y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: reduced ? 0 : 0.6 + i * 0.12 }}
                        className="flex size-8 items-end justify-center overflow-hidden rounded-full border-2 border-surface bg-surface-2"
                      >
                        <span className="mb-[-6px] size-5 rounded-full bg-muted/50" />
                      </motion.span>
                    ))}
                  </div>
                  <div>
                    <p className="text-[14px] text-foreground">{route.witnesses} witnesses</p>
                    <p className="max-w-xs text-[12px] text-subtle">{route.witnessNote}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[14px] text-foreground">{route.time}</p>
                  <p className="text-[12px] text-subtle">Both of you appear in person.</p>
                </div>
              </div>

              {route.aside && <p className="mt-6 border-l-2 border-accent pl-3 text-[13px] text-muted">{route.aside}</p>}
              {route.id === "sma" && faith === "hbjs" && (
                <p className="mt-6 border-l-2 border-accent pl-3 text-[13px] text-muted">
                  Or marry in a Hindu ceremony first and register it afterwards under the Hindu Marriage Act — no notice
                  period. Choose “Yes, we are married” to see that route.
                </p>
              )}

              {route.notice && <NoticeCalendar reduced={reduced} />}
            </motion.article>
          ) : (
            <motion.p
              key="empty"
              initial={false}
              animate={{ opacity: 1 }}
              className="mt-10 rounded-[28px] border border-dashed border-border px-6 py-10 text-center text-[14px] text-subtle"
            >
              Answer both and your route appears here.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
