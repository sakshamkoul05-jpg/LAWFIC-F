"use client";

import Link from "next/link";
import { categories, liveServices, totalServices } from "@/lib/catalogue";
import { services } from "@/lib/services";
import { plans } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";
import CategoryIcon from "@/components/site/CategoryIcon";

export default function ClassicHomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Subtle radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_50%_50%,rgba(201,168,76,0.06),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <p className="type-label text-primary">LAWFIC</p>
          <h1 className="type-display mt-4 max-w-3xl text-foreground">
            Registrations, licences and compliance — handled.
          </h1>
          <p className="type-body mt-6 max-w-xl text-muted">
            Udyam, GST, PAN and FSSAI filings done end to end. Transparent fees, a prepaid wallet,
            and a jobs feed matched to your profile.
          </p>

          {/* Stat line — inline mono data */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
            <span className="type-data text-foreground">{totalServices} services</span>
            <span className="text-border-3">·</span>
            <span className="type-data text-success">{liveServices.length} live</span>
            <span className="text-border-3">·</span>
            <span className="type-data text-foreground">{categories.length} categories</span>
            <span className="text-border-3">·</span>
            <span className="type-data text-foreground">₹0 hidden fees</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/services"
              className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Browse services
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-border px-6 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-primary"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Service Categories ───────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="type-h2 text-foreground">Service Categories</h2>
          <Link href="/services" className="type-label text-primary hover:text-primary-hover transition-colors">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-4" style={{ gap: "1px" }}>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/services#${c.id}`}
              className="group flex items-center gap-3 bg-surface p-4 transition-colors hover:bg-surface-2"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <CategoryIcon name={c.icon} size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{c.name}</p>
                <p className="type-data mt-0.5 text-[11px] text-muted">
                  {c.services.filter((s) => s.status === "live").length} live
                  <span className="mx-1 text-border-3">·</span>
                  {c.services.length} total
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="rule-x mx-auto h-px max-w-7xl" />

      {/* ── Live Services ────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="type-h2 text-foreground">Live Services</h2>
          <Link href="/services" className="type-label text-primary hover:text-primary-hover transition-colors">
            View all
          </Link>
        </div>
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ gap: "1px" }}>
          {services.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group bg-surface p-5 transition-colors hover:bg-surface-2"
            >
              <p className="type-label text-primary">{s.category}</p>
              <p className="mt-2 text-[14px] font-semibold text-foreground leading-snug">{s.name}</p>
              <p className="mt-1.5 text-[12px] text-muted line-clamp-2 leading-relaxed">{s.tagline}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="type-data text-[14px] text-foreground">
                  {s.fee.professional}
                </span>
                <span className="type-data text-[11px] text-muted">{s.turnaround}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="rule-x mx-auto h-px max-w-7xl" />

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="type-h2 mb-8 text-foreground">How It Works</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", t: "Tell us what you need", b: "A short form. No documents and no payment at this stage." },
            { n: "02", t: "We review and quote", b: "Government fee and our professional fee, itemised." },
            { n: "03", t: "Pay from your wallet", b: "One tap. Your prepaid balance covers it." },
            { n: "04", t: "Track to the certificate", b: "Every stage visible until the certificate is in your hands." },
          ].map((s) => (
            <div key={s.n} className="relative">
              <span className="type-data absolute -top-1 -left-1 text-[48px] font-semibold leading-none text-primary/[0.07] select-none">
                {s.n}
              </span>
              <div className="relative">
                <span className="type-data text-[13px] text-primary">{s.n}</span>
                <h3 className="mt-2 text-[14px] font-semibold text-foreground leading-snug">{s.t}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{s.b}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="rule-x mx-auto h-px max-w-7xl" />

      {/* ── Pricing ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="type-h2 text-foreground">Pricing Plans</h2>
          <Link href="/pricing" className="type-label text-primary hover:text-primary-hover transition-colors">
            Compare plans
          </Link>
        </div>
        <div className="grid gap-px sm:grid-cols-3" style={{ gap: "1px" }}>
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href="/pricing"
              className={`bg-surface p-6 transition-colors ${
                plan.featured
                  ? "ring-1 ring-primary"
                  : "hover:bg-surface-2"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-semibold text-foreground">{plan.name}</p>
                {plan.featured && (
                  <span className="type-data text-[10px] text-primary">Popular</span>
                )}
              </div>
              <p className="type-data mt-3 text-[24px] text-foreground">
                {plan.monthlyPaise === null ? "₹0" : formatPaise(plan.monthlyPaise)}
              </p>
              <p className="type-caption mt-1">{plan.priceNote}</p>
              <p className="mt-3 text-[12.5px] text-muted">{plan.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="rule-x mx-auto h-px max-w-7xl" />

      {/* ── Quick Links ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Jobs for you", desc: "Matched to your city and trade", href: "/jobs" },
            { title: "Your wallet", desc: "Top up and track filings", href: "/wallet" },
            { title: "Your filings", desc: "Track applications", href: "/orders" },
            { title: "Contact us", desc: "Get help from our team", href: "/contact" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group border border-border bg-surface p-5 transition-colors hover:border-primary"
            >
              <p className="text-[13px] font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-[12px] text-muted">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Membership CTA ───────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="overflow-hidden border border-primary/20 bg-primary-light/50 p-8 text-center">
          <h3 className="type-h2 text-primary">Membership Benefits</h3>
          <p className="type-body mx-auto mt-3 max-w-md text-muted">
            Save 10% on all services with a LAWFIC membership plan
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            View Plans
          </Link>
        </div>
      </section>

      {/* ── Stats Strip — dashboard readout ───────────────── */}
      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 py-6 sm:px-6">
          <div className="text-center">
            <p className="type-data text-[28px] text-primary">{totalServices}</p>
            <p className="type-label mt-1">Total Services</p>
          </div>
          <div className="text-center">
            <p className="type-data text-[28px] text-success">{liveServices.length}</p>
            <p className="type-label mt-1">Live Today</p>
          </div>
          <div className="text-center">
            <p className="type-data text-[28px] text-foreground">{categories.length}</p>
            <p className="type-label mt-1">Categories</p>
          </div>
          <div className="text-center">
            <p className="type-data text-[28px] text-foreground">₹0</p>
            <p className="type-label mt-1">Hidden Fees</p>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="type-h1 text-foreground">
            Start with the service you need today.
          </h2>
          <p className="type-body mx-auto mt-4 max-w-lg text-muted">
            Read the page, see the fee, and send us the details. Nothing is charged until we
            have looked at your file and quoted you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/services"
              className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Browse services
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-border px-6 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-primary"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
