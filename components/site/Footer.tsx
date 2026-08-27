import Link from "next/link";
import { categories, liveServices, totalServices } from "@/lib/catalogue";
import CategoryIcon from "./CategoryIcon";
import Wordmark from "./Wordmark";

export default function Footer() {
  return (
    <footer className="relative mt-32 border-t border-line bg-ink-2">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2.4fr]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate">
              Registrations, licences and compliance for Indian businesses — prepared properly,
              priced in the open.
            </p>
            <p className="mt-6 font-mono text-[12px] text-slate tnum">
              <span className="text-brass">{totalServices}</span> services ·{" "}
              <span className="text-jade">{liveServices.length}</span> live
            </p>
          </div>

          {/* The catalogue, by category. Live services link; the rest are listed
              so the footer says what is coming without promising a page. */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <div key={c.id}>
                <p className="mb-3.5 flex items-center gap-2">
                  <CategoryIcon name={c.icon} size={14} className="text-brass-lo" />
                  <span className="label text-slate">{c.name}</span>
                </p>
                <ul className="flex flex-col gap-2">
                  {c.services.slice(0, 5).map((s) =>
                    s.status === "live" ? (
                      <li key={s.slug}>
                        <Link
                          href={`/services/${s.slug}`}
                          className="text-[13px] text-ash transition-colors hover:text-bone"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ) : (
                      <li key={s.slug} className="text-[13px] text-slate">
                        {s.name}
                      </li>
                    )
                  )}
                  {c.services.length > 5 && (
                    <li>
                      <Link
                        href={`/services#${c.id}`}
                        className="text-[13px] text-brass transition-colors hover:text-brass-hi"
                      >
                        +{c.services.length - 5} more
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            ))}

            <div>
              <p className="label mb-3.5 text-slate">Company</p>
              <ul className="flex flex-col gap-2 text-[13px] text-ash">
                {[
                  ["/services", "All services"],
                  ["/about", "About us"],
                  ["/jobs", "Jobs"],
                  ["/wallet", "Wallet"],
                  ["/orders", "Your filings"],
                  ["/login", "Sign in"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="transition-colors hover:text-bone">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
              <span key={t} className="label text-slate">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
