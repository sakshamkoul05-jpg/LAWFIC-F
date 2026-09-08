import Link from "next/link";
import { WHY_LAWFIC } from "@/lib/blueprint";

/**
 * "Why Choose LAWFIC Service ?" — section one in the client's running order.
 *
 * Their instruction is that the case is made SHORT here and Read more goes to
 * the About page, so this is four lines and a link rather than an essay. Each
 * line is a checkable fact about how the work is done — an itemised fee, a
 * named person, a refusal when the papers do not support the filing. Every
 * listing site in the country claims to be trusted and professional; none of
 * that survives being read twice, and a home page that opens with adjectives
 * has spent its best position on nothing.
 */
export default function WhyChooseLawfic() {
  return (
    <section
      id="why-lawfic"
      aria-labelledby="why-lawfic-heading"
      className="border-b border-border bg-surface/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="why-lawfic-heading" className="type-h2 text-foreground">
            Why Choose LAWFIC Service?
          </h2>
          <Link
            href="/about"
            className="text-[13px] font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Read more about LAWFIC →
          </Link>
        </div>

        <ul className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_LAWFIC.map((reason, i) => (
            <li key={reason.title}>
              {/* The number is the only ornament: it gives four blocks of
                  similar-looking text something to be counted by. */}
              <p className="font-mono text-[11px] tracking-[0.28em] text-subtle">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-[15px] font-medium leading-snug text-foreground">
                {reason.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {reason.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
