import Link from "next/link";
import { categories, liveServices, totalServices } from "@/lib/catalogue";
import { company, formatAddress } from "@/lib/company";
import { legalDocs } from "@/lib/legal";
import CategoryIcon from "./CategoryIcon";
import Wordmark from "./Wordmark";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-32 border-t border-border bg-surface-2/50">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_2.5fr]">
          <div>
            <Wordmark />
            <p className="type-body mt-5 max-w-xs text-muted">
              Registrations, licences and compliance for Indian businesses — prepared properly,
              priced in the open.
            </p>

            <p className="type-data mt-6 text-[12px] text-muted">
              <span className="text-primary">{totalServices}</span> services
              <span className="mx-1.5 text-border-3">·</span>
              <span className="text-success">{liveServices.length}</span> live
            </p>

            <div className="mt-7 flex flex-col gap-2.5 border-t border-border pt-6">
              <p className="type-label">Support</p>
              {company.supportEmail && (
                <a
                  href={`mailto:${company.supportEmail}`}
                  className="text-[12.5px] text-muted transition-colors hover:text-foreground"
                >
                  {company.supportEmail}
                </a>
              )}
              {company.supportPhone && (
                <a
                  href={`tel:${company.supportPhone.replace(/\s/g, "")}`}
                  className="type-data text-[12.5px] text-muted transition-colors hover:text-foreground"
                >
                  {company.supportPhone}
                </a>
              )}
              <p className="text-[12px] text-muted">{company.supportHours}</p>
              <Link
                href="/contact"
                className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-primary transition-colors hover:text-primary-hover"
              >
                Contact &amp; grievances
              </Link>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 3).map((c) => (
              <div key={c.id}>
                <p className="mb-3.5 flex items-center gap-2">
                  <CategoryIcon name={c.icon} size={14} className="text-primary" />
                  <span className="type-label">{c.name}</span>
                </p>
                <ul className="flex flex-col gap-2">
                  {c.services.slice(0, 5).map((s) =>
                    s.status === "live" ? (
                      <li key={s.slug}>
                        <Link
                          href={`/services/${s.slug}`}
                          className="text-[12.5px] text-muted transition-colors hover:text-foreground"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ) : (
                      <li key={s.slug} className="text-[12.5px] text-subtle">
                        {s.name}
                      </li>
                    )
                  )}
                  {c.services.length > 5 && (
                    <li>
                      <Link
                        href={`/services#${c.id}`}
                        className="text-[12.5px] text-primary transition-colors hover:text-primary-hover"
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
                <p className="type-label mb-3.5">Company</p>
                <ul className="flex flex-col gap-2 text-[12.5px] text-muted">
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
                <p className="type-label mb-3.5">Legal</p>
                <ul className="flex flex-col gap-2 text-[12.5px] text-muted">
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

        {/* disclaimer */}
        <div className="mt-14 border border-border bg-surface p-5">
          <p className="type-label mb-2.5 text-primary">Important</p>
          <p className="max-w-3xl text-[12.5px] leading-relaxed text-muted">
            LAWFIC is a private consultancy. We are not affiliated with UIDAI, the Income Tax
            Department, GSTN, FSSAI, the Ministry of Corporate Affairs or any other government
            body, and we are not a GST Suvidha Provider. Government fees are payable to the
            government and are always shown to you separately from our professional fee.
          </p>
        </div>
      </div>

      {/* legal identity + trust bar */}
      <div className="border-t border-border">
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
            <p className="type-label">
              © {year} {company.legalName ?? company.brand}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="3.2" y="7" width="9.6" height="6.4" rx="1.4" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                Secured by TLS
              </span>
              <span className="text-[11px] text-muted">
                Payments by <span className="text-foreground">Razorpay</span>
              </span>
              <Link href="/legal/wallet-terms" className="text-[11px] text-muted hover:text-foreground transition-colors">
                Wallet is closed-loop
              </Link>
            </div>

            {/* Required by the licence on the avatar artwork, not optional
                politeness: the `micah` set is CC BY 4.0. If this line ever
                goes, the avatar style has to change back at the same time.
                See components/wallet/WalletAvatar.tsx. */}
            <p className="mt-4 text-[10.5px] leading-relaxed text-subtle">
              Avatar artwork by Micah Lanier, licensed under{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                rel="noopener noreferrer license"
                target="_blank"
                className="underline underline-offset-2 hover:text-muted"
              >
                CC BY 4.0
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Identity({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <dt className="type-label">{k}</dt>
      <dd className={`mt-1.5 text-[12px] leading-relaxed text-muted ${mono ? "type-data" : ""}`}>
        {v}
      </dd>
    </div>
  );
}
