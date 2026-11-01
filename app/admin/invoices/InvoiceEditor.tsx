"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import InvoiceSheet from "@/components/invoice/InvoiceSheet";
import {
  DEFAULT_MILESTONES,
  DEFAULT_RENEWAL,
  formatINR,
  invoiceFileName,
  LAWFIC_ISSUER,
  newId,
  SERVICES,
  servicePreset,
  TAX_LABEL,
  totals,
  type InvoiceData,
  type ServiceKey,
  type TaxMode,
} from "@/lib/studio-invoice";
import { deleteInvoice, saveInvoice } from "./actions";

/**
 * The invoice editor: every word on the bill is a field on the left, and the
 * bill on the right redraws as you type. Print opens the browser's print
 * dialog with just the A4 sheet in it — choose "Save as PDF" there for a file.
 */

const FONTS = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap";

const input =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-[13.5px] text-foreground outline-none transition-colors placeholder:text-subtle focus:border-primary/60";
const small = "rounded-lg border border-border px-3 py-1.5 text-[12.5px] text-foreground transition-colors hover:border-border-3 disabled:opacity-50";

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
        {aside}
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[12px] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-muted-foreground">
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--primary)]" />
      {label}
    </label>
  );
}

const num = (v: string) => {
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export default function InvoiceEditor({
  id,
  initial,
  canSave,
  saveBlockedReason,
}: {
  id: string | null;
  initial: InvoiceData;
  canSave: boolean;
  saveBlockedReason?: string;
}) {
  const router = useRouter();
  const [d, setD] = useState<InvoiceData>(initial);
  const [savedJson, setSavedJson] = useState(id ? JSON.stringify(initial) : "");
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<"form" | "preview">("form");
  const dirty = JSON.stringify(d) !== savedJson;
  const t = useMemo(() => totals(d), [d]);

  const set = <K extends keyof InvoiceData>(k: K, v: InvoiceData[K]) => setD((cur) => ({ ...cur, [k]: v }));
  const setClient = (k: keyof InvoiceData["client"], v: string) => setD((cur) => ({ ...cur, client: { ...cur.client, [k]: v } }));
  const setIssuer = (k: keyof InvoiceData["issuer"], v: string) => setD((cur) => ({ ...cur, issuer: { ...cur.issuer, [k]: v } }));

  /* Picking a service fills in its title and what it includes — but only
     where those still hold the previous service's defaults, so nothing typed
     by hand is thrown away. */
  const changeService = (key: ServiceKey) => {
    setD((cur) => {
      const prev = servicePreset(cur.service);
      const next = servicePreset(key);
      const items = cur.items.map((it, i) =>
        i === 0 && (!it.title.trim() || it.title === prev.title) ? { ...it, title: next.title } : it,
      );
      const untouched = JSON.stringify(cur.inclusions.filter(Boolean)) === JSON.stringify(prev.inclusions) || cur.inclusions.every((x) => !x.trim());
      return {
        ...cur,
        service: key,
        items,
        inclusions: untouched ? [...next.inclusions] : cur.inclusions,
        showRenewal: untouched ? next.renewal : cur.showRenewal,
      };
    });
  };
  const presetDiffers = JSON.stringify(d.inclusions) !== JSON.stringify(servicePreset(d.service).inclusions);

  /* warn before leaving with unsaved changes */
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const save = () =>
    start(async () => {
      setMsg(null);
      const r = await saveInvoice(id, d);
      if (!r.ok) {
        setMsg({ tone: "err", text: r.error });
        return;
      }
      setSavedJson(JSON.stringify(d));
      setMsg({ tone: "ok", text: "Saved." });
      if (!id) router.replace(`/admin/invoices/${r.id}`);
      else router.refresh();
    });

  const remove = () => {
    if (!id || !window.confirm(`Delete invoice ${d.number}? This cannot be undone.`)) return;
    start(async () => {
      const r = await deleteInvoice(id);
      if (!r.ok) setMsg({ tone: "err", text: r.error ?? "Could not delete." });
      else router.push("/admin/invoices");
    });
  };

  /* ── print: the sheet alone, in an invisible frame, one A4 page ── */
  const printRef = useRef<HTMLDivElement>(null);
  const print = () => {
    const sheet = printRef.current?.firstElementChild as HTMLElement | null;
    if (!sheet) return;
    const name = invoiceFileName(d);
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    Object.assign(frame.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
    document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${name.replace(/</g, "")}</title>
<base href="${window.location.origin}/">
<link rel="stylesheet" href="${FONTS}">
<style>@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#F7F5EF}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
.invoice-sheet{height:1123px;min-height:0!important;page-break-after:avoid;break-after:avoid}</style>
</head><body>${sheet.outerHTML}</body></html>`);
    doc.close();
    const prevTitle = document.title;
    document.title = name;
    const go = async () => {
      try {
        await Promise.all(
          Array.from(doc.images).map((img) => (img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r))))),
        );
        await (doc as Document & { fonts?: FontFaceSet }).fonts?.ready;
      } catch {}
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => {
        document.title = prevTitle;
        frame.remove();
      }, 1000);
    };
    if (doc.readyState === "complete") setTimeout(go, 300);
    else frame.onload = () => setTimeout(go, 300);
  };

  /* ── the scaled preview ── */
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    /* as wide as the column allows, but never taller than the window on a
       desktop, so the whole page stays in view while you type */
    const fitBox = () => {
      const byWidth = el.clientWidth / 794;
      const byHeight = window.innerWidth >= 1024 ? (window.innerHeight - 48) / 1123 : Infinity;
      setScale(Math.max(0.2, Math.min(1, byWidth, byHeight)));
    };
    fitBox();
    const ro = new ResizeObserver(fitBox);
    ro.observe(el);
    window.addEventListener("resize", fitBox);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fitBox);
    };
  }, [tab]);
  /* below about 85% the small print starts to get hard to read */
  const cramped = fit < 0.85;

  const pctSum = d.milestones.reduce((s, m) => s + (m.percent || 0), 0);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6">
      <link rel="stylesheet" href={FONTS} precedence="default" />

      {/* top bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/invoices" className="text-[13px] text-muted-foreground hover:text-foreground">
          ← Invoices
        </Link>
        <h1 className="font-display text-[20px] font-bold text-foreground">{id ? d.number : "New invoice"}</h1>
        <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] ${dirty ? "bg-primary-light text-primary" : "bg-surface-2 text-muted-foreground"}`}>
          {dirty ? "Unsaved changes" : "Saved"}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {id && (
            <>
              <button type="button" onClick={remove} disabled={pending} className={`${small} text-destructive`}>
                Delete
              </button>
              <Link href={`/admin/invoices/new?from=${id}`} className={small}>
                Duplicate
              </Link>
            </>
          )}
          <button type="button" onClick={print} className={small}>
            Print / Save PDF
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending || !canSave || (!dirty && !!id)}
            title={canSave ? undefined : saveBlockedReason}
            className="rounded-lg bg-primary px-4 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : id ? "Save changes" : "Save invoice"}
          </button>
        </div>
      </div>
      {msg && (
        <p role="status" className={`mt-3 text-[13px] ${msg.tone === "ok" ? "text-success" : "text-destructive"}`}>
          {msg.text}
        </p>
      )}
      {!canSave && saveBlockedReason && (
        <p className="mt-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-[12.5px] text-muted-foreground">{saveBlockedReason}</p>
      )}

      {/* phone: form / preview switch */}
      <div className="mt-4 flex gap-1 rounded-full border border-border p-1 lg:hidden">
        {(["form", "preview"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex-1 rounded-full py-1.5 text-[13px] ${tab === k ? "bg-foreground text-background" : "text-muted-foreground"}`}
          >
            {k === "form" ? "Details" : "Preview"}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── the form ── */}
        <div className={`grid content-start gap-4 ${tab === "preview" ? "hidden lg:grid" : ""}`}>
          <Section title="Service">
            <Field label="Type of service">
              <select value={d.service} onChange={(e) => changeService(e.target.value as ServiceKey)} className={input}>
                {SERVICES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            {presetDiffers && servicePreset(d.service).inclusions.length > 0 && (
              <button
                type="button"
                onClick={() => set("inclusions", [...servicePreset(d.service).inclusions])}
                className="justify-self-start text-[12.5px] text-primary hover:underline"
              >
                Use the standard “{servicePreset(d.service).label}” list of inclusions
              </button>
            )}
          </Section>

          <Section title="Invoice">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Invoice number">
                <input value={d.number} onChange={(e) => set("number", e.target.value)} className={input} />
              </Field>
              <Field label="Date">
                <input type="date" value={d.date} onChange={(e) => set("date", e.target.value)} className={input} />
              </Field>
              <Field label="Quotation reference (optional)">
                <input value={d.quoteRef} onChange={(e) => set("quoteRef", e.target.value)} placeholder="LF/QT/2026/1021" className={input} />
              </Field>
              <Field label="Heading">
                <input value={d.heading} onChange={(e) => set("heading", e.target.value)} className={input} />
              </Field>
            </div>
          </Section>

          <Section title="Client">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Business name">
                <input value={d.client.business} onChange={(e) => setClient("business", e.target.value)} placeholder="MV HOMES" className={input} />
              </Field>
              <Field label="Contact person">
                <input value={d.client.person} onChange={(e) => setClient("person", e.target.value)} placeholder="Mr. Vivek Kumar Choudhary" className={input} />
              </Field>
              <Field label="Mobile number">
                <input value={d.client.phone} onChange={(e) => setClient("phone", e.target.value)} placeholder="+91 99113 54620" inputMode="tel" className={input} />
              </Field>
              <Field label="Email">
                <input value={d.client.email} onChange={(e) => setClient("email", e.target.value)} placeholder="name@example.com" type="email" className={input} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <textarea value={d.client.address} onChange={(e) => setClient("address", e.target.value)} rows={2} className={`${input} resize-y`} />
              </Field>
              <Field label="Client GSTIN (optional)">
                <input value={d.client.gstin} onChange={(e) => setClient("gstin", e.target.value)} className={input} />
              </Field>
            </div>
          </Section>

          <Section
            title="Items and price"
            aside={
              <button
                type="button"
                disabled={d.items.length >= 12}
                onClick={() => set("items", [...d.items, { id: newId(), title: "", qty: 1, rate: 0 }])}
                className={small}
              >
                Add item
              </button>
            }
          >
            {d.items.map((it, i) => (
              <div key={it.id} className="grid grid-cols-[minmax(0,1fr)_70px_120px_auto] items-end gap-2">
                <Field label={i === 0 ? "Description" : ""}>
                  <input
                    value={it.title}
                    onChange={(e) => set("items", d.items.map((x) => (x.id === it.id ? { ...x, title: e.target.value } : x)))}
                    className={input}
                  />
                </Field>
                <Field label={i === 0 ? "Qty" : ""}>
                  <input
                    value={it.qty || ""}
                    inputMode="numeric"
                    onChange={(e) => set("items", d.items.map((x) => (x.id === it.id ? { ...x, qty: num(e.target.value) } : x)))}
                    className={input}
                  />
                </Field>
                <Field label={i === 0 ? "Price (₹)" : ""}>
                  <input
                    value={it.rate || ""}
                    inputMode="decimal"
                    placeholder="18000"
                    onChange={(e) => set("items", d.items.map((x) => (x.id === it.id ? { ...x, rate: num(e.target.value) } : x)))}
                    className={input}
                  />
                </Field>
                <button
                  type="button"
                  aria-label="Remove item"
                  disabled={d.items.length <= 1}
                  onClick={() => set("items", d.items.filter((x) => x.id !== it.id))}
                  className="mb-1 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Discount (₹)">
                <input value={d.discount || ""} inputMode="decimal" onChange={(e) => set("discount", num(e.target.value))} placeholder="0" className={input} />
              </Field>
              <Field label="GST">
                <select value={d.tax} onChange={(e) => set("tax", e.target.value as TaxMode)} className={input}>
                  {(Object.keys(TAX_LABEL) as TaxMode[]).map((k) => (
                    <option key={k} value={k}>
                      {k === "add18" ? "Add 18% GST to the total" : TAX_LABEL[k]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-1 rounded-xl bg-surface-2 px-4 py-3 text-[13px] text-muted-foreground">
              <div className="flex justify-between">
                <span>Sub total</span>
                <span>{formatINR(t.subtotal)}</span>
              </div>
              {t.discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>− {formatINR(t.discount)}</span>
                </div>
              )}
              {t.gst > 0 && (
                <div className="flex justify-between">
                  <span>GST @ 18%</span>
                  <span>{formatINR(t.gst)}</span>
                </div>
              )}
              <div className="flex justify-between text-[15px] font-semibold text-foreground">
                <span>Total</span>
                <span>{formatINR(t.total)}</span>
              </div>
            </div>
          </Section>

          <Section
            title="What's included"
            aside={
              <button type="button" disabled={d.inclusions.length >= 16} onClick={() => set("inclusions", [...d.inclusions, ""])} className={small}>
                Add line
              </button>
            }
          >
            {d.inclusions.length === 0 && <p className="text-[12.5px] text-muted-foreground">Nothing listed. Add lines to show what the price covers.</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              {d.inclusions.map((x, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    value={x}
                    onChange={(e) => set("inclusions", d.inclusions.map((y, j) => (j === i ? e.target.value : y)))}
                    className={input}
                  />
                  <button
                    type="button"
                    aria-label="Remove line"
                    onClick={() => set("inclusions", d.inclusions.filter((_, j) => j !== i))}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Payment terms" aside={<Toggle on={d.showTerms} onChange={(v) => set("showTerms", v)} label="Show on bill" />}>
            {d.showTerms && (
              <>
                {d.milestones.map((m) => (
                  <div key={m.id} className="grid grid-cols-[64px_minmax(0,0.8fr)_minmax(0,1.2fr)_auto] items-center gap-2">
                    <div className="relative">
                      <input
                        value={m.percent || ""}
                        inputMode="numeric"
                        aria-label="Percent"
                        onChange={(e) => set("milestones", d.milestones.map((x) => (x.id === m.id ? { ...x, percent: Math.min(100, num(e.target.value)) } : x)))}
                        className={`${input} pr-6`}
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">%</span>
                    </div>
                    <input
                      value={m.label}
                      aria-label="Name"
                      onChange={(e) => set("milestones", d.milestones.map((x) => (x.id === m.id ? { ...x, label: e.target.value } : x)))}
                      className={input}
                    />
                    <input
                      value={m.note}
                      aria-label="When"
                      onChange={(e) => set("milestones", d.milestones.map((x) => (x.id === m.id ? { ...x, note: e.target.value } : x)))}
                      className={input}
                    />
                    <button
                      type="button"
                      aria-label="Remove payment"
                      onClick={() => set("milestones", d.milestones.filter((x) => x.id !== m.id))}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={d.milestones.length >= 4}
                    onClick={() => set("milestones", [...d.milestones, { id: newId(), percent: 0, label: "", note: "" }])}
                    className={small}
                  >
                    Add payment
                  </button>
                  <button type="button" onClick={() => set("milestones", DEFAULT_MILESTONES.map((m) => ({ ...m, id: newId() })))} className={small}>
                    Reset to 50 / 25 / 25
                  </button>
                  <span className={`text-[12.5px] ${pctSum === 100 ? "text-muted-foreground" : "text-destructive"}`}>
                    {pctSum === 100 ? "Adds up to 100%." : `Adds up to ${pctSum}% — make it 100%.`}
                  </span>
                </div>
              </>
            )}
          </Section>

          <Section title="Renewal note" aside={<Toggle on={d.showRenewal} onChange={(v) => set("showRenewal", v)} label="Show on bill" />}>
            {d.showRenewal && (
              <>
                <textarea value={d.renewalText} onChange={(e) => set("renewalText", e.target.value)} rows={3} className={`${input} resize-y`} />
                {d.renewalText !== DEFAULT_RENEWAL && (
                  <button type="button" onClick={() => set("renewalText", DEFAULT_RENEWAL)} className="justify-self-start text-[12.5px] text-primary hover:underline">
                    Use the standard renewal wording
                  </button>
                )}
              </>
            )}
          </Section>

          <Section title="Note (optional)">
            <textarea
              value={d.note}
              onChange={(e) => set("note", e.target.value)}
              rows={2}
              placeholder="Bank details, UPI ID, or anything else to print on the bill"
              className={`${input} resize-y`}
            />
          </Section>

          <details className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <summary className="cursor-pointer text-[14px] font-semibold text-foreground">LAWFIC details on the bill</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Call">
                <input value={d.issuer.phone} onChange={(e) => setIssuer("phone", e.target.value)} className={input} />
              </Field>
              <Field label="Special email · Just 4 U">
                <input value={d.issuer.specialEmail} onChange={(e) => setIssuer("specialEmail", e.target.value)} className={input} />
              </Field>
              <Field label="Customer support">
                <input value={d.issuer.supportEmail} onChange={(e) => setIssuer("supportEmail", e.target.value)} className={input} />
              </Field>
              <Field label="Websites">
                <input value={d.issuer.websites} onChange={(e) => setIssuer("websites", e.target.value)} className={input} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <textarea value={d.issuer.address} onChange={(e) => setIssuer("address", e.target.value)} rows={2} className={`${input} resize-y`} />
              </Field>
              <button type="button" onClick={() => set("issuer", { ...LAWFIC_ISSUER })} className="justify-self-start text-[12.5px] text-primary hover:underline">
                Reset to LAWFIC’s standard details
              </button>
            </div>
          </details>
        </div>

        {/* ── the preview ── */}
        <div className={`${tab === "form" ? "hidden lg:block" : ""}`}>
          <div className="lg:sticky lg:top-4">
            <div ref={box} className="w-full">
              <div
                className="mx-auto overflow-hidden rounded-lg shadow-[0_20px_50px_-24px_rgba(0,0,0,0.5)]"
                style={{ width: 794 * scale, height: 1123 * scale }}
              >
                <div style={{ width: 794, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <InvoiceSheet data={d} onFit={setFit} />
                </div>
              </div>
            </div>
            {fit < 1 && (
              <p className={`mt-3 text-[12.5px] ${cramped ? "text-destructive" : "text-muted-foreground"}`}>
                {cramped
                  ? `There is a lot on this bill, so it has been shrunk to ${Math.round(fit * 100)}% to fit one A4 page. Shorten the inclusions, items or address to make the text larger.`
                  : `Shrunk slightly (${Math.round(fit * 100)}%) to fit one A4 page.`}
              </p>
            )}
            <p className="mt-3 text-[12px] text-muted-foreground">
              Print / Save PDF opens your browser’s print window with just this page. Choose “Save as PDF” to get a file to send.
            </p>
          </div>
        </div>
      </div>

      {/* the unscaled copy the print frame takes */}
      <div ref={printRef} aria-hidden className="pointer-events-none fixed -left-[10000px] top-0">
        <InvoiceSheet data={d} />
      </div>
    </div>
  );
}
