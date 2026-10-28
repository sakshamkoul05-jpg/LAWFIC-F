"use client";

import { motion, useReducedMotion, type TargetAndTransition, type Transition } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

/**
 * Pictures of the work the studio does beyond websites, drawn in code.
 *
 * Each one is a 16:10 stage sized entirely in container units, so it scales
 * like a screenshot from a phone to a wide screen. They are example layouts —
 * "Your brand", not a client — and each says so in its corner. Nothing here
 * shows a result, a review or a number as if it were a real campaign's.
 */

/* ── shared pieces ─────────────────────────────────────────────────────── */

function Stage({ bg, children, dark = false }: { bg: string; children: ReactNode; dark?: boolean }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden [container-type:inline-size]" style={{ background: bg }}>
      {children}
      <span
        className={`absolute right-[2cqw] top-[2cqw] z-20 rounded-full px-[1.2cqw] py-[0.45cqw] text-[1.25cqw] font-medium ${
          dark ? "bg-white/15 text-white" : "bg-black/60 text-white"
        }`}
      >
        Example
      </span>
    </div>
  );
}

function useLoop() {
  const reduced = !!useReducedMotion();
  return (anim: TargetAndTransition, transition: Transition): { animate?: TargetAndTransition; transition?: Transition } =>
    reduced ? {} : { animate: anim, transition: { repeat: Infinity, ...transition } };
}

function Phone({ style, children, className = "" }: { style: CSSProperties; children: ReactNode; className?: string }) {
  return (
    <div
      className={`absolute aspect-[9/19.5] overflow-hidden rounded-[3.2cqw] border-[0.55cqw] border-[#141414] bg-white shadow-[0_3cqw_6cqw_-2cqw_rgba(0,0,0,0.35)] ${className}`}
      style={style}
    >
      <div className="mx-auto mt-[0.8cqw] h-[1cqw] w-[30%] rounded-full bg-[#141414]" />
      {children}
    </div>
  );
}

const Bar = ({ w, className = "bg-black/10" }: { w: string; className?: string }) => (
  <span className={`block h-[0.9cqw] rounded-full ${className}`} style={{ width: w }} />
);

/* ── 1. Meta ads ───────────────────────────────────────────────────────── */

export function MetaAdsMock() {
  const loop = useLoop();
  return (
    <Stage bg="linear-gradient(135deg,#ECE6FF 0%,#FFE9DE 100%)">
      {/* the story ad, behind */}
      <Phone style={{ left: "31cqw", top: "6cqw", width: "21cqw", transform: "rotate(7deg)" }}>
        <div className="absolute inset-0 top-0 bg-[linear-gradient(170deg,#FF8A5B,#FF3D7F)] p-[1.4cqw] text-white">
          <div className="mt-[2cqw] flex gap-[0.5cqw]">
            {[1, 0.4, 0.4].map((o, i) => (
              <span key={i} className="h-[0.35cqw] flex-1 rounded-full bg-white" style={{ opacity: o }} />
            ))}
          </div>
          <p className="mt-[1.2cqw] text-[1.1cqw] opacity-90">yourbrand · Sponsored</p>
          <p className="mt-[9cqw] text-[3.2cqw] font-bold leading-[1] tracking-[-0.04em]">Weekend offer</p>
          <p className="mt-[1cqw] text-[1.4cqw] opacity-90">In store and online</p>
          <motion.span
            className="absolute bottom-[3cqw] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-[2cqw] py-[0.8cqw] text-[1.3cqw] font-semibold text-[#FF3D7F]"
            {...loop({ y: [0, -4, 0] }, { duration: 1.6, ease: "easeInOut" })}
          >
            Learn more
          </motion.span>
        </div>
      </Phone>

      {/* the feed ad */}
      <Phone style={{ left: "9cqw", top: "3cqw", width: "26cqw" }} className="z-10">
        <div className="flex items-center gap-[1cqw] px-[1.4cqw] pt-[1.6cqw]">
          <span className="size-[3.2cqw] rounded-full bg-[conic-gradient(#F58529,#DD2A7B,#8134AF,#F58529)] p-[0.3cqw]">
            <span className="block size-full rounded-full border-[0.3cqw] border-white bg-[#2b2320]" />
          </span>
          <span className="leading-tight">
            <span className="block text-[1.35cqw] font-semibold text-[#111]">yourbrand</span>
            <span className="block text-[1.05cqw] text-[#777]">Sponsored</span>
          </span>
        </div>
        <div className="relative mt-[1.2cqw] aspect-square bg-[linear-gradient(160deg,#2B2320,#7A5340)] p-[2cqw] text-white">
          <span className="absolute bottom-[3cqw] right-[2.5cqw] size-[9cqw] rounded-full bg-[radial-gradient(circle_at_35%_30%,#F6D7A7,#B9783F)] shadow-[0_1.5cqw_3cqw_rgba(0,0,0,0.4)]" />
          <p className="text-[2.7cqw] font-bold leading-[1] tracking-[-0.04em]">New season</p>
          <p className="mt-[0.6cqw] text-[1.35cqw] opacity-85">Shop the edit</p>
        </div>
        <div className="flex items-center justify-between bg-[#2F6BFF] px-[1.4cqw] py-[1cqw] text-[1.35cqw] font-semibold text-white">
          Shop now <span aria-hidden>›</span>
        </div>
        <div className="flex items-center gap-[1.4cqw] px-[1.4cqw] pt-[1.2cqw] text-[#111]">
          <motion.svg viewBox="0 0 24 24" className="size-[2.2cqw]" {...loop({ scale: [1, 1.25, 1] }, { duration: 1.4, repeatDelay: 1.6 })}>
            <path fill="#FF3040" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.8 6.6 4.8c2 0 3.3 1.1 4.1 2.3h2.6c.8-1.2 2.1-2.3 4.1-2.3 3.6 0 5.7 3.6 4.2 7C19.5 16.4 12 21 12 21Z" />
          </motion.svg>
          <svg viewBox="0 0 24 24" className="size-[2.1cqw]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z" />
          </svg>
          <svg viewBox="0 0 24 24" className="size-[2.1cqw]" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 3 11 14M22 3l-7 19-4-8-8-4 19-7Z" />
          </svg>
        </div>
        <div className="grid gap-[0.7cqw] px-[1.4cqw] pt-[1.2cqw]">
          <Bar w="80%" />
          <Bar w="55%" />
        </div>
      </Phone>

      {/* who sees it */}
      <div className="absolute left-[58cqw] top-[8cqw] w-[36cqw] rounded-[2cqw] bg-white p-[2.4cqw] shadow-[0_2cqw_5cqw_-2cqw_rgba(40,20,80,0.3)]">
        <p className="text-[1.9cqw] font-semibold tracking-[-0.02em] text-[#111]">Who sees it</p>
        <div className="mt-[1.4cqw] flex flex-wrap gap-[0.8cqw]">
          {["Women, 24–40", "Within 15 km of your store", "Interested in fashion", "Instagram and Facebook"].map((c, i) => (
            <motion.span
              key={c}
              className="rounded-full border border-[#D9D2F5] bg-[#F6F3FF] px-[1.2cqw] py-[0.6cqw] text-[1.3cqw] text-[#3B2E7E]"
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
            >
              {c}
            </motion.span>
          ))}
        </div>
        <div className="mt-[2cqw] flex items-end justify-between border-t border-[#eee] pt-[1.6cqw]">
          <span>
            <span className="block text-[1.2cqw] text-[#777]">Daily budget</span>
            <span className="block text-[3cqw] font-semibold tracking-[-0.03em] text-[#111]">₹500</span>
          </span>
          <span className="text-right text-[1.2cqw] leading-[1.6] text-[#555]">
            Tracked: clicks,
            <br />
            WhatsApp chats, sales
          </span>
        </div>
      </div>
    </Stage>
  );
}

/* ── 2. Google search and Maps ─────────────────────────────────────────── */

export function SearchMock() {
  const reduced = !!useReducedMotion();
  const loop = useLoop();
  const query = "café near me";
  return (
    <Stage bg="#EEF0F3">
      <div className="absolute inset-[3.5cqw] overflow-hidden rounded-[1.6cqw] bg-white shadow-[0_1.5cqw_4cqw_-2cqw_rgba(0,0,0,0.2)]">
        <div className="absolute left-[3cqw] top-[2.6cqw] flex h-[4.6cqw] w-[52cqw] items-center gap-[1cqw] rounded-full border border-[#dfe1e5] px-[1.8cqw] text-[1.6cqw] text-[#202124] shadow-[0_0.3cqw_0.8cqw_rgba(0,0,0,0.06)]">
          <svg viewBox="0 0 24 24" className="size-[1.8cqw] text-[#9aa0a6]" fill="none" stroke="currentColor" strokeWidth="2.4">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <span className="relative">
            {reduced ? (
              query
            ) : (
              <motion.span
                className="inline-block overflow-hidden whitespace-nowrap align-bottom"
                animate={{ width: ["0ch", `${query.length}ch`, `${query.length}ch`, "0ch"] }}
                transition={{ duration: 5, times: [0, 0.35, 0.85, 1], repeat: Infinity, ease: "linear" }}
              >
                {query}
              </motion.span>
            )}
          </span>
        </div>
        <div className="absolute left-[4.6cqw] top-[8.6cqw] flex gap-[2.4cqw] text-[1.25cqw] text-[#5f6368]">
          {["All", "Maps", "Images", "News"].map((t, i) => (
            <span key={t} className={i === 0 ? "border-b-[0.3cqw] border-[#1a73e8] pb-[0.5cqw] text-[#1a73e8]" : ""}>
              {t}
            </span>
          ))}
        </div>
        <div className="absolute left-[4.6cqw] top-[13cqw] w-[44cqw]">
          <p className="text-[1.15cqw] font-bold text-[#202124]">Sponsored</p>
          <p className="mt-[0.4cqw] text-[1.2cqw] text-[#202124]">yourcafe.in</p>
          <p className="mt-[0.3cqw] text-[2cqw] leading-tight text-[#1a0dab]">Your Café — order online, open till 11 pm</p>
          <p className="mt-[0.6cqw] text-[1.3cqw] leading-snug text-[#4d5156]">Fresh coffee, all-day breakfast and a quiet place to work. Order ahead or book a table.</p>
          <div className="mt-[1cqw] flex gap-[0.8cqw]">
            {["Menu", "Book a table", "Directions"].map((l) => (
              <span key={l} className="rounded-full border border-[#dadce0] px-[1.2cqw] py-[0.5cqw] text-[1.2cqw] text-[#1a0dab]">
                {l}
              </span>
            ))}
          </div>
          <div className="mt-[3cqw] grid gap-[0.8cqw]">
            <Bar w="40%" className="bg-[#e8eaed]" />
            <Bar w="85%" className="bg-[#e8eaed]" />
            <Bar w="70%" className="bg-[#e8eaed]" />
            <span className="h-[1.6cqw]" />
            <Bar w="35%" className="bg-[#e8eaed]" />
            <Bar w="80%" className="bg-[#e8eaed]" />
          </div>
        </div>
        {/* map pack */}
        <div className="absolute left-[54cqw] top-[12cqw] w-[32cqw] overflow-hidden rounded-[1.2cqw] border border-[#dadce0]">
          <div className="relative h-[19cqw] bg-[#E8F0E3]">
            <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 size-full">
              <path d="M0 38 C30 30 50 46 100 34" stroke="#fff" strokeWidth="4" fill="none" />
              <path d="M58 0 L48 60" stroke="#fff" strokeWidth="3" fill="none" />
              <path d="M0 12 L100 20" stroke="#fff" strokeWidth="2" fill="none" />
              <ellipse cx="20" cy="50" rx="14" ry="7" fill="#CFE3C3" />
              <path d="M75 0 Q80 30 100 45" stroke="#C8DDF2" strokeWidth="5" fill="none" />
            </svg>
            {[
              { l: "26%", t: "30%" },
              { l: "70%", t: "55%" },
            ].map((p, i) => (
              <span key={i} className="absolute size-[1.6cqw] -translate-x-1/2 -translate-y-full rounded-full border-[0.3cqw] border-white bg-[#9aa0a6]" style={{ left: p.l, top: p.t }} />
            ))}
            <motion.span
              className="absolute left-[52%] top-[42%] -translate-x-1/2 -translate-y-full"
              {...loop({ y: [0, -8, 0] }, { duration: 1.2, repeatDelay: 1.2, ease: "easeOut" })}
            >
              <svg viewBox="0 0 24 32" className="h-[4cqw] w-[3cqw]">
                <path fill="#EA4335" d="M12 0C5.4 0 0 5.2 0 11.7 0 20.5 12 32 12 32s12-11.5 12-20.3C24 5.2 18.6 0 12 0Z" />
                <circle cx="12" cy="11.5" r="4.5" fill="#fff" />
              </svg>
            </motion.span>
          </div>
          <div className="bg-white p-[1.4cqw]">
            <p className="text-[1.6cqw] font-semibold text-[#202124]">Your Café</p>
            <p className="mt-[0.3cqw] text-[1.2cqw] text-[#188038]">Open now</p>
            <div className="mt-[1cqw] flex gap-[0.8cqw]">
              {["Directions", "Call", "Website"].map((b) => (
                <span key={b} className="rounded-full bg-[#E8F0FE] px-[1.1cqw] py-[0.5cqw] text-[1.15cqw] text-[#1a73e8]">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ── 3. Social media ───────────────────────────────────────────────────── */

const TILES: { bg: string; fg?: string; text?: string; play?: boolean; dot?: boolean }[] = [
  { bg: "#2B2320", fg: "#F6D7A7", text: "New in" },
  { bg: "linear-gradient(140deg,#F6C28B,#E8835E)", dot: true },
  { bg: "#F4EBDD", fg: "#2B2320", text: "5 ways to style it" },
  { bg: "linear-gradient(160deg,#7A5340,#2B2320)", play: true },
  { bg: "#E8835E", fg: "#fff", text: "20% off this week" },
  { bg: "linear-gradient(140deg,#DCE6D5,#9DB58C)", dot: true },
  { bg: "#F4EBDD", fg: "#7A5340", text: "“Loved it”" },
  { bg: "linear-gradient(140deg,#B9A5E8,#6E59C9)", play: true },
  { bg: "#2B2320", fg: "#fff", text: "Behind the scenes" },
];

export function SocialMock() {
  const loop = useLoop();
  const week = [
    { d: "Mon", t: "Reel", c: "#E8835E" },
    { d: "Tue" },
    { d: "Wed", t: "Carousel", c: "#6E59C9" },
    { d: "Thu", t: "Story", c: "#2F6BFF" },
    { d: "Fri", t: "Post", c: "#2B2320" },
    { d: "Sat", t: "Reel", c: "#E8835E" },
    { d: "Sun" },
  ];
  return (
    <Stage bg="linear-gradient(135deg,#FFF4E6 0%,#FDE6EE 100%)">
      <Phone style={{ left: "8cqw", top: "3cqw", width: "26cqw" }}>
        <div className="flex items-center gap-[1.4cqw] px-[1.6cqw] pt-[1.8cqw]">
          <span className="size-[5.2cqw] shrink-0 rounded-full bg-[conic-gradient(#F58529,#DD2A7B,#8134AF,#F58529)] p-[0.35cqw]">
            <span className="block size-full rounded-full border-[0.35cqw] border-white bg-[#2B2320]" />
          </span>
          <span className="flex-1">
            <span className="block text-[1.5cqw] font-semibold text-[#111]">yourbrand</span>
            <span className="mt-[0.6cqw] block w-fit rounded-[0.6cqw] bg-[#2F6BFF] px-[1.4cqw] py-[0.4cqw] text-[1.1cqw] font-semibold text-white">Follow</span>
          </span>
        </div>
        <div className="mt-[1.4cqw] flex gap-[1.2cqw] px-[1.6cqw]">
          {["#E8835E", "#6E59C9", "#9DB58C", "#2B2320"].map((c) => (
            <span key={c} className="size-[3.6cqw] rounded-full border-[0.3cqw] border-[#ddd]" style={{ background: c }} />
          ))}
        </div>
        <div className="mt-[1.4cqw] grid grid-cols-3 gap-[0.3cqw]">
          {TILES.map((t, i) => (
            <motion.span
              key={i}
              className="relative flex aspect-square items-end p-[0.7cqw] text-[1.05cqw] font-semibold leading-[1.1]"
              style={{ background: t.bg, color: t.fg }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 * i, duration: 0.4 }}
            >
              {t.text}
              {t.play && (
                <svg viewBox="0 0 24 24" className="absolute right-[0.6cqw] top-[0.6cqw] size-[1.6cqw]">
                  <path fill="#fff" d="M7 4v16l13-8z" />
                </svg>
              )}
              {t.dot && <span className="absolute left-1/2 top-1/2 size-[3cqw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />}
            </motion.span>
          ))}
        </div>
      </Phone>

      <div className="absolute left-[42cqw] top-[9cqw] w-[52cqw] rounded-[2cqw] bg-white p-[2.4cqw] shadow-[0_2cqw_5cqw_-2cqw_rgba(120,40,60,0.25)]">
        <div className="flex items-baseline justify-between">
          <p className="text-[1.9cqw] font-semibold tracking-[-0.02em] text-[#111]">This week’s content</p>
          <p className="text-[1.2cqw] text-[#777]">Planned and scheduled</p>
        </div>
        <div className="mt-[1.8cqw] grid grid-cols-7 gap-[0.8cqw]">
          {week.map((w, i) => (
            <div key={w.d} className="text-center">
              <p className="text-[1.15cqw] text-[#888]">{w.d}</p>
              {w.t ? (
                <motion.div
                  className="mt-[0.8cqw] flex h-[9cqw] flex-col justify-between rounded-[1cqw] p-[0.7cqw] text-left text-white"
                  style={{ background: w.c }}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + 0.1 * i }}
                >
                  <span className="text-[1.1cqw] font-semibold">{w.t}</span>
                  <motion.span
                    className="flex size-[1.8cqw] items-center justify-center self-end rounded-full bg-white/90"
                    {...loop({ scale: [1, 1.2, 1] }, { duration: 0.6, delay: i * 0.4, repeatDelay: 3 })}
                  >
                    <svg viewBox="0 0 24 24" className="size-[1.2cqw]" fill="none" stroke={w.c} strokeWidth="3.4">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  </motion.span>
                </motion.div>
              ) : (
                <div className="mt-[0.8cqw] h-[9cqw] rounded-[1cqw] border border-dashed border-[#ddd]" />
              )}
            </div>
          ))}
        </div>
        <p className="mt-[2cqw] text-[1.3cqw] leading-snug text-[#555]">Ideas, design, captions and hashtags, posted on time every week.</p>
      </div>
    </Stage>
  );
}

/* ── 4. Brand photoshoot ───────────────────────────────────────────────── */

function Bottle({ scale = 1 }: { scale?: number }) {
  return (
    <span className="absolute bottom-[18%] left-1/2 flex -translate-x-1/2 flex-col items-center" style={{ transform: `translateX(-50%) scale(${scale})`, transformOrigin: "bottom" }}>
      <span className="h-[3.4cqw] w-[3.6cqw] rounded-t-[0.6cqw] bg-[#2a2622]" />
      <span className="h-[1cqw] w-[4.6cqw] bg-[#3a342e]" />
      <span className="h-[17cqw] w-[9cqw] rounded-[1.6cqw] bg-[linear-gradient(90deg,#8a4a1c,#d48a3c_40%,#f2c27a_55%,#b8682a)]">
        <span className="mx-auto mt-[6cqw] block h-[5cqw] w-[6.4cqw] rounded-[0.4cqw] bg-[#f5ede1]" />
      </span>
    </span>
  );
}

export function PhotoMock() {
  const loop = useLoop();
  const thumbs = ["product", "food", "interior", "portrait", "team"] as const;
  return (
    <Stage bg="#121110" dark>
      {/* the viewfinder */}
      <div className="absolute inset-x-[4cqw] top-[4cqw] h-[43cqw] overflow-hidden rounded-[1cqw] bg-[radial-gradient(ellipse_at_50%_35%,#5a4636_0%,#2a211b_55%,#15110e_100%)]">
        <span className="absolute bottom-[12%] left-1/2 h-[4cqw] w-[30cqw] -translate-x-1/2 rounded-[50%] bg-black/45 blur-[0.8cqw]" />
        <span className="absolute bottom-0 left-0 right-0 h-[22%] bg-[linear-gradient(#3b2f26,#241c16)]" />
        <Bottle />
        <span className="absolute bottom-[18%] left-[62%] h-[9cqw] w-[6cqw] rounded-t-full bg-[linear-gradient(#4f6b3d,#2e4224)]" />
        {/* thirds */}
        {["33.3%", "66.6%"].map((p) => (
          <span key={`v${p}`} className="absolute inset-y-0 w-px bg-white/15" style={{ left: p }} />
        ))}
        {["33.3%", "66.6%"].map((p) => (
          <span key={`h${p}`} className="absolute inset-x-0 h-px bg-white/15" style={{ top: p }} />
        ))}
        {/* focus */}
        <motion.span
          className="absolute left-1/2 top-[52%] size-[16cqw] -translate-x-1/2 -translate-y-1/2"
          {...loop({ scale: [1.25, 1, 1, 1.25], opacity: [0.4, 1, 1, 0.4] }, { duration: 4, times: [0, 0.2, 0.9, 1] })}
        >
          {["left-0 top-0 border-l-[0.3cqw] border-t-[0.3cqw]", "right-0 top-0 border-r-[0.3cqw] border-t-[0.3cqw]", "bottom-0 left-0 border-b-[0.3cqw] border-l-[0.3cqw]", "bottom-0 right-0 border-b-[0.3cqw] border-r-[0.3cqw]"].map((c) => (
            <span key={c} className={`absolute size-[2.4cqw] border-[#7CFC9A] ${c}`} />
          ))}
        </motion.span>
        <div className="absolute inset-x-[2cqw] top-[1.6cqw] flex justify-between text-[1.3cqw] text-white/80">
          <span>RAW</span>
          <span className="flex items-center gap-[0.6cqw]">
            <span className="size-[0.9cqw] rounded-full bg-[#ff4d4d]" /> 24 / 36
          </span>
        </div>
        <div className="absolute inset-x-[2cqw] bottom-[1.4cqw] flex justify-between text-[1.3cqw] tabular-nums text-white/85">
          {["1/250", "f/2.8", "ISO 200", "5600K"].map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
        {/* the shutter */}
        <motion.span className="pointer-events-none absolute inset-0 bg-white" initial={{ opacity: 0 }} {...loop({ opacity: [0, 0, 0.85, 0] }, { duration: 4, times: [0, 0.78, 0.8, 0.9] })} />
      </div>
      {/* the film strip */}
      <div className="absolute inset-x-[4cqw] bottom-[3cqw] flex gap-[1.2cqw]">
        {thumbs.map((t, i) => (
          <motion.span
            key={t}
            className="relative h-[9.5cqw] flex-1 overflow-hidden rounded-[0.6cqw] border border-white/15"
            {...loop({ borderColor: ["rgba(255,255,255,0.15)", "rgba(124,252,154,0.9)", "rgba(255,255,255,0.15)"] }, { duration: 1, delay: i * 1, repeatDelay: thumbs.length - 1 })}
          >
            {t === "product" && (
              <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,#5a4636,#1b1511)]">
                <span className="absolute bottom-[15%] left-1/2 h-[55%] w-[22%] -translate-x-1/2 rounded-[0.5cqw] bg-[linear-gradient(90deg,#8a4a1c,#f2c27a,#b8682a)]" />
              </span>
            )}
            {t === "food" && (
              <span className="absolute inset-0 bg-[#3a2c22]">
                <span className="absolute left-1/2 top-1/2 size-[7cqw] -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.8cqw] border-[#efe6d8] bg-[radial-gradient(circle,#d9893f,#9c4a1e)]" />
              </span>
            )}
            {t === "interior" && (
              <span className="absolute inset-0 bg-[#d9cbb6]">
                <span className="absolute right-[12%] top-[12%] h-[45%] w-[30%] bg-[#eef3f6]" />
                <span className="absolute bottom-[12%] left-[10%] h-[28%] w-[55%] rounded-[0.4cqw] bg-[#6b5a48]" />
              </span>
            )}
            {t === "portrait" && (
              <span className="absolute inset-0 bg-[linear-gradient(#8fa3b8,#56687c)]">
                <span className="absolute left-1/2 top-[20%] size-[3.4cqw] -translate-x-1/2 rounded-full bg-[#e8c4a3]" />
                <span className="absolute bottom-0 left-1/2 h-[35%] w-[60%] -translate-x-1/2 rounded-t-full bg-[#2b2b33]" />
              </span>
            )}
            {t === "team" && (
              <span className="absolute inset-0 bg-[#e9e2d6]">
                {[22, 50, 78].map((x) => (
                  <span key={x}>
                    <span className="absolute top-[26%] size-[2.2cqw] -translate-x-1/2 rounded-full bg-[#c99f80]" style={{ left: `${x}%` }} />
                    <span className="absolute bottom-0 h-[34%] w-[24%] -translate-x-1/2 rounded-t-full bg-[#3d4a5c]" style={{ left: `${x}%` }} />
                  </span>
                ))}
              </span>
            )}
          </motion.span>
        ))}
      </div>
    </Stage>
  );
}

/* ── 5. Lead generation ────────────────────────────────────────────────── */

const LEADS = [
  { src: "Meta ad", what: "2BHK site visit", status: "New", c: "#B7791F", bg: "#FEF3C7" },
  { src: "Google", what: "Price list", status: "Called", c: "#1D4ED8", bg: "#DBEAFE" },
  { src: "Website", what: "Call back", status: "Booked", c: "#047857", bg: "#D1FAE5" },
  { src: "Meta ad", what: "Showroom visit", status: "New", c: "#B7791F", bg: "#FEF3C7" },
];

export function LeadsMock() {
  const reduced = !!useReducedMotion();
  const loop = useLoop();
  return (
    <Stage bg="linear-gradient(135deg,#E6F4EC 0%,#EEF3FB 100%)">
      {/* path the enquiry travels */}
      <svg viewBox="0 0 100 62.5" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
        <path d="M33 35 C36 35 35 32 38 32" stroke="#8aa69a" strokeWidth="0.35" strokeDasharray="1 1" fill="none" />
        <path d="M61 32 C64 32 63 35 66 35" stroke="#8aa69a" strokeWidth="0.35" strokeDasharray="1 1" fill="none" />
      </svg>

      {/* landing page */}
      <div className="absolute left-[3cqw] top-[12cqw] w-[30cqw] overflow-hidden rounded-[1.4cqw] bg-white shadow-[0_1.5cqw_4cqw_-2cqw_rgba(0,0,0,0.2)]">
        <div className="flex h-[2.6cqw] items-center gap-[0.5cqw] border-b border-[#eee] px-[1cqw]">
          {[0, 1, 2].map((d) => (
            <span key={d} className="size-[0.8cqw] rounded-full bg-[#ddd]" />
          ))}
        </div>
        <div className="p-[2cqw]">
          <p className="text-[2.2cqw] font-bold leading-[1.05] tracking-[-0.03em] text-[#111]">Book a free site visit</p>
          <p className="mt-[0.8cqw] text-[1.2cqw] text-[#666]">We call you back within the hour.</p>
          {["Name", "Phone", "Interested in"].map((f, i) => (
            <div key={f} className="mt-[1.2cqw]">
              <p className="text-[1.05cqw] text-[#777]">{f}</p>
              <div className="relative mt-[0.4cqw] h-[3cqw] overflow-hidden rounded-[0.6cqw] border border-[#ddd]">
                {!reduced && (
                  <motion.span
                    className="absolute inset-y-[0.9cqw] left-[1cqw] rounded-full bg-[#cfd8d3]"
                    animate={{ width: ["0%", `${[45, 60, 35][i]}%`, `${[45, 60, 35][i]}%`, "0%"] }}
                    transition={{ duration: 6, times: [0.05 + i * 0.1, 0.2 + i * 0.1, 0.9, 1], repeat: Infinity }}
                  />
                )}
              </div>
            </div>
          ))}
          <motion.div
            className="mt-[1.6cqw] rounded-[0.8cqw] bg-[#0F9D58] py-[1cqw] text-center text-[1.35cqw] font-semibold text-white"
            {...loop({ scale: [1, 1, 0.95, 1, 1] }, { duration: 6, times: [0, 0.48, 0.5, 0.53, 1] })}
          >
            Get a call back
          </motion.div>
        </div>
      </div>

      {/* the message */}
      <div className="absolute left-[37cqw] top-[18cqw] w-[25cqw] overflow-hidden rounded-[1.6cqw] bg-[#0b141a] shadow-[0_1.5cqw_4cqw_-2cqw_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-[1cqw] bg-[#202c33] px-[1.4cqw] py-[1cqw]">
          <span className="size-[2.6cqw] rounded-full bg-[#25d366]" />
          <span className="text-[1.3cqw] font-medium text-[#e9edef]">New enquiries</span>
        </div>
        <div className="min-h-[18cqw] p-[1.4cqw]">
          <motion.div
            className="rounded-[1cqw] rounded-tl-[0.2cqw] bg-[#202c33] p-[1.2cqw] text-[1.25cqw] leading-snug text-[#e9edef]"
            initial={{ opacity: reduced ? 1 : 0 }}
            {...loop({ opacity: [0, 0, 1, 1, 0], y: [8, 8, 0, 0, 0] }, { duration: 6, times: [0, 0.52, 0.58, 0.92, 1] })}
          >
            New enquiry from your landing page: 2BHK, site visit on Saturday.
            <span className="mt-[0.6cqw] block text-right text-[1cqw] text-[#8696a0]">10:42</span>
          </motion.div>
        </div>
      </div>

      {/* the sheet */}
      <div className="absolute left-[66cqw] top-[14cqw] w-[31cqw] overflow-hidden rounded-[1.4cqw] bg-white shadow-[0_1.5cqw_4cqw_-2cqw_rgba(0,0,0,0.2)]">
        <p className="border-b border-[#eee] px-[1.6cqw] py-[1.2cqw] text-[1.5cqw] font-semibold text-[#111]">Enquiries</p>
        <div className="grid grid-cols-[1fr_1.3fr_auto] gap-x-[1cqw] px-[1.6cqw] py-[0.8cqw] text-[1.05cqw] text-[#888]">
          <span>Source</span>
          <span>Enquiry</span>
          <span>Status</span>
        </div>
        {LEADS.map((l, i) => (
          <motion.div
            key={i}
            className="grid grid-cols-[1fr_1.3fr_auto] items-center gap-x-[1cqw] border-t border-[#f2f2f2] px-[1.6cqw] py-[1cqw] text-[1.2cqw] text-[#222]"
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.15 }}
          >
            <span>{l.src}</span>
            <span className="truncate">{l.what}</span>
            <span className="rounded-full px-[0.9cqw] py-[0.3cqw] text-[1.05cqw] font-medium" style={{ color: l.c, background: l.bg }}>
              {l.status}
            </span>
          </motion.div>
        ))}
      </div>
    </Stage>
  );
}

/* ── 6. SaaS ───────────────────────────────────────────────────────────── */

const BARS = [38, 52, 44, 61, 58, 72, 66, 80, 74, 88, 82, 94];

export function SaasMock() {
  const reduced = !!useReducedMotion();
  return (
    <Stage bg="#E9EDF3">
      <div className="absolute inset-[3cqw] flex overflow-hidden rounded-[1.4cqw] bg-white shadow-[0_1.5cqw_4cqw_-2cqw_rgba(0,0,0,0.25)]">
        <aside className="w-[15cqw] shrink-0 bg-[#16181D] p-[1.6cqw] text-[1.2cqw] text-white/60">
          <p className="mb-[2cqw] text-[1.5cqw] font-semibold text-white">yourbrand</p>
          {["Dashboard", "Orders", "Customers", "Bookings", "Billing", "Staff"].map((n, i) => (
            <p key={n} className={`mb-[0.6cqw] rounded-[0.6cqw] px-[0.9cqw] py-[0.6cqw] ${i === 0 ? "bg-white/10 text-white" : ""}`}>
              {n}
            </p>
          ))}
        </aside>
        <div className="flex-1 p-[2cqw]">
          <div className="flex items-center justify-between">
            <p className="text-[1.9cqw] font-semibold tracking-[-0.02em] text-[#111]">Today</p>
            <span className="h-[3cqw] w-[20cqw] rounded-full bg-[#f1f3f6]" />
          </div>
          <div className="mt-[1.6cqw] grid grid-cols-3 gap-[1.2cqw]">
            {[
              ["Orders", "128"],
              ["To deliver", "14"],
              ["Collected", "₹42,300"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[1cqw] border border-[#eef0f3] p-[1.2cqw]">
                <p className="text-[1.1cqw] text-[#888]">{k}</p>
                <p className="mt-[0.4cqw] text-[2.4cqw] font-semibold tracking-[-0.03em] text-[#111]">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-[1.4cqw] grid grid-cols-[1.4fr_1fr] gap-[1.2cqw]">
            <div className="rounded-[1cqw] border border-[#eef0f3] p-[1.2cqw]">
              <p className="text-[1.15cqw] text-[#888]">Orders this year</p>
              <div className="mt-[1cqw] flex h-[24cqw] items-end gap-[0.6cqw]">
                {BARS.map((h, i) => (
                  <motion.span
                    key={i}
                    className={`flex-1 rounded-t-[0.4cqw] ${i === BARS.length - 1 ? "bg-[#2F6BFF]" : "bg-[#C9D6F5]"}`}
                    initial={{ height: reduced ? `${h}%` : "6%" }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.04 * i, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-[1cqw] border border-[#eef0f3] p-[1.2cqw]">
              <p className="text-[1.15cqw] text-[#888]">Latest</p>
              {[
                ["#1042", "Paid", "#047857", "#D1FAE5"],
                ["#1041", "Packed", "#1D4ED8", "#DBEAFE"],
                ["#1040", "Paid", "#047857", "#D1FAE5"],
                ["#1039", "Due", "#B7791F", "#FEF3C7"],
                ["#1038", "Paid", "#047857", "#D1FAE5"],
                ["#1037", "Packed", "#1D4ED8", "#DBEAFE"],
                ["#1036", "Paid", "#047857", "#D1FAE5"],
              ].map(([id, s, c, bg]) => (
                <div key={id} className="mt-[0.9cqw] flex items-center justify-between text-[1.2cqw] text-[#222]">
                  <span className="tabular-nums">{id}</span>
                  <span className="rounded-full px-[0.9cqw] py-[0.25cqw] text-[1.05cqw]" style={{ color: c, background: bg }}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
}
