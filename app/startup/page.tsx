import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Startup",
  description:
    "From idea to registered business — MSME/Udyam, incorporation, and the structures behind a new venture.",
};

const slugs = ["msme-udyam"];

export default function StartupPage() {
  const items = slugs
    .map((s) => services.find((sv) => sv.slug === s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const soon = [
    "Private Limited Company",
    "LLP Registration",
    "One Person Company",
    "Partnership Firm",
    "Sole Proprietorship",
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <p className="label text-primary">Startup</p>
      <h1 className="mt-4 font-display text-[clamp(30px,4.6vw,48px)] leading-tight text-foreground">
        From idea to registered business
      </h1>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted">
        The right structure depends on who you are, what you sell, and how you want to grow. We
        help you choose — then we register it for you.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <Link
            key={s.slug}
            href={`/services/${s.slug}`}
            className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary hover:bg-surface-2"
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
              {s.category}
            </p>
            <h2 className="mt-2 font-display text-[20px] text-foreground">{s.name}</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{s.tagline}</p>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
              <span className="text-[13px] font-medium text-foreground tabular-nums">
                {s.fee.professional}
              </span>
              <span className="text-[11px] text-muted">{s.turnaround}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-dashed border-border-3 bg-surface p-8">
        <h2 className="font-display text-[18px] text-foreground">Incorporation structures coming soon</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {soon.map((name) => (
            <li
              key={name}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3 text-[13.5px] text-muted"
            >
              {name}
              <span className="text-[10px] font-medium uppercase tracking-wide text-subtle">soon</span>
            </li>
          ))}
        </ul>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
        >
          Talk to us about incorporation
        </Link>
      </div>
    </section>
  );
}
