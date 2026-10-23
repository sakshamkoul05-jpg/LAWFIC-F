"use client";

import type { ServiceId } from "@/lib/branding";
import { studioScrollTo } from "./Stage";

const BASE =
  "inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[14px] font-medium text-background transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

/** Preselects a service in the quote builder (if given) and scrolls to it. */
export default function QuoteButton({
  service,
  label = "Get a quote",
  className = BASE,
}: {
  service?: ServiceId;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (service) window.dispatchEvent(new CustomEvent("lawfic:quote", { detail: service }));
        else studioScrollTo(document.getElementById("quote"));
      }}
      className={className}
    >
      {label}
    </button>
  );
}
