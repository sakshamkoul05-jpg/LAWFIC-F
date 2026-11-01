"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import {
  amountInWords,
  formatINR,
  formatINRExact,
  formatInvoiceDate,
  TAX_LABEL,
  toPaise,
  totals,
  type InvoiceData,
} from "@/lib/studio-invoice";

/**
 * The bill itself: LAWFIC's ivory "security paper" invoice — guilloche rings,
 * ornamental corners, the badge as a large watermark — exactly as issued to
 * MV Homes and Cubtix, but drawn from data so the back office can fill it in.
 *
 * It is one A4 page at 96 dpi (794 × 1123 px) and prints at that size. A bill
 * with more on it than fits is scaled down as a whole until it does, so it
 * always prints on one page; `onFit` reports by how much. Colours
 * and fonts are fixed rather than taken from the site theme: a bill looks the
 * same whatever theme the person printing it happens to use.
 */

const GOLD = "#8A6A12";
const INK = "#161616";
const BODY = "#2E2B26";
const MUTED = "#5A564E";
const PAPER = "#F7F5EF";
const LINE = "#E0D6BC";
const CARD = "rgba(255,255,255,0.78)";

const label: CSSProperties = {
  fontSize: 9.5,
  letterSpacing: 1.8,
  textTransform: "uppercase",
  color: GOLD,
  fontWeight: 800,
};

const serif = "'Playfair Display', Georgia, 'Times New Roman', serif";
const sans = "'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif";

function Corner({ transform }: { transform: string }) {
  return (
    <g transform={transform}>
      <rect x="-60" y="-60" width="150" height="150" transform="rotate(45 15 15)" />
      <rect x="-45" y="-45" width="120" height="120" transform="rotate(45 15 15)" />
      <rect x="-30" y="-30" width="90" height="90" transform="rotate(45 15 15)" />
      <rect x="-60" y="-60" width="150" height="150" />
      <rect x="-40" y="-40" width="110" height="110" />
      <rect x="-20" y="-20" width="70" height="70" />
    </g>
  );
}

function Paper() {
  return (
    <svg aria-hidden width="794" height="1123" viewBox="0 0 794 1123" style={{ position: "absolute", left: 0, top: 0, zIndex: 0 }}>
      <g fill="none" stroke="#D9CFB4" strokeWidth="1">
        <rect x="18" y="18" width="758" height="1087" />
        <rect x="26" y="26" width="742" height="1071" stroke="#E4DCC6" />
      </g>
      <g fill="none" stroke="#E2D9C2" strokeWidth="0.8">
        {Array.from({ length: 15 }, (_, i) => (
          <circle key={i} cx="397" cy="440" r={60 + i * 20} />
        ))}
      </g>
      <g fill="none" stroke="#D6C9A4" strokeWidth="1" opacity="0.7">
        <rect x="267" y="310" width="260" height="260" />
        <rect x="267" y="310" width="260" height="260" transform="rotate(45 397 440)" />
        <rect x="287" y="330" width="220" height="220" transform="rotate(22.5 397 440)" />
        <rect x="287" y="330" width="220" height="220" transform="rotate(67.5 397 440)" />
      </g>
      <g fill="none" stroke="#D2C49C" strokeWidth="1" opacity="0.85">
        <Corner transform="translate(18 18)" />
        <Corner transform="translate(776 18) scale(-1 1)" />
        <Corner transform="translate(18 1105) scale(1 -1)" />
        <Corner transform="translate(776 1105) scale(-1 -1)" />
      </g>
    </svg>
  );
}

function Contact({ title, value, gold = false }: { title: string; value: string; gold?: boolean }) {
  if (!value.trim()) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ fontSize: 9, letterSpacing: 1.6, textTransform: "uppercase", color: gold ? GOLD : "#6F6A5F", fontWeight: gold ? 800 : 700 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

export default function InvoiceSheet({
  data,
  id,
  onFit,
}: {
  data: InvoiceData;
  id?: string;
  onFit?: (scale: number) => void;
}) {
  const t = totals(data);
  const body = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const measure = () => {
      const s = Math.min(1, 1123 / Math.max(1, el.offsetHeight));
      setFit((cur) => (Math.abs(cur - s) > 0.001 ? s : cur));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => onFit?.(fit), [fit, onFit]);
  const c = data.client;
  const business = c.business.trim() || c.person.trim() || "Client name";
  const nameSize = business.length > 30 ? 30 : business.length > 20 ? 38 : 46;
  const contactLine = [c.phone, c.email].map((s) => s.trim()).filter(Boolean).join(" · ");
  const items = data.items.filter((it) => it.title.trim() || it.rate);
  const showBreakdown = items.length > 1 || t.discount > 0 || t.gst > 0;
  const inclusions = data.inclusions.map((s) => s.trim()).filter(Boolean);
  const milestones = data.showTerms ? data.milestones.filter((m) => m.percent > 0) : [];
  const cols = Math.min(4, Math.max(1, milestones.length));

  return (
    <div
      id={id}
      className="invoice-sheet"
      style={{
        width: 794,
        height: 1123,
        boxSizing: "border-box",
        background: PAPER,
        color: INK,
        fontFamily: sans,
        position: "relative",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <Paper />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/lawfic-logo.png"
        alt=""
        aria-hidden
        style={{ position: "absolute", left: 157, top: 227, width: 480, height: "auto", opacity: 0.11, zIndex: 0, pointerEvents: "none" }}
      />

      <div
        ref={body}
        style={{
          position: "relative",
          zIndex: 1,
          transform: fit < 1 ? `scale(${fit})` : undefined,
          transformOrigin: "top center",
          minHeight: 1123,
          boxSizing: "border-box",
          padding: "46px 56px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 999,
            background: "#FFFFFF",
            border: "1px solid #D9CFB4",
            boxShadow: `0 0 0 6px ${PAPER}, 0 0 0 7px #E4DCC6`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lawfic-logo.png" alt="Lawfic logo" style={{ width: 78, height: "auto", display: "block" }} />
        </div>

        <div style={{ marginTop: 18, fontFamily: serif, fontSize: 23, fontWeight: 700, letterSpacing: -0.3 }}>{data.heading}</div>
        <div
          style={{
            marginTop: 4,
            fontFamily: serif,
            fontSize: nameSize,
            fontWeight: 800,
            letterSpacing: -0.8,
            lineHeight: 1.1,
            textAlign: "center",
            color: c.business.trim() || c.person.trim() ? INK : "#B9B2A3",
          }}
        >
          {business}
        </div>
        {c.business.trim() && c.person.trim() && (
          <div style={{ marginTop: 10, fontSize: 23, fontWeight: 800, color: BODY, lineHeight: 1.3, textAlign: "center" }}>{c.person}</div>
        )}
        {contactLine && (
          <div style={{ marginTop: 4, fontSize: 19, color: BODY, lineHeight: 1.3, textAlign: "center" }}>{contactLine}</div>
        )}
        {c.address.trim() && (
          <div style={{ marginTop: 4, fontSize: 18, color: BODY, lineHeight: 1.35, textAlign: "center", whiteSpace: "pre-line", maxWidth: 620 }}>
            {c.address}
          </div>
        )}
        {c.gstin.trim() && (
          <div style={{ marginTop: 4, fontSize: 13, color: MUTED, letterSpacing: 1 }}>GSTIN: {c.gstin.toUpperCase()}</div>
        )}

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 10.5, letterSpacing: 3, textTransform: "uppercase", color: GOLD, fontWeight: 800 }}>Total Amount</div>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{formatINR(t.total)}</div>
          <div style={{ fontSize: 13, fontStyle: "italic", color: BODY, fontWeight: 600 }}>{amountInWords(t.total)}</div>
          <div
            style={{
              marginTop: 4,
              background: "#141414",
              color: "#E3C35A",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.8,
              textTransform: "uppercase",
              padding: "6px 14px",
              borderRadius: 999,
            }}
          >
            {TAX_LABEL[data.tax]}
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            width: "100%",
            background: CARD,
            border: `1px solid ${LINE}`,
            borderRadius: 12,
            padding: "16px 20px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={label}>Particulars</div>
          {items.length === 0 && <div style={{ fontSize: 14, fontWeight: 800, color: "#B9B2A3" }}>Service</div>}
          {items.map((it) => (
            <div key={it.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{it.title || "Service"}</div>
              <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap" }}>
                {it.qty} × {formatINRExact(toPaise(it.rate))}
              </div>
            </div>
          ))}
          {inclusions.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "6px 12px",
                fontSize: 10.5,
                color: BODY,
                lineHeight: 1.4,
              }}
            >
              {inclusions.map((x, i) => (
                <div key={i}>◆ {x}</div>
              ))}
            </div>
          )}
          {showBreakdown && (
            <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 8, display: "grid", gap: 3, fontSize: 12, color: BODY }}>
              <Row k="Sub total" v={formatINR(t.subtotal)} />
              {t.discount > 0 && <Row k="Discount" v={`− ${formatINR(t.discount)}`} />}
              {t.gst > 0 && <Row k="GST @ 18%" v={formatINR(t.gst)} />}
              <Row k="Total" v={formatINR(t.total)} strong />
            </div>
          )}
        </div>

        {milestones.length > 0 && (
          <div style={{ marginTop: 14, width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={label}>Payment Terms</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 12 }}>
              {milestones.map((m, i) => {
                const last = i === milestones.length - 1;
                const idx = data.milestones.indexOf(m);
                return (
                  <div
                    key={m.id}
                    style={{
                      background: last ? "#141414" : CARD,
                      border: `1px solid ${last ? "#C9A227" : LINE}`,
                      borderRadius: 10,
                      padding: "11px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 800, color: last ? "#E3C35A" : GOLD, letterSpacing: 1, textTransform: "uppercase" }}>
                      {m.percent}% · {m.label}
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 800, color: last ? "#E3C35A" : INK }}>{formatINR(t.milestones[idx] ?? 0)}</div>
                    {m.note.trim() && <div style={{ fontSize: 10.5, color: last ? "#E8E4DA" : "#4A463F" }}>{m.note}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.showRenewal && data.renewalText.trim() && (
          <div
            style={{
              marginTop: 12,
              width: "100%",
              boxSizing: "border-box",
              border: "1px dashed #C9A227",
              borderRadius: 10,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "rgba(251,245,228,0.85)",
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: 1.6, textTransform: "uppercase", color: GOLD, fontWeight: 800, whiteSpace: "nowrap" }}>
              Renewal
            </div>
            <div style={{ fontSize: 11.5, color: BODY, lineHeight: 1.45 }}>{data.renewalText}</div>
          </div>
        )}

        {data.note.trim() && (
          <div style={{ marginTop: 10, width: "100%", fontSize: 11.5, color: BODY, lineHeight: 1.45, whiteSpace: "pre-line" }}>
            <span style={{ ...label, fontSize: 9.5, marginRight: 8 }}>Note</span>
            {data.note}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
            textAlign: "center",
          }}
        >
          <Contact title="Call" value={data.issuer.phone} />
          <Contact title="Special Email · Just 4 U" value={data.issuer.specialEmail} gold />
          <Contact title="Customer Support" value={data.issuer.supportEmail} />
          <Contact title="Websites" value={data.issuer.websites} />
        </div>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{ fontSize: 11, color: MUTED }}>issued by</div>
          <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>LAWFIC</div>
          <div style={{ fontSize: 10.5, color: MUTED, textAlign: "center", lineHeight: 1.5, whiteSpace: "pre-line" }}>{data.issuer.address}</div>
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 16,
            marginBottom: 40,
            fontSize: 12,
            letterSpacing: data.quoteRef.trim() ? 2 : 3.5,
            textTransform: "uppercase",
            color: "#6F6A5F",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {formatInvoiceDate(data.date)} &nbsp;|&nbsp; Invoice No: {data.number}
          {data.quoteRef.trim() && <> &nbsp;|&nbsp; Ref: {data.quoteRef}</>}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: strong ? 800 : 500, color: strong ? INK : undefined }}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
