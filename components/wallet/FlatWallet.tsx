"use client";

import { useId, useMemo } from "react";
import { EMBOSS, THREADS, getColor, getFinish, type WalletConfig } from "@/lib/wallet3d/finishes";
import { formatPaise } from "@/lib/money";

/**
 * The wallet, drawn flat.
 *
 * WHAT THIS REPLACED, AND WHY IT HAD TO
 *
 * WalletStage renders the 3D card holder when it can. When it cannot — no
 * WebGL, or the customer has asked their system to reduce motion — it renders
 * the caller's fallback instead, and that fallback used to be PhysicalWallet:
 * a leather BIFOLD from the previous design, configured from a different set of
 * columns, in a different material vocabulary. A customer with reduce-motion
 * switched on saw a midnight-and-brass bifold; the same customer on the same
 * account with it switched off saw a walnut pull-up card holder. Two different
 * products, one account.
 *
 * Reduce motion is not a rare setting. It is not an edge case that can be left
 * showing the wrong object.
 *
 * So this draws the SAME configuration the 3D version does — the same finish,
 * the same colour from that finish's own list, the same stamping, thread and
 * engraving — out of gradients and one SVG. No three, no canvas, nothing to
 * initialise. It is what the fallback should always have been.
 *
 * HOW THE MATERIAL IS FAKED
 *
 * Four layers, each doing something the real material does:
 *
 *   1. the colour, lifted at the top because light falls from above;
 *   2. grain — a seeded scatter of soft blooms, dense and nearly invisible one
 *      at a time. Seeded, so it is the same grain on every render: grain that
 *      reshuffles reads as television static;
 *   3. a pull-up sheen across the upper third, which is the whole character of
 *      the default finish and the reason it is called Pull-up;
 *   4. a burnished rim, because the darkest part of any leather panel is the
 *      couple of millimetres at its edge.
 *
 * The finish's own `grain`, `tooth` and `roughness` numbers drive it, so
 * Saffiano reads as tighter and more regular than Suede without a second code
 * path.
 */

const W = 420;
const H = 268;
/** The front panel, as a fraction of the body. The rest is where money sits. */
const COVER = 0.68;

/** xorshift32. Deterministic, dependency-free, and nothing here is secret. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

export default function FlatWallet({
  config,
  balancePaise,
  open = false,
  onToggle,
}: {
  config: WalletConfig;
  balancePaise: number;
  open?: boolean;
  onToggle?: () => void;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const finish = getFinish(config.finish);
  const colour = getColor(finish, config.color);
  const emboss = EMBOSS.find((e) => e.id === config.emboss) ?? EMBOSS[0];
  const thread = THREADS.find((t) => t.id === config.thread) ?? THREADS[0];

  /* A woven finish gets a lattice instead of cells, and a tight grain gets more
     marks at a smaller radius. One set of numbers, two looks. */
  const grain = useMemo(() => {
    const rnd = seeded(finish.grain * 1000 + finish.tooth * 37 + 11);
    /* Tuned against the rendered object. The first pass used radii up to ~11
       at 5% on a 420pt panel, and it read as pale blotches rather than as
       hide — grain is dense and nearly invisible mark by mark; it is the
       ACCUMULATION that becomes texture. More marks, smaller, fainter. */
    const count = Math.round(70 + finish.tooth * 30);
    const base = 1.4 + finish.grain * 3.4;
    return Array.from({ length: count }, () => ({
      cx: rnd() * W,
      cy: rnd() * H,
      r: base + rnd() * (base * 1.4),
      o: (0.012 + rnd() * 0.018) * (0.6 + finish.roughness),
      dark: rnd() > 0.34,
    }));
  }, [finish.grain, finish.tooth, finish.roughness]);

  const lit = mix(colour.hex, "#ffffff", 0.16);
  const deep = mix(colour.hex, "#000000", 0.42);
  const threadHex = thread.hex || mix(colour.hex, "#ffffff", 0.3);

  const body = (
    <div
      className="relative select-none"
      style={{ width: "100%", maxWidth: W, aspectRatio: `${W} / ${H}` }}
    >
      {/* ── the body ── */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[22px]"
        style={{
          background: `linear-gradient(180deg, ${lit} 0%, ${colour.hex} 55%, ${deep} 100%)`,
          boxShadow: "0 28px 56px rgba(0,0,0,.45), 0 2px 0 rgba(255,255,255,.05) inset",
        }}
      >
        <Surface uid={`${uid}b`} grain={grain} weave={finish.weave} />
        {/* The well the notes sit in. Without it they look stuck on rather than
            held. */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: "34%",
            background: "linear-gradient(180deg, rgba(0,0,0,.55), transparent)",
          }}
        />
      </div>

      {/* ── the money, showing above the cover when it is open ── */}
      <div
        aria-hidden
        className="absolute inset-x-0 flex justify-center transition-transform duration-500 ease-out"
        style={{
          top: "13%",
          transform: open ? "translateY(-16%)" : "translateY(6%)",
          opacity: open ? 1 : 0.9,
        }}
      >
        <div
          className="rounded-[6px] px-4 py-2 font-mono text-[11px] tabular-nums"
          style={{
            background: "linear-gradient(135deg,#F0E6CE,#D8C79B)",
            color: "#4A3A15",
            boxShadow: "0 6px 14px rgba(0,0,0,.35)",
          }}
        >
          {formatPaise(balancePaise)}
        </div>
      </div>

      {/* ── the front panel ── */}
      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden rounded-[22px] transition-transform duration-500 ease-out"
        style={{
          height: `${COVER * 100}%`,
          transformOrigin: "bottom",
          transform: open ? "perspective(900px) rotateX(26deg)" : "none",
          background: `linear-gradient(180deg, ${lit} 0%, ${colour.hex} 58%, ${deep} 100%)`,
          boxShadow: "0 -6px 18px rgba(0,0,0,.35)",
        }}
      >
        <Surface uid={`${uid}c`} grain={grain} weave={finish.weave} />

        {/* Saddle stitch. Inset, in a groove, and close in value to the hide —
            a bright dash at full strength reads as a dashed CSS border sitting
            on top of the panel rather than as thread sewn into it. */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${W} ${H * COVER}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <rect
            x={11}
            y={11}
            width={W - 22}
            height={H * COVER - 22}
            rx={13}
            fill="none"
            stroke="#000"
            strokeOpacity={0.38}
            strokeWidth={3}
            strokeDasharray="4 3.4"
            strokeLinecap="round"
          />
          <rect
            x={11}
            y={11}
            width={W - 22}
            height={H * COVER - 22}
            rx={13}
            fill="none"
            stroke={threadHex}
            strokeOpacity={0.42}
            strokeWidth={1.4}
            strokeDasharray="4 3.4"
            strokeLinecap="round"
          />
        </svg>

        {/* The stamp. Two offset copies: a dark one pressed down and a light one
            catching the edge of the impression. Foiled stampings get their
            metal colour; a blind one is only the leather, pressed. */}
        <div className="absolute inset-x-0 bottom-[16%] flex flex-col items-center">
          <span
            className="relative font-mono text-[13px] font-semibold uppercase"
            style={{ letterSpacing: "0.42em", color: emboss.hex ?? "rgba(0,0,0,.45)" }}
          >
            <span
              aria-hidden
              className="absolute inset-0"
              style={{ transform: "translateY(1px)", color: "rgba(255,255,255,.07)" }}
            >
              LAWFIC
            </span>
            LAWFIC
          </span>

          {config.engraving ? (
            <span
              className="mt-1.5 font-mono text-[9.5px] uppercase"
              style={{ letterSpacing: "0.3em", color: emboss.hex ?? "rgba(0,0,0,.38)" }}
            >
              {config.engraving}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!onToggle) {
    return <div className="mx-auto flex w-full justify-center">{body}</div>;
  }

  return (
    <div className="mx-auto flex w-full justify-center">
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Close the wallet" : "Open the wallet"}
        aria-expanded={open}
        className="w-full max-w-[420px] rounded-[22px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--brand)]"
      >
        {body}
      </button>
    </div>
  );
}

/** Grain and the burnished rim, shared by the body and the front panel. */
function Surface({
  uid,
  grain,
  weave,
}: {
  uid: string;
  grain: { cx: number; cy: number; r: number; o: number; dark: boolean }[];
  weave?: boolean;
}) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <radialGradient id={`${uid}pull`} cx="30%" cy="16%" r="84%">
          <stop offset="0" stopColor="#fff" stopOpacity={0.1} />
          <stop offset="0.55" stopColor="#fff" stopOpacity={0.02} />
          <stop offset="1" stopColor="#000" stopOpacity={0.24} />
        </radialGradient>
        {weave && (
          <pattern id={`${uid}weave`} width={5} height={5} patternUnits="userSpaceOnUse">
            <path d="M0 5 L5 0" stroke="#fff" strokeOpacity={0.05} strokeWidth={0.7} />
            <path d="M0 0 L5 5" stroke="#000" strokeOpacity={0.07} strokeWidth={0.7} />
          </pattern>
        )}
      </defs>

      {weave ? (
        <rect x={0} y={0} width={W} height={H} fill={`url(#${uid}weave)`} />
      ) : (
        grain.map((g, i) => (
          <circle
            key={i}
            cx={g.cx}
            cy={g.cy}
            r={g.r}
            fill={g.dark ? "#000" : "#fff"}
            opacity={g.o}
          />
        ))
      )}

      <rect x={0} y={0} width={W} height={H} fill={`url(#${uid}pull)`} />
      <rect
        x={1}
        y={1}
        width={W - 2}
        height={H - 2}
        rx={21}
        fill="none"
        stroke="#000"
        strokeOpacity={0.4}
        strokeWidth={2}
      />
    </svg>
  );
}

/** Blend two hex colours. Written out rather than pulled in — it is six lines. */
function mix(hex: string, towards: string, amount: number): string {
  const a = parse(hex);
  const b = parse(towards);
  if (!a || !b) return hex;
  const c = a.map((v, i) => Math.round(v + (b[i]! - v) * amount));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function parse(hex: string): number[] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
