import type { Metadata } from "next";
import Link from "next/link";
import RequestForm from "@/components/site/RequestForm";
import { company } from "@/lib/company";
import { Card, PageShell } from "@/components/compliance/ui";

/**
 * Instant Help: a paid 15-minute call with an expert, booked here and paid
 * from the wallet.
 *
 * It rides the existing order flow rather than inventing a booking system: the
 * request becomes a service_orders row ("expert-call"), back office confirms
 * the slot and quotes the fee, the customer pays from their wallet, and the
 * order thread is where the call details go. That keeps the money on the same
 * audited ledger as every filing, and refunds work the way they already do.
 */

export const metadata: Metadata = {
  title: "Talk to an expert — 15-minute call",
  description:
    "A 15-minute call with a LAWFIC specialist on GST, income tax, company compliance, trademarks or licences. Booked online, paid from your LAWFIC wallet.",
  alternates: { canonical: "/instant-help" },
};

const POINTS = [
  { title: "15 minutes, one specialist", body: "Someone who handles your kind of question every day — not a call centre reading a script." },
  { title: "Fee confirmed first", body: "We confirm the slot and the fee before anything leaves your wallet. Decline and you pay nothing." },
  { title: "Written follow-up", body: "What was agreed lands in your order thread, so you have it in writing." },
];

export default function InstantHelpPage() {
  const whatsapp = (company.whatsapp ?? "").replace(/\D/g, "");
  return (
    <PageShell
      eyebrow="Instant help"
      title="Talk to an expert"
      lead="When the question is “which one do I need?” or “what does this notice mean?”, fifteen minutes with someone who knows is worth more than an afternoon of searching."
      width="max-w-5xl"
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div className="grid gap-3">
          {POINTS.map((p) => (
            <Card key={p.title}>
              <p className="text-[15px] text-foreground">{p.title}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{p.body}</p>
            </Card>
          ))}
          <p className="mt-2 text-[12.5px] text-muted">
            Just need a quick answer?{" "}
            {whatsapp ? (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Message us on WhatsApp
              </a>
            ) : (
              <Link href="/contact" className="text-primary hover:underline">
                Contact support
              </Link>
            )}{" "}
            — free, during working hours. Or try the{" "}
            <Link href="/tools" className="text-primary hover:underline">
              free tools
            </Link>
            .
          </p>
        </div>
        <div>
          <RequestForm slug="expert-call" label="a 15-minute expert call" turnaround="Usually the same working day" />
        </div>
      </div>
    </PageShell>
  );
}
