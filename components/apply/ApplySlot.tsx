"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { APPLY_FORM_SLUGS } from "@/lib/apply-forms";

/**
 * The bespoke application form for a service, where one has been built.
 *
 * WHY A REGISTRY AND NOT A PAGE PER SERVICE
 *
 * Udyam and Aadhaar earn a real form: each has a rule worth doing live — a
 * classification that decides what the customer is buying, a lifetime limit
 * that decides whether they can buy it at all. The other thirty-seven services
 * do not, and copying the whole service page to bolt a form onto two of them
 * would leave thirty-nine pages to keep in step instead of one.
 *
 * So the service page keeps its hero, its steps, its FAQ and its structured
 * data, and asks here whether this particular service has something better than
 * the generic request form. Adding one later is a line in this map.
 *
 * LOADED ON DEMAND
 *
 * Both forms carry their own validation, a motion runtime and, in Udyam's case,
 * the classification tables. None of that belongs in the bundle of a service
 * page that has no form — the other thirty-seven would pay for it and render
 * nothing.
 */

const spinner = () => (
  <div className="grid min-h-[320px] place-items-center rounded-3xl border border-border bg-surface">
    <Loader2 size={20} className="animate-spin text-muted-foreground" aria-hidden />
    <span className="sr-only">Loading the application form</span>
  </div>
);

const FORMS: Record<string, React.ComponentType> = {
  "msme-udyam": dynamic(() => import("./UdyamApply"), { ssr: false, loading: spinner }),
  aadhaar: dynamic(() => import("./AadhaarApply"), { ssr: false, loading: spinner }),
};

/* The two lists must agree: a slug the page thinks has a form, with nothing
   here to render, hides the enquiry box and puts nothing in its place — a
   service page with no way to reach anybody. Caught at module load in
   development rather than by a customer. */
if (process.env.NODE_ENV !== "production") {
  const missing = APPLY_FORM_SLUGS.filter((slug) => !(slug in FORMS));
  if (missing.length) {
    throw new Error(
      `apply-forms lists ${missing.join(", ")} but ApplySlot has no component for them.`,
    );
  }
}

export default function ApplySlot({ slug }: { slug: string }) {
  const Form = FORMS[slug];
  if (!Form) return null;
  return <Form />;
}
