"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

/**
 * The passport journey as a booklet.
 *
 * The cover opens; each page is one step; turning a page leaves that step's
 * stamp on the collage, so by the last page the booklet is full of the route
 * the customer has just walked. Beside it the fee rolls like an odometer as
 * the options change.
 *
 * Deliberately not a facsimile: no national emblem, no "Republic of India",
 * no real passport layout — an illustrated booklet in LAWFIC's own colours.
 * The State Emblem is protected (Emblems and Names Act, 1950) and a lookalike
 * passport is the wrong thing for a compliance company to draw.
 *
 * Fees as revised from 1 July 2026 (Ministry of External Affairs). When MEA
 * revises them again, edit FEES and nothing else.
 */

type Scheme = "normal" | "tatkaal";
type Applicant = "adult" | "minor";

const FEES: Record<Applicant, Partial<Record<36 | 60, Record<Scheme, number>>>> = {
  adult: { 36: { normal: 2500, tatkaal: 5000 }, 60: { normal: 3500, tatkaal: 6000 } },
  minor: { 36: { normal: 1750, tatkaal: 4250 } },
};

type Step = { title: string; body: string; bring?: string[]; stamp: { shape: "round" | "rect" | "oval" | "hex" | "tri"; tone: string; word: string } };

function steps(scheme: Scheme): Step[] {
  return [
    {
      title: "Apply online",
      body: "The application is filed on the Passport Seva portal. Most rejections start here — a name split differently from your documents, an address that does not match your proof.",
      bring: ["Proof of date of birth", "Proof of address", "Old passport, if you have one"],
      stamp: { shape: "round", tone: "var(--color-primary)", word: "FILED" },
    },
    {
      title: "Pay and book",
      body: "The fee is paid online and an appointment booked at a Passport Seva Kendra or Post Office PSK. Slots in big cities fill weeks ahead; smaller POPSKs are often sooner.",
      stamp: { shape: "rect", tone: "var(--color-accent)", word: "BOOKED" },
    },
    {
      title: "The appointment",
      body: "Documents are checked against the originals, then photograph and fingerprints. Bring every original whose copy you uploaded — one missing paper means a second visit.",
      bring: ["All originals", "Self-attested copies", "Appointment receipt"],
      stamp: { shape: "oval", tone: "var(--color-success)", word: "VERIFIED" },
    },
    {
      title: "Police verification",
      body:
        scheme === "tatkaal"
          ? "In Tatkaal the passport is usually printed first and police verification follows, unless your case needs it before issue."
          : "The local police station verifies your address and record, usually with a visit. The passport is printed once the report is clear.",
      stamp: { shape: "hex", tone: "var(--color-destructive)", word: "CLEARED" },
    },
    {
      title: "Printed and posted",
      body:
        scheme === "tatkaal"
          ? "Tatkaal passports are typically dispatched within a few working days of the appointment, by Speed Post."
          : "Printed and sent by Speed Post, usually two to four weeks after verification clears.",
      stamp: { shape: "tri", tone: "var(--color-primary)", word: "POSTED" },
    },
  ];
}

/* ── odometer ──────────────────────────────────────────────────────────── */

function Odometer({ value, reduced }: { value: number; reduced: boolean }) {
  const chars = `₹${value.toLocaleString("en-IN")}`.split("");
  return (
    <span className="inline-flex overflow-hidden font-mono text-[clamp(2.6rem,6vw,3.6rem)] leading-none tracking-[-0.04em] text-foreground tabular-nums" aria-hidden>
      {chars.map((c, i) =>
        /\d/.test(c) ? (
          <span key={`${chars.length}-${i}`} className="relative inline-block h-[1em] w-[0.62em] overflow-hidden">
            <motion.span
              className="absolute left-0 top-0 flex flex-col"
              initial={false}
              animate={{ y: `${-Number(c)}em` }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 20, delay: (chars.length - i) * 0.03 }}
            >
              {Array.from({ length: 10 }, (_, d) => (
                <span key={d} className="block h-[1em]">
                  {d}
                </span>
              ))}
            </motion.span>
          </span>
        ) : (
          <span key={`${chars.length}-${i}`} className="inline-block">
            {c}
          </span>
        ),
      )}
    </span>
  );
}

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[12.5px] text-muted">{label}</legend>
      <div className="mt-1.5 inline-flex rounded-full border border-border p-1">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <label
              key={String(o.value)}
              className={`relative cursor-pointer rounded-full px-4 py-1.5 text-[13px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50 ${
                o.disabled ? "cursor-not-allowed opacity-40" : on ? "text-background" : "text-foreground hover:text-primary"
              }`}
            >
              {on && <motion.span layoutId={`seg-${label}`} className="absolute inset-0 rounded-full bg-primary" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
              <input type="radio" className="sr-only" checked={on} disabled={o.disabled} onChange={() => onChange(o.value)} />
              <span className="relative">{o.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ── stamps ────────────────────────────────────────────────────────────── */

function StampMark({ s, size = 92 }: { s: Step["stamp"]; size?: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 3 };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ color: s.tone }} aria-hidden>
      {s.shape === "round" && (
        <>
          <circle cx="50" cy="50" r="44" {...common} />
          <circle cx="50" cy="50" r="36" {...common} strokeWidth={1.4} />
        </>
      )}
      {s.shape === "rect" && <rect x="8" y="24" width="84" height="52" rx="6" {...common} />}
      {s.shape === "oval" && <ellipse cx="50" cy="50" rx="46" ry="32" {...common} />}
      {s.shape === "hex" && <polygon points="50,6 90,28 90,72 50,94 10,72 10,28" {...common} />}
      {s.shape === "tri" && <polygon points="50,8 94,88 6,88" {...common} />}
      <text x="50" y={s.shape === "tri" ? 70 : 54} textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="1.5" fill="currentColor">
        {s.word}
      </text>
      <text x="50" y={s.shape === "tri" ? 82 : 67} textAnchor="middle" fontSize="7" letterSpacing="1" fill="currentColor" opacity={0.8}>
        LAWFIC
      </text>
    </svg>
  );
}

const TILTS = [-12, 9, -5, 14, -9];
const SPOTS = [
  { left: "6%", top: "8%" },
  { left: "52%", top: "4%" },
  { left: "28%", top: "36%" },
  { left: "58%", top: "52%" },
  { left: "10%", top: "62%" },
];

/* ── the booklet ───────────────────────────────────────────────────────── */

export default function PassportBooklet() {
  const reduced = !!useReducedMotion();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const [scheme, setScheme] = useState<Scheme>("normal");
  const [who, setWho] = useState<Applicant>("adult");
  const [pages, setPages] = useState<36 | 60>(36);
  const [discount, setDiscount] = useState(false);

  const S = steps(scheme);
  const step = S[page];
  const effectivePages = who === "minor" ? 36 : pages;
  const base = FEES[who][effectivePages]![scheme];
  const fee = discount && scheme === "normal" ? Math.round(base * 0.9) : base;

  const go = (n: number) => {
    setDir(n > page ? 1 : -1);
    setPage(Math.max(0, Math.min(S.length - 1, n)));
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
      {/* booklet */}
      <div className="[perspective:1600px]">
        <motion.div
          className="relative mx-auto aspect-[1.42] w-full max-w-[600px]"
          initial={false}
          animate={{ x: open ? "0%" : "-25%" }}
          transition={reduced ? { duration: 0 } : { duration: 1.1, ease: [0.6, 0.05, 0.2, 1] }}
        >
          {/* inner spread — hidden until the cover lifts */}
          <motion.div
            className="absolute inset-0 grid grid-cols-2 overflow-hidden rounded-[18px] border border-border bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]"
            initial={false}
            animate={{ opacity: open ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 0.5, delay: open && !reduced ? 0.25 : 0 }}
          >
            {/* left: stamp collage */}
            <div className="relative border-r border-dashed border-border bg-[repeating-linear-gradient(0deg,transparent_0_22px,var(--color-border)_22px_23px)]">
              {open && S.slice(0, page + 1).map((s, i) => (
                <motion.div
                  key={`${s.stamp.word}-${scheme}`}
                  className="absolute"
                  style={{ left: SPOTS[i].left, top: SPOTS[i].top }}
                  initial={reduced || i < page ? false : { scale: 2.2, opacity: 0, rotate: TILTS[i] - 20 }}
                  animate={{ scale: 1, opacity: 0.88, rotate: TILTS[i] }}
                  transition={{ type: "spring", stiffness: 520, damping: 16, delay: reduced ? 0 : i === 0 && page === 0 ? 1.2 : 0.18 }}
                >
                  <StampMark s={s.stamp} size={78} />
                </motion.div>
              ))}
              <p className="absolute bottom-3 left-4 text-[10.5px] text-subtle">Illustration — not a real passport</p>
            </div>
            {/* right: the step page */}
            <div className="relative overflow-hidden p-5 sm:p-7">
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.div
                  key={`${page}-${scheme}`}
                  custom={dir}
                  initial={reduced ? false : { rotateY: dir > 0 ? 70 : -70, opacity: 0, transformOrigin: dir > 0 ? "0% 50%" : "100% 50%" }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={reduced ? undefined : { rotateY: dir > 0 ? -70 : 70, opacity: 0 }}
                  transition={{ duration: 0.38, ease: [0.3, 0.7, 0.2, 1] }}
                  className="flex h-full flex-col"
                >
                  <p className="font-mono text-[12px] text-subtle">
                    Page {page + 1} of {S.length}
                  </p>
                  <h3 className="mt-2 text-[clamp(1.1rem,2.4vw,1.5rem)] font-semibold leading-tight tracking-[-0.02em] text-foreground">{step.title}</h3>
                  <p className="mt-2 text-[clamp(11.5px,1.5vw,13.5px)] leading-relaxed text-muted">{step.body}</p>
                  {step.bring && (
                    <ul className="mt-3 hidden gap-1 sm:grid">
                      {step.bring.map((b) => (
                        <li key={b} className="text-[12.5px] text-foreground">
                          — {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* cover */}
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open the booklet"
            tabIndex={open ? -1 : 0}
            className="absolute inset-y-0 right-0 z-10 w-1/2 rounded-r-[18px] rounded-l-[6px] text-left [backface-visibility:hidden] [transform-style:preserve-3d] focus-visible:outline-2 focus-visible:outline-primary"
            style={{ transformOrigin: "0% 50%", background: "linear-gradient(135deg,#1d2b4a 0%,#14203a 100%)" }}
            initial={false}
            animate={{ rotateY: open ? -178 : 0 }}
            transition={reduced ? { duration: 0 } : { duration: 1.1, ease: [0.6, 0.05, 0.2, 1] }}
            whileHover={open || reduced ? undefined : { rotateY: -14 }}
          >
            <span className="absolute inset-3 rounded-[12px] border border-[#d0ae55]/35" aria-hidden />
            <span className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
              <svg viewBox="0 0 80 80" className="size-[30%] text-[#d0ae55]" aria-hidden>
                <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="40" cy="40" r="22" fill="none" stroke="currentColor" strokeWidth="1" />
                <path d="M40 4 L45 40 L40 76 L35 40 Z M4 40 L40 35 L76 40 L40 45 Z" fill="currentColor" opacity="0.85" />
              </svg>
              <span className="font-mono text-[clamp(11px,1.8vw,15px)] tracking-[0.4em] text-[#d0ae55]">PASSPORT</span>
              <span className="text-[clamp(10px,1.4vw,12px)] text-[#d0ae55]/75">Your route, page by page</span>
              <span className="mt-2 rounded-full border border-[#d0ae55]/50 px-3 py-1 text-[11px] text-[#e8d29a]">Tap to open</span>
            </span>
          </motion.button>
        </motion.div>

        {/* page controls */}
        <div className={`mt-6 flex items-center justify-center gap-3 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <button
            type="button"
            onClick={() => go(page - 1)}
            disabled={page === 0}
            className="rounded-full border border-border px-4 py-2 text-[13px] text-foreground hover:border-primary/40 disabled:opacity-35"
          >
            Previous page
          </button>
          <div className="flex gap-1.5" aria-hidden>
            {S.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === page ? "w-6 bg-primary" : i < page ? "w-1.5 bg-primary/50" : "w-1.5 bg-border"}`} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(page + 1)}
            disabled={page === S.length - 1}
            className="rounded-full bg-primary px-4 py-2 text-[13px] font-medium text-background hover:bg-primary-hover disabled:opacity-35"
          >
            {page === S.length - 1 ? "All stamped" : "Stamp and turn"}
          </button>
        </div>
      </div>

      {/* fee */}
      <div>
        <p className="text-[14px] text-muted">Government fee</p>
        <div className="mt-2" aria-live="polite">
          <Odometer value={fee} reduced={reduced} />
          <span className="sr-only">₹{fee.toLocaleString("en-IN")}</span>
        </div>
        <p className="mt-2 text-[12.5px] text-subtle">Paid to the Passport Seva portal. Revised from 1 July 2026.</p>

        <div className="mt-8 grid gap-5">
          <Segmented<Scheme>
            label="How soon"
            value={scheme}
            onChange={(v) => {
              setScheme(v);
              if (v === "tatkaal") setDiscount(false);
            }}
            options={[
              { value: "normal", label: "Normal" },
              { value: "tatkaal", label: "Tatkaal" },
            ]}
          />
          <Segmented<Applicant>
            label="Applicant"
            value={who}
            onChange={(v) => setWho(v)}
            options={[
              { value: "adult", label: "18 or over" },
              { value: "minor", label: "Under 18" },
            ]}
          />
          <Segmented<36 | 60>
            label="Booklet"
            value={effectivePages}
            onChange={(v) => setPages(v)}
            options={[
              { value: 36, label: "36 pages" },
              { value: 60, label: "60 pages", disabled: who === "minor" },
            ]}
          />
          <label className={`flex items-start gap-3 text-[13.5px] ${scheme === "tatkaal" ? "opacity-45" : "text-foreground"}`}>
            <input
              type="checkbox"
              checked={discount}
              disabled={scheme === "tatkaal"}
              onChange={(e) => setDiscount(e.target.checked)}
              className="mt-1 size-4 accent-[var(--color-primary)]"
            />
            <span>
              A first passport for a child under 8, or for someone over 60
              <span className="block text-[12px] text-subtle">10% off a fresh application in the normal scheme. Not for reissues.</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
