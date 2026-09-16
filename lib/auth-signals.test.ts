import assert from "node:assert/strict";
import { test } from "node:test";
import { isAlreadyConfirmed, signUpWasDeclinedAsDuplicate } from "./auth-signals.ts";

/**
 * These assertions exist because the absence of the first one cost a day.
 *
 * The sign-up form announced "we sent a code" for an address that already had
 * an account, no email was ever sent, and the failure was indistinguishable
 * from broken SMTP — so the hunt went through DNS records, email templates,
 * spam folders and the mail provider's dashboard before reaching the four
 * lines of code that were actually wrong.
 */

/* A real response from the live project, trimmed. Note the timestamp: it is
   set, and it is a lie. Nothing was sent. */
const DUPLICATE = {
  identities: [],
  confirmation_sent_at: "2026-09-16T20:59:36.198334194Z",
};

const GENUINELY_NEW = {
  identities: [{ id: "abc", provider: "email" }],
  confirmation_sent_at: "2026-09-16T20:25:28.467743624Z",
};

test("an empty identities array means the address already has an account", () => {
  assert.equal(signUpWasDeclinedAsDuplicate(DUPLICATE), true);
});

test("a new account has one identity and is not a duplicate", () => {
  assert.equal(signUpWasDeclinedAsDuplicate(GENUINELY_NEW), false);
});

test("confirmation_sent_at proves NOTHING on its own", () => {
  /* The whole trap in one assertion. Both responses carry the timestamp; only
     one of them sent an email. Any code that branches on this field is wrong. */
  assert.ok(DUPLICATE.confirmation_sent_at);
  assert.ok(GENUINELY_NEW.confirmation_sent_at);
  assert.notEqual(
    signUpWasDeclinedAsDuplicate(DUPLICATE),
    signUpWasDeclinedAsDuplicate(GENUINELY_NEW),
    "the two must be distinguishable, and not by the timestamp",
  );
});

test("an unrecognised shape is not treated as a duplicate", () => {
  /* Guessing "already exists" from a shape we do not understand would block a
     legitimate sign-up, which is worse than the bug this function fixes. */
  for (const odd of [null, {}, { identities: undefined }, { identities: "none" }]) {
    assert.equal(signUpWasDeclinedAsDuplicate(odd as never), false, JSON.stringify(odd));
  }
});

test("the resend error for a confirmed address is recognised", () => {
  for (const m of [
    "Email address already confirmed",
    "User already registered",
    "This email has already been confirmed",
  ]) {
    assert.equal(isAlreadyConfirmed(m), true, m);
  }
});

test("an unrelated resend error is not mistaken for it", () => {
  for (const m of ["Error sending email", "For security purposes, you can only request this after 42 seconds"]) {
    assert.equal(isAlreadyConfirmed(m), false, m);
  }
});
