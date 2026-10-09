/**
 * The calendar as an iCalendar (.ics) feed, for Google, Apple and Outlook.
 *
 * All-day events, because a due date is a day, not a moment. Each carries two
 * alarms (seven days and one day before) so the phone reminds the customer
 * even if they never open LAWFIC again. UIDs are derived from the obligation
 * key, so re-subscribing or re-importing updates events instead of
 * duplicating them.
 */

import type { ComplianceEvent } from "./calendar.ts";

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Lines over 75 octets must be folded (RFC 5545 §3.1). */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

const compact = (d: string) => d.replace(/-/g, "");

function nextDay(d: string): string {
  const [y, m, day] = d.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, day + 1));
  return `${t.getUTCFullYear()}${String(t.getUTCMonth() + 1).padStart(2, "0")}${String(t.getUTCDate()).padStart(2, "0")}`;
}

export function toIcs(events: ComplianceEvent[], opts: { name: string; siteUrl: string; stamp?: Date }): string {
  const stamp = (opts.stamp ?? new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LAWFIC//Compliance Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(opts.name)}`,
    "X-WR-TIMEZONE:Asia/Kolkata",
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
  ];
  for (const e of events) {
    const desc = [e.what, e.caveat, `Authority: ${e.authority}`, `${opts.siteUrl}/tools/compliance-calendar`]
      .filter(Boolean)
      .join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.key.replace(/[^A-Za-z0-9-]/g, "-")}@lawfic`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(e.due)}`,
      `DTEND;VALUE=DATE:${nextDay(e.due)}`,
      `SUMMARY:${esc(`${e.title} — ${e.period}`)}`,
      `DESCRIPTION:${esc(desc)}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(`${e.title} is due in 7 days`)}`,
      "TRIGGER:-P7D",
      "END:VALARM",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(`${e.title} is due tomorrow`)}`,
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
