/**
 * Cashfree, behind a config gate.
 *
 * Order creation and order lookup only. The WEBHOOK lives in the backend repo
 * as a Supabase Edge Function — it has no user session, is authenticated by an
 * HMAC rather than a cookie, and needs a public URL that exists before this app
 * is deployed. Nothing in this file verifies a webhook; if you find yourself
 * wanting that here, you are about to duplicate the one piece of code that must
 * not be duplicated.
 *
 * The client secret is server-only by construction — no NEXT_PUBLIC_ prefix,
 * and this module is never imported into a client component. Unlike Razorpay,
 * NOTHING here is safe to put in the browser: Cashfree's checkout takes a
 * `payment_session_id` minted per order, not a publishable key, so the browser
 * receives a token for one payment and never a credential.
 *
 * That is a real improvement and worth stating: a leaked Razorpay key id was
 * harmless but a leaked `payment_session_id` is harmless too AND expires. There
 * is no long-lived public value in this integration at all.
 *
 * With no keys set, `isCashfreeConfigured` is false, the top-up route returns a
 * clear "not configured" and the rest of the site is unaffected.
 */

const CLIENT_ID = process.env.CASHFREE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET ?? "";

export const isCashfreeConfigured = Boolean(CLIENT_ID && CLIENT_SECRET);

/**
 * Sandbox or production.
 *
 * ONLY the explicit variable decides, and anything else means sandbox.
 *
 * There used to be a fallback that inferred production from an app id not
 * prefixed TEST. It was removed because the premise is false — sandbox app ids
 * are sometimes plain digits — and because the direction of the guess was the
 * dangerous one: a deployment wrongly in sandbox refuses cards, a deployment
 * wrongly in production takes real money. Defaulting to sandbox is the safe
 * way to be wrong, and `credentialsMismatch` below catches the case the
 * inference was reaching for, using the key instead of a guess.
 */
export type CashfreeMode = "sandbox" | "production";

export const cashfreeMode: CashfreeMode =
  process.env.CASHFREE_MODE === "production" ? "production" : "sandbox";

export const isCashfreeTestMode = cashfreeMode === "sandbox";

/**
 * Which environment the SECRET itself belongs to, or null if it cannot tell.
 *
 * Cashfree's secrets are self-describing — `cfsk_ma_test_…` against
 * `cfsk_ma_prod_…` — and that marker is worth more than CASHFREE_MODE,
 * because it is what the API will actually check. The variable says what
 * somebody meant; the key says what it is.
 *
 * The app id is deliberately not used for this. Sandbox ids are sometimes
 * prefixed TEST and sometimes plain digits, so inferring from it produces
 * confident wrong answers.
 */
export function credentialEnvironmentOf(secret: string): CashfreeMode | null {
  if (/^cfsk_[a-z]+_test_/i.test(secret)) return "sandbox";
  if (/^cfsk_[a-z]+_prod_/i.test(secret)) return "production";
  return null;
}

/**
 * Do the key and the configured mode disagree? Every call will 401 if so.
 *
 * A null environment is NOT a mismatch. An unrecognised secret shape is not
 * evidence of disagreement — it is an absence of evidence — and failing over
 * one would block a perfectly good deployment whose key format Cashfree
 * changed.
 */
export function credentialsDisagree(secret: string, mode: CashfreeMode): boolean {
  const env = credentialEnvironmentOf(secret);
  return env !== null && env !== mode;
}

export const credentialEnvironment = credentialEnvironmentOf(CLIENT_SECRET);
export const credentialsMismatch = credentialsDisagree(CLIENT_SECRET, cashfreeMode);

const API =
  cashfreeMode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

/**
 * Cashfree pins behaviour to a dated API version rather than a path segment,
 * so this constant IS the contract. Changing it changes response shapes; it is
 * not a thing to bump casually, and it is the first place to look when a field
 * that used to be there is suddenly undefined.
 */
const API_VERSION = "2025-01-01";

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "content-type": "application/json",
    accept: "application/json",
    "x-api-version": API_VERSION,
    "x-client-id": CLIENT_ID,
    "x-client-secret": CLIENT_SECRET,
    ...extra,
  };
}

/**
 * Paise to the rupee amount Cashfree wants.
 *
 * Their API takes rupees with up to two decimals, and our entire ledger is
 * integer paise precisely so that no float ever touches a balance. This is the
 * one boundary where a float is unavoidable, so it is crossed in exactly one
 * place, with a fixed(2) to stop 199900/100 arriving as 1998.9999999999998.
 */
function toRupeeAmount(paise: number): number {
  return Number((paise / 100).toFixed(2));
}

export type CashfreeOrder = {
  /** Our own id, which is also the primary key of payment_intents. */
  orderId: string;
  /** The single-use token the browser needs to open checkout. */
  paymentSessionId: string;
  amountPaise: number;
};

export type CreateOrderInput = {
  orderId: string;
  userId: string;
  amountPaise: number;
  /** REQUIRED by Cashfree. Ten digits, no country code. */
  customerPhone: string;
  customerEmail?: string;
  customerName?: string;
  /** Where the browser lands after a redirect-based method (UPI apps, 3DS). */
  returnUrl: string;
  /** Where Cashfree POSTs the result. The Edge Function, not this app. */
  notifyUrl?: string;
};

/**
 * Creates an order for a wallet top-up.
 *
 * `order_id` is OURS and is generated by the caller, not by Cashfree. That is
 * deliberate: it is the primary key of payment_intents, so the row can be
 * written with the same id we sent, and the webhook can look the payment up by
 * it. Letting the gateway name the order would mean a round trip before we
 * could record anything.
 *
 * `customer_id` is the Supabase user id so Cashfree's own dashboard groups a
 * customer's payments the way our database does.
 */
export async function createTopUpOrder(
  input: CreateOrderInput,
): Promise<{ ok: true; order: CashfreeOrder } | { ok: false; error: string }> {
  if (!isCashfreeConfigured) return { ok: false, error: "not_configured" };

  try {
    const res = await fetch(`${API}/orders`, {
      method: "POST",
      headers: headers({
        /* Same key, same order: a retry after a timeout returns the original
           order instead of opening a second one. Without it, a flaky network
           can leave a customer looking at two payment windows for one top-up. */
        "x-idempotency-key": input.orderId,
      }),
      body: JSON.stringify({
        order_id: input.orderId,
        order_amount: toRupeeAmount(input.amountPaise),
        order_currency: "INR",
        customer_details: {
          customer_id: input.userId,
          customer_phone: input.customerPhone,
          ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
          ...(input.customerName ? { customer_name: input.customerName } : {}),
        },
        order_meta: {
          return_url: input.returnUrl,
          ...(input.notifyUrl ? { notify_url: input.notifyUrl } : {}),
        },
        order_note: "LAWFIC wallet top-up",
        /* Echoed back on the webhook. Useful in their dashboard and USELESS as
           a source of truth — the webhook reads the user from our own
           payment_intents row, never from here. See the note in the Edge
           Function about why that distinction matters. */
        order_tags: { purpose: "wallet_topup" },
      }),
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      /* Cashfree's errors are readable and worth keeping — `order_id already
         exists`, `customer_phone is invalid` and an inactive merchant account
         all look identical from the outside otherwise. Truncated because a
         body can be long, and never surfaced to the browser. */
      console.error("[cashfree] order creation failed", res.status, text.slice(0, 400));

      /* A 401 has one overwhelmingly likely cause and the raw body does not
         name it: "authentication Failed" is what the sandbox says when handed
         a production key, and vice versa. Saying so here turns a mystifying
         log line into an instruction. */
      if (res.status === 401 && credentialsMismatch) {
        console.error(
          `[cashfree] the key is ${credentialEnvironment?.toUpperCase()} but CASHFREE_MODE resolves to ${cashfreeMode.toUpperCase()} — ` +
            "the two must match. Use the key pair for the environment you mean to call.",
        );
      }

      return { ok: false, error: "cashfree_rejected" };
    }

    const json = JSON.parse(text) as {
      order_id?: string;
      payment_session_id?: string;
      order_amount?: number;
    };

    if (!json.payment_session_id) {
      /* A 200 with no session id is not something to paper over: the browser
         has nothing to open and the customer would sit looking at a spinner. */
      console.error("[cashfree] order created without a payment_session_id", text.slice(0, 400));
      return { ok: false, error: "no_session" };
    }

    return {
      ok: true,
      order: {
        orderId: json.order_id ?? input.orderId,
        paymentSessionId: json.payment_session_id,
        amountPaise: input.amountPaise,
      },
    };
  } catch (e) {
    console.error("[cashfree] order creation threw", e);
    return { ok: false, error: "network" };
  }
}

export type OrderStatus = "PAID" | "ACTIVE" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";

/**
 * Ask Cashfree what actually happened to an order.
 *
 * Used by the page the customer lands on after a redirect, and ONLY to decide
 * what to tell them. It does not credit anything — the webhook does that, and
 * it is the only thing that may. The two exist for different reasons: this one
 * answers "what do I say to the person looking at the screen", the webhook
 * answers "did money arrive".
 *
 * Keeping them separate is what stops a customer who reloads the return page
 * from crediting themselves twice, and what stops a customer who closes the
 * browser from never being credited at all.
 */
export async function fetchOrderStatus(
  orderId: string,
): Promise<{ ok: true; status: OrderStatus } | { ok: false; error: string }> {
  if (!isCashfreeConfigured) return { ok: false, error: "not_configured" };

  try {
    const res = await fetch(`${API}/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: headers(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[cashfree] order lookup failed", res.status, orderId);
      return { ok: false, error: "lookup_failed" };
    }

    const json = (await res.json()) as { order_status?: string };
    return { ok: true, status: (json.order_status ?? "ACTIVE") as OrderStatus };
  } catch (e) {
    console.error("[cashfree] order lookup threw", e);
    return { ok: false, error: "network" };
  }
}

export type CashfreePayment = {
  cfPaymentId: string;
  status: string;
  amountPaise: number;
};

/**
 * The payments made against an order.
 *
 * Needed for reconciliation, and specifically for `cf_payment_id` — which is
 * half of the idempotency key the webhook uses. Reconciling with a DIFFERENT
 * key would let a late webhook credit the same payment a second time, so the
 * two paths must agree on the key, and that means asking Cashfree which
 * payment actually succeeded rather than inventing an identifier.
 */
export async function fetchOrderPayments(
  orderId: string,
): Promise<{ ok: true; payments: CashfreePayment[] } | { ok: false; error: string }> {
  if (!isCashfreeConfigured) return { ok: false, error: "not_configured" };

  try {
    const res = await fetch(`${API}/orders/${encodeURIComponent(orderId)}/payments`, {
      method: "GET",
      headers: headers(),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[cashfree] payments lookup failed", res.status, orderId);
      return { ok: false, error: "lookup_failed" };
    }
    const json = (await res.json()) as unknown;
    const list = Array.isArray(json) ? json : [];
    return {
      ok: true,
      payments: list.map((p) => {
        const row = p as { cf_payment_id?: unknown; payment_status?: unknown; payment_amount?: unknown };
        return {
          /* Number in some API versions, string in others. Normalised, because
             it becomes half of an idempotency key and a type flip would stop
             it deduplicating silently. */
          cfPaymentId: String(row.cf_payment_id ?? ""),
          status: String(row.payment_status ?? ""),
          amountPaise: Math.round(Number(row.payment_amount ?? 0) * 100),
        };
      }),
    };
  } catch (e) {
    console.error("[cashfree] payments lookup threw", e);
    return { ok: false, error: "network" };
  }
}

/**
 * The id we give an order.
 *
 * Cashfree allows alphanumerics, underscore and hyphen, 3–45 characters. The
 * user id prefix makes a payment traceable at a glance in their dashboard, and
 * the timestamp plus random suffix is what keeps two top-ups started in the
 * same millisecond from colliding on a primary key.
 */
export function newTopUpOrderId(userId: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `topup_${userId.slice(0, 8)}_${Date.now()}_${rand}`;
}
