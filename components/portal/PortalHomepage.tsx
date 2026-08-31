"use client";

import Link from "next/link";
import { categories, liveServices, totalServices } from "@/lib/catalogue";
import { services } from "@/lib/services";
import { plans } from "@/lib/pricing";
import { formatPaise } from "@/lib/money";
import CategoryIcon from "@/components/site/CategoryIcon";
import PortalHeader from "./PortalHeader";
import PortalNavigation from "./PortalNavigation";
import PromotionalBannerBelt from "./PromotionalBannerBelt";

/**
 * Portal theme homepage — dense, structured, information-rich.
 * Uses LAWFIC's real data and functionality.
 */
export default function PortalHomepage() {
  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      <PortalNavigation />
      <PromotionalBannerBelt />

      {/* Service Categories */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-foreground">Service Categories</h2>
          <Link href="/services" className="text-[13px] text-primary hover:text-primary-hover">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/services#${c.id}`}
              className="group flex items-center gap-3 rounded border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-surface-2"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded bg-primary-light text-primary">
                <CategoryIcon name={c.icon} size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{c.name}</p>
                <p className="text-[11px] text-muted">
                  {c.services.filter((s) => s.status === "live").length} live ·{" "}
                  {c.services.length} total
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Services */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-foreground">Live Services</h2>
          <Link href="/services" className="text-[13px] text-primary hover:text-primary-hover">
            View all →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group rounded border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-surface-2"
            >
              <p className="text-[11px] text-primary font-medium">{s.category}</p>
              <p className="mt-1 text-[14px] font-semibold text-foreground">{s.name}</p>
              <p className="mt-1 text-[12px] text-muted line-clamp-2">{s.tagline}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[13px] font-medium text-foreground tabular-nums">
                  {s.fee.professional}
                </span>
                <span className="text-[11px] text-muted">{s.turnaround}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Pricing Quick Look */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-foreground">Pricing Plans</h2>
          <Link href="/pricing" className="text-[13px] text-primary hover:text-primary-hover">
            Compare plans →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
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
                <p className="text-[14px] font-semibold text-foreground">{plan.name}</p>
                {plan.featured && (
                  <span className="text-[9px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    POPULAR
                  </span>
                )}
              </div>
              <p className="mt-2 text-[22px] font-bold text-foreground tabular-nums">
                {plan.monthlyPaise === null ? "₹0" : formatPaise(plan.monthlyPaise)}
              </p>
              <p className="mt-1 text-[11px] text-muted">{plan.priceNote}</p>
              <p className="mt-2 text-[12px] text-muted">{plan.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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
              className="group rounded border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-surface-2"
            >
              <p className="text-[14px] font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-[12px] text-muted">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-t border-border bg-surface py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 px-4 sm:px-6">
          <div className="text-center">
            <p className="text-[24px] font-bold text-primary tabular-nums">{totalServices}</p>
            <p className="text-[11px] text-muted">Total Services</p>
          </div>
          <div className="text-center">
            <p className="text-[24px] font-bold text-success tabular-nums">{liveServices.length}</p>
            <p className="text-[11px] text-muted">Live Today</p>
          </div>
          <div className="text-center">
            <p className="text-[24px] font-bold text-primary tabular-nums">{categories.length}</p>
            <p className="text-[11px] text-muted">Categories</p>
          </div>
          <div className="text-center">
            <p className="text-[24px] font-bold text-primary tabular-nums">₹0</p>
            <p className="text-[11px] text-muted">Hidden Fees</p>
          </div>
        </div>
      </section>
    </div>
  );
}
