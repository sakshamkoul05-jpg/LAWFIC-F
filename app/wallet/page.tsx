import type { Metadata } from "next";
import Reveal from "@/components/ui/Reveal";
import TopUp from "./TopUp";

export const metadata: Metadata = {
  title: "Wallet",
  description:
    "A prepaid balance for LAWFIC services, with every debit itemised against the order it paid for.",
};

const ledger = [
  { d: "26 Aug 2026", label: "Top-up · UPI", ref: "pay_RQ8kM2xVn", amt: "+ ₹2,000", credit: true },
  { d: "24 Aug 2026", label: "GST registration — professional fee", ref: "ORD-2261", amt: "− ₹1,499", credit: false },
  { d: "24 Aug 2026", label: "GST registration — government fee", ref: "ORD-2261", amt: "₹0", credit: false },
  { d: "19 Aug 2026", label: "Udyam registration — professional fee", ref: "ORD-2244", amt: "− ₹499", credit: false },
  { d: "19 Aug 2026", label: "Top-up · Card", ref: "pay_RP2bF9tQa", amt: "+ ₹2,000", credit: true },
];

export default function WalletPage() {
  return (
    <>
      <section className="grain bloom relative overflow-hidden border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <Reveal>
            <p className="label text-brass">Wallet</p>
            <h1 className="mt-6 max-w-2xl font-display text-[clamp(32px,4.6vw,48px)] leading-[1.08] text-bone">
              Top up once. Pay for filings in a tap.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <Reveal>
            <TopUp />
          </Reveal>

          <Reveal delay={0.08}>
            <div className="overflow-hidden rounded-xl border border-line bg-ink-2">
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <p className="label text-slate">Statement</p>
                <p className="label text-slate">Last 30 days</p>
              </div>

              <div className="divide-y divide-line">
                {ledger.map((r, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] text-bone">{r.label}</p>
                      <p className="mt-1 font-mono text-[11px] tracking-[0.06em] text-slate">
                        {r.d} · {r.ref}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 font-mono text-[14px] tnum ${
                        r.credit ? "text-jade" : "text-bone"
                      }`}
                    >
                      {r.amt}
                    </p>
                  </div>
                ))}
              </div>

              <p className="border-t border-line px-6 py-4 text-[12px] leading-relaxed text-slate">
                Every debit names the order it paid for. Government fees and professional fees stay
                on separate lines. Balance is usable only for LAWFIC services — it cannot be
                transferred to another user or withdrawn to a bank account.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
