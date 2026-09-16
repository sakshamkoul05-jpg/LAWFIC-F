"use client";

/**
 * One button, one browser call.
 *
 * A client component purely so `window.print()` has somewhere to live. The
 * alternative — an inline script tag next to a server-rendered button — works
 * and is the kind of cleverness that someone later has to read twice to
 * understand. Four lines of "use client" is cheaper than that.
 */
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-border px-4 py-2 text-[12.5px] text-foreground transition-colors hover:border-primary"
    >
      Print or save as PDF
    </button>
  );
}
