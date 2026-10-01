"use client";

import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/blueprint";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * "Service Explore By Category !!" — section three in the client's running
 * order, and the largest thing on the page.
 *
 * Nine categories, in their order, under their headings. The sheet numbers
 * twelve item rows under each; where it fills them in, every line is here
 * verbatim, and each row clicks through.
 *
 * WHY FOUR OF THEM ARE SHORT
 *
 * Investment, Social, Partner and Entertainment are numbered 1 to 12 in the
 * sheet with nothing written against the numbers. They render as a heading and
 * a plain statement that the list is coming, rather than with twelve invented
 * service names. Inventing them would put a promise to sell something on a real
 * consultancy's page, and the client is the only one who can say what those
 * lines are — the empty rows are a question to them, not a gap to fill.
 *
 * The columns are a grid rather than a horizontal scroller. Nine categories
 * side by side would hide six of them at any width, and the whole point of the
 * section is that a visitor can see how much is on offer at once.
 */
/* Each category is a card of the same size, showing at most this many rows
   and "& more" to the rest — a twelve-row list beside a three-row one is what
   made the section look uneven. */
const SHOWN = 6;

export default function ServiceByCategory() {
  const { tx } = useLocale();

  return (
    <section
      id="categories-blueprint"
      aria-labelledby="categories-blueprint-heading"
      className="home-band is-tint"
    >
      <div className="home-wrap home-section">
        <h2 id="categories-blueprint-heading" className="home-section-title">
          {tx("SERVICE EXPLORE BY CATEGORY !!")}
        </h2>
        <p className="home-section-sub">
          {tx("Nine categories. Every row goes to the page that does the work.")}
        </p>

        <div className="home-section-body grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_CATEGORIES.map((cat) => (
            <div key={cat.n} className="home-cat-card">
              <p className="type-label text-[#C6A15B]">
                {tx("Category")} {cat.n}
              </p>
              <h3 className="mt-1.5 border-b border-border pb-3 text-[15px] font-semibold leading-snug text-foreground">
                <Link href={cat.href} className="transition-colors hover:text-primary">
                  {tx(cat.title)}
                </Link>
              </h3>

              {cat.items.length > 0 ? (
                <ul className="mt-3 flex flex-1 flex-col space-y-0.5">
                  {cat.items.slice(0, SHOWN).map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="group flex items-baseline gap-2 py-[3px] text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <span className="min-w-0 flex-1">{tx(item.label)}</span>
                        {/* A quiet mark for the ones that are actually
                            written, so a visitor can tell what they can
                            finish today from what needs a conversation. */}
                        {item.live && (
                          <span
                            aria-label={tx("Available now")}
                            title={tx("Available now")}
                            className="mt-[3px] size-[5px] shrink-0 rounded-full bg-primary"
                          />
                        )}
                      </Link>
                    </li>
                  ))}
                  <li className="mt-auto pt-2.5">
                    <Link
                      href={cat.href}
                      className="text-[12.5px] font-medium text-primary transition-colors hover:text-primary-hover"
                    >
                      {cat.items.length > SHOWN ? `${tx("& more")} (${cat.items.length - SHOWN})` : tx("& more")} →
                    </Link>
                  </li>
                </ul>
              ) : (
                <p className="mt-3 text-[13px] leading-relaxed text-subtle">
                  {tx("The list for this category is still being written.")}{" "}
                  <Link href={cat.href} className="text-primary hover:text-primary-hover">
                    {tx("See the section")}
                  </Link>
                  .
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
