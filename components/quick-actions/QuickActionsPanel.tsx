"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { useProfile } from "@/components/profile/ProfileProvider";
import QuickActionItem from "./QuickActionItem";
import { header, helpActions, palette, quickActions } from "./quickActionsConfig";

/**
 * The panel itself: a header, a list, and a footer that swaps the list for the
 * help list without opening a second window.
 *
 * WHY THIS IS NOT A CHATBOT
 *
 * A chatbot promises a conversation and then makes you wait for it. This
 * promises eight destinations and shows all eight at once — the whole value is
 * that the visitor can see, in one glance, that they may call, write, book or
 * pay. Every affordance here is a link. Nothing is typed, nothing is sent,
 * nothing is "thinking".
 *
 * THE HELP VIEW IS THE SAME PANEL
 *
 * It replaces the list in place rather than opening a nested dialog, so the
 * header, the shadow and the corner all stay put and only the content moves.
 * Back returns; Escape still closes the whole thing.
 */
export default function QuickActionsPanel({
  view,
  onOpenHelp,
  onBack,
  onNavigate,
}: {
  view: "actions" | "help";
  onOpenHelp: () => void;
  onBack: () => void;
  onNavigate: () => void;
}) {
  const { profile } = useProfile();

  /* The client's mock carries a sample name. A real visitor gets their own, and
     a signed-out one gets no name line at all rather than somebody else's. */
  const name = profile?.fullName?.trim() || header.signedOutName;
  const isHelp = view === "help";
  const items = isHelp ? helpActions : quickActions;

  return (
    /* Tall enough that all eight actions fit without scrolling on an ordinary
       desktop — being able to see the whole list at once is the point of the
       panel. Shorter screens scroll the list, never the header or footer. */
    <div className="flex max-h-[min(86vh,668px)] flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="relative shrink-0 px-5 pb-4 pt-4"
        style={{
          background: `linear-gradient(135deg, ${palette.headerFrom} 0%, ${palette.headerTo} 100%)`,
          borderBottom: `1px solid ${palette.edge}`,
        }}
      >
        {/* A single gold sheen across the header, the same device the site's
            dark bands use. Purely decorative, so it is hidden from readers. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 85% 0%, rgba(230,195,107,0.16) 0%, transparent 60%)",
          }}
        />

        <div className="relative flex items-start gap-3">
          {isHelp && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to quick actions"
              className="qa-back -ml-1 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full outline-none transition-colors duration-200"
              style={{ color: palette.gold }}
            >
              <ArrowLeft size={17} strokeWidth={2} />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: palette.gold }}
            >
              {isHelp ? "Help & support" : header.eyebrow}
            </p>

            {!isHelp && name && (
              <p
                className="mt-1 truncate text-[17px] font-semibold leading-tight"
                style={{ color: palette.ink }}
              >
                {name} <span aria-hidden>😊</span>
              </p>
            )}

            <p
              className="mt-1 text-[13px] leading-snug"
              style={{ color: palette.inkDim }}
            >
              {isHelp ? "Choose how you would like to reach us." : header.question}
            </p>
          </div>
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────────────────── */}
      <div
        /* Transparent on purpose: the panel wrapper already paints the glass,
           and painting it again here would sit an opaque layer on top of the
           blur and cancel it. */
        className="qa-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain bg-transparent p-2"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, x: isHelp ? 14 : -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isHelp ? -14 : 14 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-0.5"
          >
            {items.map((action) => (
              <QuickActionItem key={action.id} action={action} onNavigate={onNavigate} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      {!isHelp && (
        <div
          className="shrink-0 p-2"
          style={{
            background: palette.surfaceLift,
            borderTop: `1px solid ${palette.edge}`,
          }}
        >
          <button
            type="button"
            onClick={onOpenHelp}
            className="qa-row flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors duration-200"
            style={{ color: palette.ink, minHeight: 44 }}
          >
            <span
              aria-hidden
              className="qa-tile grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors duration-200"
            >
              <LifeBuoy size={17} strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-medium leading-tight">
                Help &amp; support
              </span>
              <span
                className="mt-0.5 block truncate text-[11.5px] leading-tight"
                style={{ color: palette.inkDim, opacity: 0.72 }}
              >
                FAQ, support and booking
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
