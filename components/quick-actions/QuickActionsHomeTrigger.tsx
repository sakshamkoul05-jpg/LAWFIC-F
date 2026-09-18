"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { logoSrc, palette } from "./quickActionsConfig";
import { useQuickActions } from "./QuickActionsContext";

/**
 * The second doorway, low on the home page.
 *
 * "Logo lagana hai aapko home page par niche side me jaise hi logo par click
 * hoga aise hi box open ho jaega" — the same logo, further down the page,
 * opening the same box.
 *
 * It renders NO panel of its own. It flips the flag in QuickActionsContext,
 * and the single widget in the corner opens. That is why this file is twenty
 * lines and not two hundred: there is one widget on the site, and this is a
 * button that points at it.
 *
 * It is in normal page flow rather than fixed, so it scrolls away with the
 * section it belongs to and can never sit on top of the floating ball.
 */
export default function QuickActionsHomeTrigger() {
  const ctx = useQuickActions();
  if (!ctx) return null;

  return (
    <section className="flex justify-center px-4 py-12">
      <button
        type="button"
        onClick={ctx.open}
        aria-haspopup="dialog"
        aria-expanded={ctx.isOpen}
        className="qa-home-trigger"
      >
        <span
          aria-hidden
          className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full"
          style={{
            border: `1px solid ${palette.edge}`,
            background:
              "radial-gradient(125% 125% at 30% 18%, var(--band-lift,#142C66) 0%, var(--band-deep,#060E22) 68%)",
          }}
        >
          <Image src={logoSrc} alt="" fill sizes="48px" className="object-contain p-1.5" />
        </span>

        <span className="text-left">
          <span
            className="block text-[10.5px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: palette.gold }}
          >
            Quick actions
          </span>
          <span className="mt-0.5 block text-[15px] font-medium leading-tight">
            How can we help you today?
          </span>
        </span>

        <ChevronRight
          aria-hidden
          size={18}
          strokeWidth={2}
          style={{ color: palette.gold }}
          className="shrink-0"
        />
      </button>
    </section>
  );
}
