import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/compliance/ui";

export const metadata: Metadata = {
  title: "Free tools for Indian businesses",
  description:
    "Free compliance calendar, GST and FSSAI eligibility checker, fee and penalty calculators, name checker and GSTIN verifier. No sign-up.",
  alternates: { canonical: "/tools" },
};

const TOOLS = [
  {
    href: "/tools/compliance-calendar",
    title: "Compliance calendar",
    body: "Every GST, TDS, income tax and ROC date your business owes this year — synced to your phone's calendar.",
  },
  {
    href: "/tools/eligibility",
    title: "What do I need?",
    body: "GST, FSSAI tier, Udyam class, IEC, PF and ESI — from your turnover, state and what you sell.",
  },
  {
    href: "/tools/penalty-calculator",
    title: "Penalty calculator",
    body: "The late fee and interest on a missed GSTR-3B, ITR, TDS or ROC filing, as of today.",
  },
  {
    href: "/tools/fee-calculator",
    title: "Fee calculator",
    body: "Government fee, our fee, your member discount and tax — four lines you can add up.",
  },
  {
    href: "/tools/name-check",
    title: "Name checker",
    body: "Will the registrar accept your company, LLP or brand name? Check the rules before you apply.",
  },
  {
    href: "/tools/verify",
    title: "Verify a GSTIN or PAN",
    body: "Catch a mistyped or invented supplier GSTIN, PAN, CIN or Udyam number in a second.",
  },
];

export default function ToolsPage() {
  return (
    <PageShell
      eyebrow="Free, no sign-up"
      title="Tools for running a business properly"
      lead="Useful whether or not you ever file with us. Nothing you type into them is saved."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary/40"
            >
              <p className="text-[16px] text-foreground group-hover:text-primary">{t.title}</p>
              <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-muted">{t.body}</p>
              <span className="type-label mt-5 text-primary">Open →</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
