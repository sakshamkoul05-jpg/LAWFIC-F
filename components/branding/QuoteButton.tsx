"use client";

import type { ServiceId } from "@/lib/branding";

/** Preselects a service in the quote builder and scrolls to it. */
export default function QuoteButton({ service, label = "Get a quote" }: { service?: ServiceId; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (service) window.dispatchEvent(new CustomEvent("lawfic:quote", { detail: service }));
        else document.getElementById("quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-medium text-background transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {label}
    </button>
  );
}
