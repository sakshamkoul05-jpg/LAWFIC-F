"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { QuickAction } from "./quickActionsConfig";
import { palette } from "./quickActionsConfig";

/**
 * One row in the panel.
 *
 * THREE SHAPES, ONE LOOK
 *
 * A row is a next/link for an internal page, a plain anchor for anything that
 * leaves the browser (mailto:, tel:, wa.me — routing those through the router
 * would swallow them), or a disabled div when the contact detail behind it has
 * not been filled in yet.
 *
 * The disabled case exists because the client fixed the list at eight items
 * and lib/company.ts ships with no phone number. Dropping the row would break
 * the brief; wiring it to `tel:` with nothing after the colon would offer a
 * call that cannot connect. So the row is present, visibly quieter, announced
 * to screen readers as unavailable, and not focusable.
 */
export default function QuickActionItem({
  action,
  onNavigate,
  onOpenView,
}: {
  action: QuickAction;
  /** Closes the panel once the visitor has committed to going somewhere. */
  onNavigate: () => void;
  /** For a row that swaps the panel's view instead of navigating. */
  onOpenView: (view: "chat") => void;
}) {
  const Icon = action.icon;

  const body = (
    <>
      <span
        aria-hidden
        className="qa-tile grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors duration-200"
      >
        <Icon size={18} strokeWidth={1.75} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium leading-tight">
          {action.label}
        </span>
        <span
          className="mt-0.5 block truncate text-[11.5px] leading-tight"
          style={{ color: palette.inkDim, opacity: 0.72 }}
        >
          {action.hint}
        </span>
      </span>

      <ChevronRight
        aria-hidden
        size={16}
        strokeWidth={2}
        className="qa-chevron shrink-0 transition-transform duration-200"
      />
    </>
  );

  /* Opens a view in place. A button rather than an anchor because there is
     no destination: an <a> here would offer a middle-click and a new tab
     that lead nowhere. */
  if (action.opensView) {
    return (
      <button
        type="button"
        onClick={() => onOpenView(action.opensView!)}
        className={"qa-row flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors duration-200"}
        style={{ color: palette.ink, minHeight: 44 }}
      >
        {body}
      </button>
    );
  }

  /* Present, but honest about being unusable. aria-disabled rather than a
     disabled button so the label is still read out — the visitor should learn
     that LAWFIC offers this, just not yet through here. */
  if (!action.href) {
    return (
      <div
        aria-disabled="true"
        title="Not configured yet"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left opacity-45"
        style={{ color: palette.ink, minHeight: 44 }}
      >
        {body}
      </div>
    );
  }

  const className =
    "qa-row flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-colors duration-200";
  const style = { color: palette.ink, minHeight: 44 } as const;

  if (action.external) {
    const isWeb = action.href.startsWith("http");
    return (
      <a
        href={action.href}
        onClick={onNavigate}
        className={className}
        style={style}
        {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={action.href} onClick={onNavigate} className={className} style={style}>
      {body}
    </Link>
  );
}
