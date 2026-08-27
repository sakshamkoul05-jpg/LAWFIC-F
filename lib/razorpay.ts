import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay, behind a config gate.
 *
 * Nothing here is reachable from the browser. The key secret and the webhook
 * secret are server-only by construction — no NEXT_PUBLIC_ prefix, and this
 * module is never imported into a client component. The key ID alone is public
 * (Checkout needs it in the page), which is why it is exposed through an API
 * response rather than by making the whole module client-safe.
 *
 * ORDERS rather than payment links, deliberately: a wallet top-up happens with
 * the user present and waiting for the balance to move. Checkout in the page is
 * the right shape for that. Payment links are for money owed later, elsewhere.
 *
 * With no keys set, `isRazorpayConfigured` is false, the top-up route returns a
 * clear "not configured" and the rest of the site is unaffected. That is the
 * live state until the merchant account clears KYC.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

export const isRazorpayConfigured = Boolean(KEY_ID && KEY_SECRET);
export const isRazorpayWebhookConfigured = Boolean(WEBHOOK_SECRET);
export const razorpayKeyId = KEY_ID;

/** Test keys are `rzp_test_…`. Worth surfacing so nobody demos live by accident. */
export const isRazorpayTestMode = KEY_ID.startsWith("rzp_test_");

const API = "https://api.razorpay.com/v1";

function authHeader(): string {
  return `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`;
}

export type RazorpayOrder = {
  id: string;
  amountPaise: number;
  currency: string;
};

/**
 * Creates an order for a wallet top-up.
 *
 * `receipt` carries our own payment_intent key so a payment can always be
 * traced back to the request that created it, and `notes.user_id` is what the
 * webhook reads to know whose wallet to credit. Neither is trusted on its own —
 * the webhook re-reads the intent from our database.
 */
export async function createTopUpOrder(opts: {
  userId: string;
  amountPaise: number;
  receipt: string;
}): Promise<{ ok: true; order: RazorpayOrder } | { ok: false; error: string }> {
  if (!isRazorpayConfigured) return { ok: false, error: "not_configured" };

  try {
    const res = await fetch(`${API}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: authHeader() },
      body: JSON.stringify({
        amount: opts.amountPaise,
        currency: "INR",
        receipt: opts.receipt,
        notes: { user_id: opts.userId, purpose: "wallet_topup" },
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[razorpay] order creation failed", res.status, body.slice(0, 400));
      return { ok: false, error: "razorpay_rejected" };
    }

    const json = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      ok: true,
      order: { id: json.id, amountPaise: json.amount, currency: json.currency },
    };
  } catch (e) {
    console.error("[razorpay] order creation threw", e);
    return { ok: false, error: "network" };
  }
}

/** Constant-time compare of two hex digests of the same length. */
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/**
 * Verifies a webhook. The RAW request body must be passed — parsing and
 * re-serialising changes the bytes and the signature will never match.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!isRazorpayWebhookConfigured || !signature) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

/**
 * Verifies the signature Checkout hands back to the browser.
 *
 * This is NOT what credits the wallet — the webhook is. It exists so the page
 * can tell "paid, waiting for the webhook" apart from "the user closed the
 * sheet", and show the right thing while polling.
 */
export function verifyCheckoutSignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!isRazorpayConfigured || !opts.signature) return false;
  const expected = createHmac("sha256", KEY_SECRET)
    .update(`${opts.orderId}|${opts.paymentId}`)
    .digest("hex");
  return safeEqualHex(expected, opts.signature);
}
