/**
 * Order creation only.
 *
 * The webhook signature tests are NOT here — they live with the webhook, in
 * the backend repo's `tests/signature.test.mjs`, next to the code they cover.
 * Duplicating them here would mean two verifiers that can drift apart, and the
 * one that matters is the one Cashfree actually talks to.
 *
 * The module reads its keys at load time, and ESM `import` is hoisted above
 * everything else in the file — so the env has to be set first and the module
 * pulled in with a dynamic import.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

process.env.CASHFREE_CLIENT_ID = "TEST1234567890abcdef";
process.env.CASHFREE_CLIENT_SECRET = "cfsk_ma_test_secret";

const mod = await import("./cashfree.ts");
const { isCashfreeConfigured, isCashfreeTestMode, cashfreeMode, newTopUpOrderId } = mod;

test("keys present means configured", () => {
  assert.equal(isCashfreeConfigured, true);
});

test("a TEST app id is reported as sandbox, so nobody demos live by accident", () => {
  assert.equal(cashfreeMode, "sandbox");
  assert.equal(isCashfreeTestMode, true);
});

test("NOTHING resembling a credential is exported", async () => {
  /* Cashfree has no publishable key. Razorpay's key id was safe in the
     browser; here the browser gets a per-order payment_session_id and nothing
     else, so an exported secret or client id would be a straight leak with no
     legitimate use to weigh it against. */
  for (const key of Object.keys(mod)) {
    assert.ok(
      !/secret|clientId|client_id|apiKey/i.test(key),
      `${key} is exported from a module the API route returns data from`,
    );
  }
});

test("no webhook verifier is exported from the frontend", () => {
  for (const gone of [
    "verifyCashfreeSignature",
    "verifyWebhookSignature",
    "freshEnough",
    "signCashfree",
  ]) {
    assert.equal(gone in mod, false, `${gone} is still exported — it belongs in the backend repo`);
  }
});

/* ------------------------------------------------------------ order ids -- */

test("an order id fits Cashfree's rules", () => {
  /* Their constraint, verbatim: alphanumerics, underscore and hyphen, 3 to 45
     characters. A violation is a 400 at the moment a customer presses pay, so
     it is worth asserting rather than discovering. */
  const id = newTopUpOrderId("0f8fad5b-d9cb-469f-a165-70867728950e");
  assert.match(id, /^[A-Za-z0-9_-]+$/, id);
  assert.ok(id.length >= 3 && id.length <= 45, `${id} is ${id.length} characters`);
});

test("two order ids made in the same millisecond do not collide", () => {
  /* order_id is the primary key of payment_intents. A collision is not a
     cosmetic problem: the second insert fails and a customer who double-clicks
     gets an error instead of a payment window. */
  const ids = new Set<string>();
  for (let i = 0; i < 500; i++) ids.add(newTopUpOrderId("0f8fad5b-d9cb-469f"));
  assert.equal(ids.size, 500);
});

test("the order id carries the user prefix, for tracing in their dashboard", () => {
  assert.ok(newTopUpOrderId("abcd1234-ffff").startsWith("topup_abcd1234_"));
});

/* -------------------------------------------------------------- amounts -- */

test("paise convert to rupees without floating point dust", async () => {
  /* Not exported, so it is exercised through the request Cashfree would
     receive. 199900 paise / 100 is 1998.9999999999998 as a raw double, and
     sending that as order_amount is a 400 — "provide upto two decimals". */
  const seen: { amount?: number } = {};
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}"));
    seen.amount = body.order_amount;
    return new Response(
      JSON.stringify({ order_id: body.order_id, payment_session_id: "session_x" }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const res = await mod.createTopUpOrder({
      orderId: "topup_test_1",
      userId: "u1",
      amountPaise: 199900,
      customerPhone: "9876543210",
      returnUrl: "https://lawfic.pro/wallet/topup/return",
    });
    assert.equal(res.ok, true);
    assert.equal(seen.amount, 1999);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("a 200 with no payment_session_id is treated as a failure", async () => {
  /* The browser would have nothing to open. Better a clear error than a
     spinner that never resolves. */
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ order_id: "topup_test_2" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;

  try {
    const res = await mod.createTopUpOrder({
      orderId: "topup_test_2",
      userId: "u1",
      amountPaise: 10000,
      customerPhone: "9876543210",
      returnUrl: "https://lawfic.pro/wallet/topup/return",
    });
    assert.equal(res.ok, false);
    if (!res.ok) assert.equal(res.error, "no_session");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("the phone Cashfree requires is actually sent", async () => {
  const seen: { phone?: string } = {};
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    seen.phone = JSON.parse(String(init?.body ?? "{}")).customer_details?.customer_phone;
    return new Response(JSON.stringify({ payment_session_id: "s" }), { status: 200 });
  }) as typeof fetch;

  try {
    await mod.createTopUpOrder({
      orderId: "topup_test_3",
      userId: "u1",
      amountPaise: 10000,
      customerPhone: "9876543210",
      returnUrl: "https://lawfic.pro/wallet/topup/return",
    });
    assert.equal(seen.phone, "9876543210");
  } finally {
    globalThis.fetch = realFetch;
  }
});
