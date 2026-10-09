import { NextResponse } from "next/server";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { buildCalendar, daysBetween, formatDue, profileFromBusiness, todayIST } from "@/lib/compliance/calendar";
import { isWhatsAppConfigured, sendReminder } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The daily reminder run. Vercel Cron calls it once a morning (vercel.json)
 * with `Authorization: Bearer $CRON_SECRET`; anything else is refused.
 *
 * For every business that opted in, it builds the calendar, finds what is due
 * in exactly 7, 3 or 1 days and not yet marked filed, and sends one WhatsApp
 * template per item. `compliance_reminders_sent` makes it idempotent: a second
 * run the same day — a retry, a manual trigger — sends nothing new.
 *
 * It reads across customers, which RLS rightly forbids any session from
 * doing, so this is a service-role caller. The rule in lib/supabase/admin.ts
 * holds: the caller is verified (the cron secret) before the key is touched,
 * and the only write is the "sent" ledger whose rows this code decides.
 */

const LEADS = [7, 3, 1];
const MAX_PER_RUN = 2000;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (!isServiceRoleConfigured) return NextResponse.json({ skipped: "Service role not configured" });
  if (!isWhatsAppConfigured) return NextResponse.json({ skipped: "WhatsApp not configured" });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ skipped: "Service role not configured" });
  const today = todayIST();

  const { data: businesses, error } = await admin
    .from("businesses")
    .select("id,name,entity_type,state,gst_scheme,has_employees,deducts_tds,tax_audit,whatsapp_number")
    .eq("whatsapp_opt_in", true)
    .neq("whatsapp_number", "");
  if (error) return NextResponse.json({ error: "Could not read businesses" }, { status: 500 });

  let sent = 0;
  let failed = 0;

  for (const b of businesses ?? []) {
    if (sent >= MAX_PER_RUN) break;
    const events = buildCalendar(profileFromBusiness(b), today, { back: 0, ahead: 8 }).filter((e) =>
      LEADS.includes(daysBetween(today, e.due)),
    );
    if (events.length === 0) continue;

    const keys = events.map((e) => e.key);
    const [{ data: filed }, { data: already }] = await Promise.all([
      admin.from("compliance_filings").select("item_key").eq("business_id", b.id).in("item_key", keys),
      admin.from("compliance_reminders_sent").select("item_key,days_before").eq("business_id", b.id).in("item_key", keys),
    ]);
    const filedSet = new Set((filed ?? []).map((f) => f.item_key));
    const sentSet = new Set((already ?? []).map((r) => `${r.item_key}|${r.days_before}`));

    for (const e of events) {
      const lead = daysBetween(today, e.due);
      if (filedSet.has(e.key) || sentSet.has(`${e.key}|${lead}`)) continue;
      /* Claim the slot first. If two runs overlap, the primary key lets only
         one of them insert, and only that one sends. */
      const { error: claimErr } = await admin
        .from("compliance_reminders_sent")
        .insert({ business_id: b.id, item_key: e.key, days_before: lead, channel: "whatsapp" });
      if (claimErr) continue;

      const r = await sendReminder(b.whatsapp_number, `${e.title} (${b.name})`, e.period, formatDue(e.due));
      if (r.sent) sent++;
      else {
        failed++;
        await admin
          .from("compliance_reminders_sent")
          .delete()
          .match({ business_id: b.id, item_key: e.key, days_before: lead, channel: "whatsapp" });
      }
    }
  }

  return NextResponse.json({ today, sent, failed });
}
