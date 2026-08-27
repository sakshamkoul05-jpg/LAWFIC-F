/**
 * The webhook signature check is the only thing standing between an anonymous
 * POST and a wallet credit. It gets tested.
 *
 * The module reads its secrets at load time, and ESM `import` is hoisted above
 * everything else in the file — so the env has to be set first and the module
 * pulled in with a dynamic import, not a static one.
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

process.env.RAZORPAY_WEBHOOK_SECRET = "test-webhook-secret";
process.env.RAZORPAY_KEY_ID = "rzp_test_abc123";
process.env.RAZORPAY_KEY_SECRET = "test-key-secret";

const {
  isRazorpayConfigured,
  isRazorpayTestMode,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} = await import("./razorpay.ts");

const sign = (body: string, secret = "test-webhook-secret") =>
  createHmac("sha256", secret).update(body).digest("hex");

const BODY = JSON.stringify({
  event: "payment.captured",
  payload: { payment: { entity: { id: "pay_123", order_id: "order_123", amount: 200000 } } },
});

test("a correctly signed body is accepted", () => {
  assert.equal(verifyWebhookSignature(BODY, sign(BODY)), true);
});

test("a body signed with the wrong secret is rejected", () => {
  assert.equal(verifyWebhookSignature(BODY, sign(BODY, "not-the-secret")), false);
});

test("a tampered body is rejected", () => {
  const signature = sign(BODY);
  const tampered = BODY.replace('"amount":200000', '"amount":99999999');
  assert.equal(verifyWebhookSignature(tampered, signature), false);
});

test("an empty or missing signature is rejected", () => {
  assert.equal(verifyWebhookSignature(BODY, ""), false);
  assert.equal(verifyWebhookSignature(BODY, undefined as never), false);
});

test("a malformed signature is rejected rather than throwing", () => {
  for (const bad of ["zzzz", "not-hex-at-all", "abc", "0".repeat(63), "0".repeat(65)]) {
    assert.equal(verifyWebhookSignature(BODY, bad), false, `accepted ${bad}`);
  }
});

test("re-serialising the body breaks the signature — raw bytes matter", () => {
  const signature = sign(BODY);
  const spaced = JSON.stringify(JSON.parse(BODY)).replace(/":/g, '": ');
  assert.equal(verifyWebhookSignature(spaced, signature), false);
});

test("the checkout signature is order|payment under the key secret", () => {
  const good = createHmac("sha256", "test-key-secret")
    .update("order_123|pay_123")
    .digest("hex");

  assert.equal(
    verifyCheckoutSignature({ orderId: "order_123", paymentId: "pay_123", signature: good }),
    true
  );

  // Swapping the operands must not verify.
  const swapped = createHmac("sha256", "test-key-secret")
    .update("pay_123|order_123")
    .digest("hex");
  assert.equal(
    verifyCheckoutSignature({ orderId: "order_123", paymentId: "pay_123", signature: swapped }),
    false
  );
});

test("a test key is reported as test mode", () => {
  assert.equal(isRazorpayConfigured, true);
  assert.equal(isRazorpayTestMode, true);
});
