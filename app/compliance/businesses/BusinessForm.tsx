"use client";

import { useActionState } from "react";
import { saveBusiness, type ActionState } from "../actions";
import { ProfileFields } from "@/components/compliance/ProfileFields";
import { Check, Field } from "@/components/compliance/ui";
import type { BusinessProfile } from "@/lib/compliance/calendar";

export type BusinessRow = {
  id: string;
  name: string;
  entity_type: string;
  state: string;
  gst_scheme: string;
  has_employees: boolean;
  deducts_tds: boolean;
  tax_audit: boolean;
  gstin: string;
  pan: string;
  whatsapp_opt_in: boolean;
  whatsapp_number: string;
};

export function BusinessForm({ business, preset }: { business?: BusinessRow; preset?: Partial<BusinessProfile> }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveBusiness, undefined);

  const value: Partial<BusinessProfile> | undefined = business
    ? {
        entity: business.entity_type as BusinessProfile["entity"],
        gst: business.gst_scheme as BusinessProfile["gst"],
        state: business.state,
        employees: business.has_employees,
        tds: business.deducts_tds,
        taxAudit: business.tax_audit,
      }
    : preset;

  return (
    <form action={action} className="grid gap-5">
      {business && <input type="hidden" name="id" value={business.id} />}
      <Field name="name" label="Business name" required maxLength={120} defaultValue={business?.name ?? ""} placeholder="Kangra Tea Traders" />

      <ProfileFields
        value={value}
        names={{ entity: "entity_type", gst: "gst_scheme", state: "state", emp: "has_employees", tds: "deducts_tds", audit: "tax_audit" }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="gstin" label="GSTIN (optional)" maxLength={15} defaultValue={business?.gstin ?? ""} autoCapitalize="characters" spellCheck={false} />
        <Field name="pan" label="Business PAN (optional)" maxLength={10} defaultValue={business?.pan ?? ""} autoCapitalize="characters" spellCheck={false} />
      </div>

      <div className="rounded-xl border border-border p-4">
        <p className="type-label text-muted">WhatsApp reminders</p>
        <p className="mt-1 text-[12.5px] text-subtle">
          A message a week, three days and a day before each due date, and when a filing you placed with us moves.
          Only to the number you give here; untick to stop.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Check name="whatsapp_opt_in" label="Send me WhatsApp reminders" defaultChecked={business?.whatsapp_opt_in} />
          <Field
            name="whatsapp_number"
            label="WhatsApp number"
            inputMode="tel"
            placeholder="98XXXXXXXX"
            defaultValue={business?.whatsapp_number ? business.whatsapp_number.replace(/^91/, "") : ""}
          />
        </div>
      </div>

      {state?.error && <p className="text-[13px] text-destructive">{state.error}</p>}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-6 py-2.5 text-[13px] font-medium text-background transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : business ? "Save changes" : "Add business"}
        </button>
      </div>
    </form>
  );
}
