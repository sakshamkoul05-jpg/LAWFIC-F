import Link from "next/link";
import { categories, liveServices, totalServices } from "@/lib/catalogue";
import { company, formatAddress } from "@/lib/company";
import { legalDocs } from "@/lib/legal";
import CategoryIcon from "./CategoryIcon";
import Wordmark from "./Wordmark";

/**
 * The footer carries three jobs, and the third is the one most sites skip:
 *
 *   1. navigation into the catalogue;
 *   2. the reassurance block — hours, support, payment handling;
 *   3. THE LEGAL IDENTITY BLOCK. Companies Act s.12 requires the CIN on the
 *      website (₹1,000/day for omission), and the Consumer Protection
 *      (E-Commerce) Rules 2020 require the legal name, registered address and
 *      customer-care contact to be displayed clearly.
 *
 * Everything in (3) reads from lib/company.ts and renders nothing while a
 * value is null. A fabricated CIN would be a false statement about a real
 * company, which is a worse outcome than a gap.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-32 border-t border-border bg-surface-2">
      {/* main columns */}
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_2.5fr]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              Registrations, licences and compliance for Indian businesses — prepared properly,
              priced in the open.
            </p>

            <p className="mt-6 font-mono text-[12px] text-muted tabular-nums">
              <span className="text-primary">{totalServices}</span> services ·{" "}
              <span className="text-success">{liveServices.length}</span> live
            </p>

            {/* support block */}
            <div className="mt-7 flex flex-col gap-2.5 border-t border-border pt-6">
              <p className="label text-muted">Support</p>
              {company.supportEmail && (
                <a
                  href={`mailto:${company.supportEmail}`}
                  className="text-[13px] text-muted transition-colors hover:text-foreground"
                >
                  {company.supportEmail}
                </a>
              )}
              {company.supportPhone && (
                <a
                  href={`tel:${company.supportPhone.replace(/\s/g, "")}`}
                  className="font-mono text-[13px] text-muted transition-colors hover:text-foreground"
                >
                  {company.supportPhone}
                </a>
              )}
              <p className="text-[12.5px] leading-relaxed text-muted">{company.supportHours}</p>
              <Link
                href="/contact"
                className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-primary transition-colors hover:text-primary-hover"
              >
                Contact & grievances
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2 6h7M6.5 3.5 9 6l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 3).map((c) => (
              <div key={c.id}>
                <p className="mb-3.5 flex items-center gap-2">
                  <CategoryIcon name={c.icon} size={14} className="text-primary" />
                  <span className="label text-muted">{c.name}</span>
                </p>
                <ul className="flex flex-col gap-2">
                  {c.services.slice(0, 5).map((s) =>
                    s.status === "live" ? (
                      <li key={s.slug}>
                        <Link
                          href={`/services/${s.slug}`}
                          className="text-[13px] text-muted transition-colors hover:text-foreground"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ) : (
                      <li key={s.slug} className="text-[13px] text-subtle">
                        {s.name}
                      </li>
                    )
                  )}
                  {c.services.length > 5 && (
                    <li>
                      <Link
                        href={`/services#${c.id}`}
                        className="text-[13px] text-primary transition-colors hover:text-primary-hover"
                      >
                        +{c.services.length - 5} more
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            ))}

            <div className="flex flex-col gap-8">
              <div>
                <p className="label mb-3.5 text-muted">Company</p>
                <ul className="flex flex-col gap-2 text-[13px] text-muted">
                  {[
                    ["/services", "All services"],
                    ["/pricing", "Pricing"],
                    ["/about", "About us"],
                    ["/contact", "Contact"],
                    ["/jobs", "Jobs"],
                  ].map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="transition-colors hover:text-foreground">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="label mb-3.5 text-muted">Legal</p>
                <ul className="flex flex-col gap-2 text-[13px] text-muted">
                  {legalDocs.map((d) => (
                    <li key={d.slug}>
                      <Link href={`/legal/${d.slug}`} className="transition-colors hover:text-foreground">
                        {d.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* the disclaimer. Not fine print — it is the positioning. */}
        <div className="mt-14 rounded border border-border bg-surface p-5">
          <p className="label mb-2.5 text-primary">Important</p>
          <p className="max-w-3xl text-[13px] leading-relaxed text-muted">
            LAWFIC is a private consultancy. We are not affiliated with UIDAI, the Income Tax
            Department, GSTN, FSSAI, the Ministry of Corporate Affairs or any other government
            body, and we are not a GST Suvidha Provider. Government fees are payable to the
            government and are always shown to you separately from our professional fee.
          </p>
        </div>
      </div>

      {/* legal identity bar */}
      <div className="border-t border-border bg-surface-2">
        <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
          {(company.legalName || company.cin || company.registeredAddress || company.gstin) && (
            <dl className="mb-6 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              {company.legalName && <Identity k="Registered name" v={company.legalName} />}
              {company.cin && <Identity k="CIN" v={company.cin} mono />}
              {company.gstin && <Identity k="GSTIN" v={company.gstin} mono />}
              {company.registeredAddress && (
                <Identity k="Registered office" v={formatAddress(company.registeredAddress)} />
              )}
            </dl>
          )}

          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <p className="label text-muted">
              © {year} {company.legalName ?? company.brand}
            </p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="flex items-center gap-2 text-[11.5px] text-muted">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="3.2" y="7" width="9.6" height="6.4" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                Secured by TLS
              </span>
              <span className="text-[11.5px] text-muted">
                Payments by <span className="text-foreground">Razorpay</span>
              </span>
              <Link href="/legal/wallet-terms" className="text-[11.5px] text-muted hover:text-foreground">
                Wallet is closed-loop
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Identity({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <dt className="label text-muted">{k}</dt>
      <dd className={`mt-1.5 text-[12.5px] leading-relaxed text-muted ${mono ? "font-mono tracking-[0.04em]" : ""}`}>
        {v}
      </dd>
    </div>
  );
}
