"use client";

import Link from "next/link";
import { categories, liveServices, totalServices } from "@/lib/catalogue";
import { services } from "@/lib/services";
import { plans } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";
import CategoryIcon from "@/components/site/CategoryIcon";
import ClassicHeader from "./ClassicHeader";
import ClassicCategoryTabs from "./ClassicCategoryTabs";
import ClassicPromotionalBanners from "./ClassicPromotionalBanners";

/**
 * Classic theme homepage — dense, information-rich layout based on the client-approved reference.
 * Renders its own header + tabs + promotional banners + main content.
 */
export default function ClassicHomePage() {
  return (
    <div className="min-h-screen bg-background">
      <ClassicHeader />
      <ClassicCategoryTabs />
      <ClassicPromotionalBanners />

      {/* Service Categories Grid */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-foreground">Service Categories</h2>
          <Link href="/services" className="text-[12px] text-primary hover:text-primary-hover">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/services#${c.id}`}
              className="group flex items-center gap-3 rounded border border-border bg-surface p-3 transition-colors hover:border-primary hover:bg-surface-2"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded bg-primary-light text-primary">
                <CategoryIcon name={c.icon} size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate">{c.name}</p>
                <p className="text-[10px] text-muted">
                  {c.services.filter((s) => s.status === "live").length} live ·{" "}
                  {c.services.length} total
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Services */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-foreground">Live Services</h2>
          <Link href="/services" className="text-[12px] text-primary hover:text-primary-hover">
            View all →
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group rounded border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-surface-2"
            >
              <p className="text-[10px] text-primary font-medium uppercase tracking-wider">{s.category}</p>
              <p className="mt-1 text-[13px] font-semibold text-foreground">{s.name}</p>
              <p className="mt-1 text-[11px] text-muted line-clamp-2">{s.tagline}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[12px] font-medium text-foreground tabular-nums">
                  {s.fee.professional}
                </span>
                <span className="text-[10px] text-muted">{s.turnaround}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works — Compact Steps */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-3">
          <h2 className="text-[16px] font-bold text-foreground">How It Works</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", t: "Tell us what you need", b: "A short form. No documents and no payment at this stage." },
            { n: "02", t: "We review and quote", b: "Government fee and our professional fee, itemised." },
            { n: "03", t: "Pay from your wallet", b: "One tap. Your prepaid balance covers it." },
            { n: "04", t: "Track to the certificate", b: "Every stage visible until the certificate is in your hands." },
          ].map((s) => (
            <div key={s.n} className="rounded border border-border bg-surface p-4">
              <span className="font-mono text-[11px] tracking-[0.14em] text-primary">{s.n}</span>
              <h3 className="mt-2 text-[13px] font-semibold text-foreground leading-snug">{s.t}</h3>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-foreground">Pricing Plans</h2>
          <Link href="/pricing" className="text-[12px] text-primary hover:text-primary-hover">
            Compare plans →
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href="/pricing"
              className={`rounded border p-4 transition-colors ${
                plan.featured
                  ? "border-primary bg-primary-light"
                  : "border-border bg-surface hover:border-primary"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-foreground">{plan.name}</p>
                {plan.featured && (
                  <span className="text-[9px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    POPULAR
                  </span>
                )}
              </div>
              <p className="mt-2 text-[20px] font-bold text-foreground tabular-nums">
                {plan.monthlyPaise === null ? "₹0" : formatPaise(plan.monthlyPaise)}
              </p>
              <p className="mt-1 text-[10px] text-muted">{plan.priceNote}</p>
              <p className="mt-2 text-[11px] text-muted">{plan.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Links Grid */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Jobs for you", desc: "Matched to your city and trade", href: "/jobs", icon: "💼" },
            { title: "Your wallet", desc: "Top up and track filings", href: "/wallet", icon: "💰" },
            { title: "Your filings", desc: "Track applications", href: "/orders", icon: "📋" },
            { title: "Contact us", desc: "Get help from our team", href: "/contact", icon: "📞" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-surface-2"
            >
              <p className="text-[13px] font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-[11px] text-muted">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Membership Benefits Banner */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="overflow-hidden rounded-lg border-2 border-primary bg-primary-light p-6 text-center">
          <h3 className="text-[18px] font-bold text-primary">Membership Benefits</h3>
          <p className="mt-2 text-[13px] text-muted">Save 10% on all services with a LAWFIC membership plan</p>
          <Link
            href="/pricing"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-primary-hover"
          >
            View Plans
          </Link>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-t border-border bg-surface py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 sm:px-6">
          <div className="text-center">
            <p className="text-[22px] font-bold text-primary tabular-nums">{totalServices}</p>
            <p className="text-[10px] text-muted">Total Services</p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-bold text-success tabular-nums">{liveServices.length}</p>
            <p className="text-[10px] text-muted">Live Today</p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-bold text-primary tabular-nums">{categories.length}</p>
            <p className="text-[10px] text-muted">Categories</p>
          </div>
          <div className="text-center">
            <p className="text-[22px] font-bold text-primary tabular-nums">₹0</p>
            <p className="text-[10px] text-muted">Hidden Fees</p>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <h2 className="text-[20px] font-bold text-foreground">
            Start with the service you need today.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-muted">
            Read the page, see the fee, and send us the details. Nothing is charged until we
            have looked at your file and quoted you.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/services"
              className="rounded-full bg-primary px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Browse services
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-border px-5 py-2.5 text-[13px] text-foreground transition-colors hover:border-primary"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
