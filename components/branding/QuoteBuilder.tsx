"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BUDGETS, STUDIO_SERVICES, TIMELINES, quoteMessage, whatsappHref, type ServiceId } from "@/lib/branding";

/**
 * Get a quote, on WhatsApp.
 *
 * Pick what you need and the message writes itself in a chat bubble beside the
 * form — with a moment of "typing…" whenever it changes, so you can watch your
 * request take shape. The button opens WhatsApp with exactly that text, ready
 * to send. Nothing is stored or sent from this page.
 *
 * Any "Get a quote" button elsewhere on the page dispatches `lawfic:quote` with
 * a service id; this preselects it and scrolls here.
 */

export const QUOTE_EVENT = "lawfic:quote";

export default function QuoteBuilder() {
  const reduced = !!useReducedMotion();
  const [services, setServices] = useState<ServiceId[]>([]);
  const [budget, setBudget] = useState<string>();
  const [timeline, setTimeline] = useState<string>();
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [note, setNote] = useState("");
  const [typing, setTyping] = useState(false);
  const [flights, setFlights] = useState<number[]>([]);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPick = (e: Event) => {
      const id = (e as CustomEvent<ServiceId>).detail;
      setServices((cur) => (cur.includes(id) ? cur : [...cur, id]));
      root.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    };
    window.addEventListener(QUOTE_EVENT, onPick);
    return () => window.removeEventListener(QUOTE_EVENT, onPick);
  }, [reduced]);

  const message = useMemo(
    () => quoteMessage({ services, budget, timeline, name, business, note }),
    [services, budget, timeline, name, business, note],
  );

  /* A short "typing…" beat each time the message changes. */
  useEffect(() => {
    if (reduced) return;
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 550);
    return () => clearTimeout(t);
  }, [message, reduced]);

  const href = whatsappHref(message);
  const toggle = (id: ServiceId) => setServices((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const now = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  return (
    <div ref={root} className="grid scroll-mt-28 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-14">
      <div className="grid gap-7">
        <fieldset>
          <legend className="text-[15px] font-medium text-foreground">What do you need?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {STUDIO_SERVICES.map((s) => {
              const on = services.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={`relative cursor-pointer select-none rounded-full border px-4 py-2 text-[13.5px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/40 ${
                    on ? "border-foreground bg-foreground text-background" : "border-border-3 text-foreground hover:border-foreground"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(s.id)} />
                  <motion.span initial={false} animate={{ scale: on && !reduced ? [1, 1.12, 1] : 1 }} transition={{ duration: 0.25 }} className="inline-block">
                    {on ? "✓ " : "+ "}
                    {s.name}
                  </motion.span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {[
          { legend: "Budget", value: budget, set: setBudget, options: BUDGETS },
          { legend: "When do you need it?", value: timeline, set: setTimeline, options: TIMELINES },
        ].map((g) => (
          <fieldset key={g.legend}>
            <legend className="text-[15px] font-medium text-foreground">{g.legend}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {g.options.map((o) => {
                const on = g.value === o;
                return (
                  <label
                    key={o}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground/40 ${
                      on ? "border-foreground text-foreground" : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    <input type="radio" name={g.legend} className="sr-only" checked={on} onChange={() => g.set(o)} />
                    {o}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-[13px] text-muted">Your name (optional)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-[14px] text-foreground outline-none focus:border-foreground/50"
            />
          </label>
          <label className="block">
            <span className="text-[13px] text-muted">Business (optional)</span>
            <input
              value={business}
              onChange={(e) => setBusiness(e.target.value.slice(0, 80))}
              className="mt-1.5 w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-[14px] text-foreground outline-none focus:border-foreground/50"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[13px] text-muted">Anything else (optional)</span>
            <textarea
              value={note}
              rows={2}
              onChange={(e) => setNote(e.target.value.slice(0, 400))}
              className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5 text-[14px] text-foreground outline-none focus:border-foreground/50"
              placeholder="A link to a site you like, or what the app should do"
            />
          </label>
        </div>
      </div>

      {/* the chat */}
      <div className="lg:sticky lg:top-28">
        <div className="overflow-hidden rounded-[28px] border border-border bg-[#0b141a] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3 bg-[#202c33] px-4 py-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#d0ae55] text-[13px] font-bold text-[#14203a]">L</span>
            <div>
              <p className="text-[14px] font-medium text-[#e9edef]">LAWFIC Studio</p>
              <p className="text-[11.5px] text-[#8696a0]">{typing ? "drafting your message…" : "Usually replies within working hours"}</p>
            </div>
          </div>
          <div className="relative min-h-[300px] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:18px_18px] p-4">
            <div className="flex justify-end">
              <AnimatePresence mode="wait" initial={false}>
                {typing ? (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex gap-1 rounded-2xl rounded-tr-sm bg-[#005c4b] px-4 py-3"
                    aria-hidden
                  >
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="size-1.5 rounded-full bg-[#e9edef]/80"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="msg"
                    initial={reduced ? false : { opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                    className="max-w-[92%] rounded-2xl rounded-tr-sm bg-[#005c4b] px-3.5 pb-1.5 pt-2.5 text-[13.5px] leading-relaxed text-[#e9edef]"
                    aria-live="polite"
                  >
                    <p className="whitespace-pre-wrap break-words">{message}</p>
                    <p className="mt-1 text-right text-[10.5px] text-[#e9edef]/60">
                      {now} <span className="text-[#53bdeb]">✓✓</span>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="relative bg-[#202c33] p-3">
            <AnimatePresence>
              {flights.map((f) => (
                <motion.svg
                  key={f}
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute left-1/2 top-2 z-10 size-7 text-[#25d366]"
                  initial={{ x: 0, y: 0, opacity: 1, rotate: -20, scale: 0.8 }}
                  animate={{ x: [0, 60, 180], y: [0, -120, -320], opacity: [1, 1, 0], rotate: [-20, -30, -40], scale: [0.8, 1.2, 0.6] }}
                  transition={{ duration: 1.1, ease: "easeIn" }}
                  onAnimationComplete={() => setFlights((cur) => cur.filter((x) => x !== f))}
                  aria-hidden
                >
                  <path fill="currentColor" d="M2 11.5 21.5 3l-6.8 18.5-3.4-7.3L2 11.5Zm9.6 2.2 1.9 4 3.7-10-5.6 6Z" />
                </motion.svg>
              ))}
            </AnimatePresence>
            {href ? (
              <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={reduced ? undefined : { scale: 1.02 }}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                onClick={() => !reduced && setFlights((cur) => [...cur, Date.now()])}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] px-5 py-3 text-[14.5px] font-semibold text-[#0b141a]"
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-5-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1 0-1.5.8-2.2 1-2.5.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3Z"
                  />
                </svg>
                Send on WhatsApp
              </motion.a>
            ) : (
              <p className="text-center text-[13px] text-[#8696a0]">WhatsApp number not set up yet.</p>
            )}
          </div>
        </div>
        <p className="mt-3 text-center text-[12px] text-subtle">Opens WhatsApp with this message ready to send. Nothing is saved on this page.</p>
      </div>
    </div>
  );
}
