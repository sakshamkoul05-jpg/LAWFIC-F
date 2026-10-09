/**
 * Outbound WhatsApp, through Meta's WhatsApp Cloud API.
 *
 * TEMPLATES, NOT FREE TEXT
 *
 * A business may only start a WhatsApp conversation with a template Meta has
 * approved in advance. So this sends two named templates and nothing else:
 *
 *   WHATSAPP_TEMPLATE_REMINDER   body params: {{1}} filing, {{2}} period, {{3}} due date
 *   WHATSAPP_TEMPLATE_ORDER      body params: {{1}} order reference, {{2}} status
 *
 * Create both in WhatsApp Manager with exactly those placeholders, in the
 * "Utility" category, before switching this on.
 *
 * WHO GETS A MESSAGE
 *
 * Only a number the customer typed into a business profile and ticked "send me
 * WhatsApp reminders" for. Never the account's sign-in phone, never by default.
 * Unsolicited WhatsApp from a compliance company reads as a scam, and Meta
 * suspends numbers that get reported.
 *
 * With the env vars unset every call is a no-op that says why, so the rest of
 * the site never has to care whether WhatsApp is configured.
 */

const TOKEN = process.env.WHATSAPP_TOKEN ?? "";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const TPL_REMINDER = process.env.WHATSAPP_TEMPLATE_REMINDER ?? "";
const TPL_ORDER = process.env.WHATSAPP_TEMPLATE_ORDER ?? "";
const LANG = process.env.WHATSAPP_TEMPLATE_LANG ?? "en";

export const isWhatsAppConfigured = Boolean(TOKEN && PHONE_ID);

export type SendResult = { sent: true } | { sent: false; reason: string };

/** Indian mobile → E.164 digits. Ten digits get 91 in front. */
export function normaliseIndianMobile(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(d)) return `91${d}`;
  if (/^91[6-9]\d{9}$/.test(d)) return d;
  return null;
}

async function sendTemplate(to: string, template: string, params: string[]): Promise<SendResult> {
  if (!isWhatsAppConfigured) return { sent: false, reason: "WhatsApp is not configured" };
  if (!template) return { sent: false, reason: "No template name set" };
  const number = normaliseIndianMobile(to);
  if (!number) return { sent: false, reason: "Not a valid Indian mobile number" };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: number,
        type: "template",
        template: {
          name: template,
          language: { code: LANG },
          components: [
            { type: "body", parameters: params.map((text) => ({ type: "text", text: text.slice(0, 200) })) },
          ],
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[whatsapp] send failed", res.status, body.slice(0, 300));
      return { sent: false, reason: `Meta returned ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("[whatsapp] send error", err);
    return { sent: false, reason: "Network error" };
  }
}

export function sendReminder(to: string, filing: string, period: string, due: string) {
  return sendTemplate(to, TPL_REMINDER, [filing, period, due]);
}

export function sendOrderUpdate(to: string, reference: string, status: string) {
  return sendTemplate(to, TPL_ORDER, [reference, status]);
}
