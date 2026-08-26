import Link from "next/link";
import { services, upcoming } from "@/lib/services";
import Wordmark from "./Wordmark";

export default function Footer() {
  return (
    <footer className="relative mt-32 border-t border-line bg-ink-2">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate">
              Registrations, licences and compliance for Indian businesses — prepared properly,
              priced in the open.
            </p>
          </div>

          <FooterCol title="Services">
            {services.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`} className="hover:text-bone">
                {s.short}
              </Link>
            ))}
          </FooterCol>

          <FooterCol title="Coming soon">
            {upcoming.map((u) => (
              <span key={u.name} className="text-slate">
                {u.name}
              </span>
            ))}
          </FooterCol>

          <FooterCol title="Company">
            <Link href="/about" className="hover:text-bone">About us</Link>
            <Link href="/jobs" className="hover:text-bone">Jobs</Link>
            <Link href="/wallet" className="hover:text-bone">Wallet</Link>
            <Link href="/login" className="hover:text-bone">Sign in</Link>
          </FooterCol>
        </div>

        {/* Rule 3 and the positioning line from the plan. This is not fine print. */}
        <div className="mt-14 rounded border border-line bg-surface/50 p-5">
          <p className="label mb-2.5 text-brass-lo">Important</p>
          <p className="max-w-3xl text-[13px] leading-relaxed text-slate">
            LAWFIC is a private consultancy. We are not affiliated with UIDAI, the Income Tax
            Department, GSTN, FSSAI or any government body, and we are not a GST Suvidha Provider.
            Government fees are payable to the government and are always shown to you separately
            from our professional fee.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="label text-slate">© {new Date().getFullYear()} LAWFIC</p>
          <div className="flex flex-wrap gap-6">
            {["Terms", "Privacy", "Refunds", "Wallet terms"].map((t) => (
              <span key={t} className="label text-slate">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label mb-4 text-slate">{title}</p>
      <div className="flex flex-col gap-2.5 text-sm text-ash">{children}</div>
    </div>
  );
}
