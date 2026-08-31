"use client";

import Link from "next/link";

/**
 * Polished "this page will be live soon" placeholder used for tabs whose
 * content pages have not been written yet. The shared header + navigation comes
 * from ThemeShell; this component only renders the page body.
 */
export default function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center sm:px-8">
      <div className="grid size-16 place-items-center rounded-full border border-primary/30 bg-primary-light text-primary">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>

      <p className="label mt-8 text-primary">LAWFiC</p>
      <h1 className="mt-4 font-display text-[clamp(28px,4vw,44px)] leading-tight text-foreground">
        {title}
      </h1>
      <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-muted">
        {description ??
          "We're putting the finishing touches on this page. It will be live soon — thank you for your patience."}
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Back to home
        </Link>
        <Link
          href="/services"
          className="rounded-full border border-border px-6 py-3 text-sm text-foreground transition-colors hover:border-primary"
        >
          Browse services
        </Link>
      </div>
    </section>
  );
}
