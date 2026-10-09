import { ENTITY_LABELS, GST_LABELS, type BusinessProfile } from "@/lib/compliance/calendar";
import { REGIONS } from "@/lib/states";
import { Check, Select } from "./ui";

/**
 * The five questions the calendar runs on. Shared by the free tool (a GET
 * form, short param names) and the business profile (a server action, column
 * names) — `names` maps between them.
 */
export function ProfileFields({
  value,
  names = { entity: "entity", gst: "gst", state: "state", emp: "emp", tds: "tds", audit: "audit" },
}: {
  value?: Partial<BusinessProfile>;
  names?: { entity: string; gst: string; state: string; emp: string; tds: string; audit: string };
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          name={names.entity}
          label="Business type"
          defaultValue={value?.entity ?? "proprietorship"}
          options={Object.entries(ENTITY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <Select
          name={names.gst}
          label="GST"
          defaultValue={value?.gst ?? "none"}
          options={Object.entries(GST_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <Select
          name={names.state}
          label="State"
          defaultValue={value?.state ?? ""}
          options={[{ value: "", label: "Choose…" }, ...REGIONS.map((r) => ({ value: r.code, label: r.name }))]}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Check name={names.emp} label="We pay PF / ESI for staff" defaultChecked={value?.employees} />
        <Check name={names.tds} label="We deduct TDS (rent, contractors, salaries)" defaultChecked={value?.tds} />
        <Check name={names.audit} label="Our accounts need a tax audit" defaultChecked={value?.taxAudit} />
      </div>
    </div>
  );
}
