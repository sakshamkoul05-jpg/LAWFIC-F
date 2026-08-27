/**
 * Order creation only.
 *
 * The webhook signature tests are NOT here — they live with the webhook, in
 * the backend repo's `tests/signature.test.mjs`, next to the code they cover.
 * Duplicating them here would mean two verifiers that can drift apart, and the
 * one that matters is the one Razorpay actually talks to.
 *
 * The module reads its keys at load time, and ESM `import` is hoisted above
 * everything else in the file — so the env has to be set first and the module
 * pulled in with a dynamic import.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

process.env.RAZORPAY_KEY_ID = "rzp_test_abc123";
process.env.RAZORPAY_KEY_SECRET = "test-key-secret";

const { isRazorpayConfigured, isRazorpayTestMode, razorpayKeyId } =
  await import("./razorpay.ts");

test("keys present means configured", () => {
  assert.equal(isRazorpayConfigured, true);
});

test("a test key is reported as test mode, so nobody demos live by accident", () => {
  assert.equal(isRazorpayTestMode, true);
});

test("the key id is exposed but the secret is not", async () => {
  const mod = await import("./razorpay.ts");
  assert.equal(razorpayKeyId, "rzp_test_abc123");
  assert.equal("razorpayKeySecret" in mod, false);
  assert.equal(Object.keys(mod).some((k) => /secret/i.test(k)), false);
});

test("no webhook verifier is exported from the frontend", async () => {
  const mod = await import("./razorpay.ts");
  for (const gone of ["verifyWebhookSignature", "isRazorpayWebhookConfigured", "verifyCheckoutSignature"]) {
    assert.equal(gone in mod, false, `${gone} is still exported — it belongs in the backend repo`);
  }
});
