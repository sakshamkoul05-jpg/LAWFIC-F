"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { useProfile } from "@/components/profile/ProfileProvider";
import PandaChat from "./PandaChat";
import QuickActionItem from "./QuickActionItem";
import { header, helpActions, palette, quickActions } from "./quickActionsConfig";

export type PanelView = "actions" | "help" | "chat";

/**
 * The panel itself: a header, a list, and a footer that swaps the list for the
 * help list without opening a second window.
 *
 * WHY THE LIST IS STILL THE FRONT DOOR
 *
 * There is a chatbot behind the first row now, but it is not what opens. A
 * chat box asks the visitor to compose a question and then wait; the list
 * shows them, in one glance, that they may call, write, book or pay. Whoever
 * already knows what they want gets it in one tap, and whoever does not gets
 * Panda AI at the top. Opening into the chat would have made everyone type.
 *
 * THE OTHER VIEWS ARE THE SAME PANEL
 *
 * It replaces the list in place rather than opening a nested dialog, so the
 * header, the shadow and the corner all stay put and only the content moves.
 * Back returns; Escape still closes the whole thing.
 */
export default function QuickActionsPanel({
  view,
  onOpenHelp,
  onOpenView,
  onBack,
  onNavigate,
}: {
  view: PanelView;
  onOpenHelp: () => void;
  onOpenView: (view: "chat") => void;
  onBack: () => void;
  onNavigate: () => void;
}) {
  const { profile } = useProfile();

  /* The client's mock carries a sample name. A real visitor gets their own, and
     a signed-out one gets no name line at all rather than somebody else's. */
  const name = profile?.fullName?.trim() || header.signedOutName;
  const isHelp = view === "help";
  const isChat = view === "chat";
  const isRoot = view === "actions";
  const items = isHelp ? helpActions : quickActions;

  return (
    /* Tall enough that all eight actions fit without scrolling on an ordinary
       desktop — being able to see the whole list at once is the point of the
       panel. Shorter screens, and a ball dragged somewhere with less room
       above or below it, scroll the list instead; --qa-avail is the space the
       widget measured on the side the panel opened towards. */
    <div
      className="flex max-h-[min(86vh,668px,var(--qa-avail,100vh))] flex-col overflow-hidden"
      /* Chat has to be given a height. The action list sizes itself from its
         rows, but a transcript starts nearly empty and would otherwise open as
         a sliver that grows as it fills. */
      style={isChat ? { height: "min(86vh, 668px, var(--qa-avail, 100vh))" } : undefined}
    >
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
          {!isRoot && (
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
              {isHelp ? "Help & support" : isChat ? "Panda AI" : header.eyebrow}
            </p>

            {isRoot && name && (
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
              {isHelp
                ? "Choose how you would like to reach us."
                : isChat
                  ? "Ask me about LAWFIC, or anything else."
                  : header.question}
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      {/* Chat brings its own transcript scroller and composer, so it replaces
          the list rather than rendering inside it — nesting one scroll area in
          another is how a message list ends up scrolling the wrong element. */}
      {isChat ? (
        <PandaChat onBack={onBack} />
      ) : (
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
              <QuickActionItem
                key={action.id}
                action={action}
                onNavigate={onNavigate}
                onOpenView={onOpenView}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      {isRoot && (
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
