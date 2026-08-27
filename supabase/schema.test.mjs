/**
 * Applies the real supabase/setup.sql to an in-process Postgres (PGlite, PG16)
 * and attacks the parts that would cost real money if they were wrong: the
 * balance trigger, the overdraft guard, append-only enforcement, idempotency,
 * and the order-payment function.
 *
 * PGlite is not Supabase. There is no GoTrue and no PostgREST, and everything
 * runs as superuser — which BYPASSES ROW SECURITY. So this proves the SCHEMA
 * applies and the CONSTRAINTS bite. It does NOT prove the RLS policies grant
 * the right things to the right roles; that needs a live project, and there is
 * a manual checklist for it in supabase/README.md.
 *
 *   npm run test:db
 */
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";

const SQL = readFileSync(new URL("./setup.sql", import.meta.url), "utf8");
const db = await PGlite.create({ extensions: { pgcrypto } });

let pass = 0,
  fail = 0;
const ok = (n) => {
  console.log(`  PASS  ${n}`);
  pass++;
};
const no = (n, e) => {
  console.log(`  FAIL  ${n}\n        ${e}`);
  fail++;
};

async function check(name, fn) {
  try {
    await fn();
    ok(name);
  } catch (e) {
    no(name, e.message);
  }
}

/** Assert a statement is rejected, optionally with a specific SQLSTATE. */
async function rejects(name, sql, params, code) {
  try {
    await db.query(sql, params);
    no(name, "expected a rejection, but it was accepted");
  } catch (e) {
    if (code && e.code !== code) no(name, `expected SQLSTATE ${code}, got ${e.code}: ${e.message}`);
    else ok(`${name}${code ? ` (${code})` : ""}`);
  }
}

const one = async (sql, params) => (await db.query(sql, params)).rows[0];
const eq = (actual, expected, what) => {
  if (String(actual) !== String(expected)) {
    throw new Error(`${what}: expected ${expected}, got ${actual}`);
  }
};

/** Impersonate a signed-in user, the way auth.uid() reads it. */
const asUser = (id) => db.exec(`set request.jwt.claim.sub = '${id}';`);
const asNobody = () => db.exec(`set request.jwt.claim.sub = '';`);

// --- Supabase-provided objects that setup.sql assumes already exist ---------
console.log("\nStubbing the Supabase environment (roles, auth schema)...");
await db.exec(`
  create role anon login;
  create role authenticated;
  create role service_role;
  create schema if not exists auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    phone text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $$;
`);
console.log("  done");

// --------------------------------------------------------------- schema ----
console.log("\nApplying setup.sql...");
await check("setup.sql applies cleanly", async () => {
  await db.exec(SQL);
});
if (fail > 0) {
  console.log("\nSchema did not apply — nothing else can be tested.\n");
  process.exit(1);
}

// Two users to work with.
const alice = (await one(`insert into auth.users (email) values ('a@example.com') returning id`)).id;
const bob = (await one(`insert into auth.users (email) values ('b@example.com') returning id`)).id;

console.log("\nProfiles");
await check("a profile is created automatically for a new user", async () => {
  const r = await one(`select count(*)::int as n from public.profiles where id = $1`, [alice]);
  eq(r.n, 1, "profile rows");
});

console.log("\nServices");
await check("the four live services are seeded", async () => {
  const r = await one(`select count(*)::int as n from public.services where is_active`);
  eq(r.n, 4, "active services");
});
await check("government and professional fees are stored separately", async () => {
  const r = await one(
    `select government_fee_paise as g, professional_fee_paise as p
       from public.services where slug = 'pan'`
  );
  eq(r.g, 10700, "government fee");
  eq(r.p, 29900, "professional fee");
});

console.log("\nWallet ledger — the balance");
const credit = (user, amount, key) =>
  db.query(
    `insert into public.wallet_entries (user_id, direction, amount_paise, reason, idempotency_key)
     values ($1, 'credit', $2, 'test top-up', $3)`,
    [user, amount, key]
  );
const debit = (user, amount, key) =>
  db.query(
    `insert into public.wallet_entries (user_id, direction, amount_paise, reason, idempotency_key)
     values ($1, 'debit', $2, 'test spend', $3)`,
    [user, amount, key]
  );
const balance = async (user) =>
  (
    await one(
      `select coalesce((select balance_after_paise from public.wallet_entries
                         where user_id = $1 order by seq desc limit 1), 0) as b`,
      [user]
    )
  ).b;

await check("a credit sets the running balance", async () => {
  await credit(alice, 200000, "k1");
  eq(await balance(alice), 200000, "balance after first credit");
});

await check("credits accumulate", async () => {
  await credit(alice, 50000, "k2");
  eq(await balance(alice), 250000, "balance after second credit");
});

await check("a debit reduces the balance", async () => {
  await debit(alice, 149900, "k3");
  eq(await balance(alice), 100100, "balance after debit");
});

await check("balances are per user, not global", async () => {
  await credit(bob, 1000, "k4");
  eq(await balance(bob), 1000, "bob's balance");
  eq(await balance(alice), 100100, "alice's balance is untouched");
});

await check("the wallet_balances view agrees with the newest entry", async () => {
  const r = await one(`select balance_paise from public.wallet_balances where user_id = $1`, [alice]);
  eq(r.balance_paise, 100100, "view balance");
});

console.log("\nWallet ledger — what must be refused");
await rejects(
  "a debit larger than the balance is refused",
  `insert into public.wallet_entries (user_id, direction, amount_paise, reason, idempotency_key)
   values ($1, 'debit', 999999999, 'overdraft attempt', 'k-over')`,
  [alice],
  "23514"
);

await check("the refused overdraft left no trace", async () => {
  eq(await balance(alice), 100100, "balance after refused overdraft");
});

await rejects(
  "a replayed idempotency key is refused",
  `insert into public.wallet_entries (user_id, direction, amount_paise, reason, idempotency_key)
   values ($1, 'credit', 500000, 'replayed webhook', 'k1')`,
  [alice],
  "23505"
);

await rejects(
  "a zero-amount entry is refused",
  `insert into public.wallet_entries (user_id, direction, amount_paise, reason, idempotency_key)
   values ($1, 'credit', 0, 'nothing', 'k-zero')`,
  [alice],
  "23514"
);

await rejects(
  "a negative-amount entry is refused",
  `insert into public.wallet_entries (user_id, direction, amount_paise, reason, idempotency_key)
   values ($1, 'credit', -100, 'negative', 'k-neg')`,
  [alice],
  "23514"
);

await rejects(
  "an unknown direction is refused",
  `insert into public.wallet_entries (user_id, direction, amount_paise, reason, idempotency_key)
   values ($1, 'sideways', 100, 'bad direction', 'k-dir')`,
  [alice],
  "23514"
);

console.log("\nWallet ledger — append-only");
await rejects(
  "an UPDATE to a ledger entry is refused",
  `update public.wallet_entries set amount_paise = 1 where user_id = $1`,
  [alice],
  "23514"
);

await rejects(
  "a DELETE of a ledger entry is refused",
  `delete from public.wallet_entries where user_id = $1`,
  [alice],
  "23514"
);

await check("balance_after_paise cannot be forged on insert", async () => {
  await db.query(
    `insert into public.wallet_entries
       (user_id, direction, amount_paise, reason, idempotency_key, balance_after_paise)
     values ($1, 'credit', 100, 'forged balance', 'k-forge', 99999999)`,
    [bob]
  );
  // The trigger overwrites whatever was supplied.
  eq(await balance(bob), 1100, "balance ignores the supplied value");
});

console.log("\nService orders");
let orderId;
await check("an order gets a human-readable reference", async () => {
  const r = await one(
    `insert into public.service_orders (user_id, service_slug, details)
     values ($1, 'gst', 'need a GSTIN') returning id, reference, status`,
    [alice]
  );
  orderId = r.id;
  if (!/^ORD-\d{2}-\d{4}$/.test(r.reference)) throw new Error(`bad reference: ${r.reference}`);
  eq(r.status, "submitted", "initial status");
});

await check("a user cannot self-quote or self-advance an order", async () => {
  const r = await one(
    `insert into public.service_orders
       (user_id, service_slug, status, government_fee_paise, professional_fee_paise, admin_notes)
     values ($1, 'pan', 'paid', 0, 0, 'I approve myself')
     returning status, government_fee_paise as g, professional_fee_paise as p, admin_notes as n`,
    [alice]
  );
  eq(r.status, "submitted", "status is forced back");
  eq(r.g, null, "government fee is stripped");
  eq(r.p, null, "professional fee is stripped");
  eq(r.n, null, "admin notes are stripped");
});

console.log("\npay_order_from_wallet");
await asUser(alice);

await rejects(
  "paying an order that has not been quoted is refused",
  `select public.pay_order_from_wallet($1)`,
  [orderId],
  "22023"
);

// Give Alice enough to cover what follows. (Without this the overdraft guard
// refuses the payment — which is correct, and is proven separately below.)
await credit(alice, 300000, "k-topup");

// Staff quote it: ₹1,499 professional, ₹0 government.
await db.query(
  `update public.service_orders
      set status = 'quoted', government_fee_paise = 0,
          professional_fee_paise = 149900, quoted_at = now()
    where id = $1`,
  [orderId]
);

await check("paying a quoted order debits the wallet and marks it paid", async () => {
  const before = await balance(alice);
  await db.query(`select public.pay_order_from_wallet($1)`, [orderId]);
  const after = await balance(alice);
  eq(before - after, 149900, "amount debited");
  const o = await one(`select status from public.service_orders where id = $1`, [orderId]);
  eq(o.status, "paid", "order status");
});

await check("the debit is attributed to the order", async () => {
  const r = await one(
    `select count(*)::int as n from public.wallet_entries
      where order_id = $1 and direction = 'debit'`,
    [orderId]
  );
  eq(r.n, 1, "debit entries for the order");
});

await rejects(
  "paying the same order twice is refused",
  `select public.pay_order_from_wallet($1)`,
  [orderId],
  "22023"
);

await check("a government fee is debited as its own separate entry", async () => {
  const o = await one(
    `insert into public.service_orders (user_id, service_slug) values ($1, 'pan')
     returning id`,
    [alice]
  );
  await db.query(
    `update public.service_orders
        set status='quoted', government_fee_paise=10700,
            professional_fee_paise=29900, quoted_at=now()
      where id=$1`,
    [o.id]
  );
  await db.query(`select public.pay_order_from_wallet($1)`, [o.id]);
  const r = await one(
    `select count(*)::int as n, sum(amount_paise)::bigint as total
       from public.wallet_entries where order_id = $1`,
    [o.id]
  );
  eq(r.n, 2, "two separate debit entries");
  eq(r.total, 40600, "total debited");
});

await check("another user cannot pay someone else's order", async () => {
  const o = await one(
    `insert into public.service_orders (user_id, service_slug) values ($1, 'gst') returning id`,
    [alice]
  );
  await db.query(
    `update public.service_orders set status='quoted', government_fee_paise=0,
            professional_fee_paise=100, quoted_at=now() where id=$1`,
    [o.id]
  );
  await asUser(bob);
  try {
    await db.query(`select public.pay_order_from_wallet($1)`, [o.id]);
    throw new Error("bob was allowed to pay alice's order");
  } catch (e) {
    if (e.code !== "42501") throw new Error(`expected 42501, got ${e.code}: ${e.message}`);
  } finally {
    await asUser(alice);
  }
});

await check("an order costing more than the balance cannot be paid", async () => {
  const o = await one(
    `insert into public.service_orders (user_id, service_slug) values ($1, 'gst') returning id`,
    [bob]
  );
  await db.query(
    `update public.service_orders set status='quoted', government_fee_paise=0,
            professional_fee_paise=99999999, quoted_at=now() where id=$1`,
    [o.id]
  );
  await asUser(bob);
  const before = await balance(bob);
  try {
    await db.query(`select public.pay_order_from_wallet($1)`, [o.id]);
    throw new Error("an unaffordable order was paid");
  } catch (e) {
    if (e.code !== "23514") throw new Error(`expected 23514, got ${e.code}: ${e.message}`);
  }
  eq(await balance(bob), before, "balance unchanged after the failed payment");
  const s = await one(`select status from public.service_orders where id = $1`, [o.id]);
  eq(s.status, "quoted", "order is still awaiting payment");
});

await check("my_wallet_balance returns 0 for a user with no entries", async () => {
  const carol = (await one(`insert into auth.users (email) values ('c@e.com') returning id`)).id;
  await asUser(carol);
  const r = await one(`select public.my_wallet_balance() as b`);
  eq(r.b, 0, "balance for a fresh user");
});

await check("an anonymous caller cannot spend", async () => {
  await asNobody();
  try {
    await db.query(`select public.pay_order_from_wallet($1)`, [orderId]);
    throw new Error("an anonymous caller was allowed through");
  } catch (e) {
    if (e.code !== "42501") throw new Error(`expected 42501, got ${e.code}: ${e.message}`);
  }
});

console.log("\nPayment intents");
await check("an intent cannot be created for a non-positive amount", async () => {
  try {
    await db.query(
      `insert into public.payment_intents (razorpay_order_id, user_id, amount_paise)
       values ('order_zero', $1, 0)`,
      [alice]
    );
    throw new Error("a zero-amount intent was accepted");
  } catch (e) {
    if (e.code !== "23514") throw new Error(`expected 23514, got ${e.code}: ${e.message}`);
  }
});

console.log("\nStaff — quoting, advancing, rejecting");

// Bob becomes staff. Alice stays an ordinary customer.
await db.query(`insert into public.staff (user_id, role) values ($1, 'owner')`, [bob]);

/** A fresh submitted order belonging to Alice. */
const newOrder = async (slug = "gst") =>
  (
    await one(
      `insert into public.service_orders (user_id, service_slug) values ($1, $2) returning id`,
      [alice, slug]
    )
  ).id;

await check("a customer cannot quote an order", async () => {
  const o = await newOrder();
  await asUser(alice);
  try {
    await db.query(`select public.quote_order($1, 0, 100000, null)`, [o]);
    throw new Error("a customer was allowed to quote");
  } catch (e) {
    if (e.code !== "42501") throw new Error(`expected 42501, got ${e.code}: ${e.message}`);
  }
});

await check("a customer cannot advance or reject an order", async () => {
  const o = await newOrder();
  await asUser(alice);
  for (const sql of [
    `select public.advance_order($1, 'in_progress')`,
    `select public.reject_order($1, 'because')`,
  ]) {
    try {
      await db.query(sql, [o]);
      throw new Error(`a customer was allowed: ${sql}`);
    } catch (e) {
      if (e.code !== "42501") throw new Error(`expected 42501, got ${e.code}: ${e.message}`);
    }
  }
});

await check("staff can quote a submitted order", async () => {
  const o = await newOrder();
  await asUser(bob);
  const r = await one(`select * from public.quote_order($1, 10700, 29900, 'checked') as q`, [o]);
  eq(r.status, "quoted", "status after quoting");
  eq(r.government_fee_paise, 10700, "government fee");
  eq(r.professional_fee_paise, 29900, "professional fee");
});

await rejects(
  "a quote of zero is refused",
  `select public.quote_order((select id from public.service_orders
                               where status='submitted' limit 1), 0, 0, null)`,
  [],
  "22023"
);

await check("a negative fee is refused", async () => {
  const o = await newOrder();
  await asUser(bob);
  try {
    await db.query(`select public.quote_order($1, -1, 100, null)`, [o]);
    throw new Error("a negative fee was accepted");
  } catch (e) {
    if (e.code !== "22023") throw new Error(`expected 22023, got ${e.code}: ${e.message}`);
  }
});

await check("an order cannot be quoted twice", async () => {
  const o = await newOrder();
  await asUser(bob);
  await db.query(`select public.quote_order($1, 0, 5000, null)`, [o]);
  try {
    await db.query(`select public.quote_order($1, 0, 9999, null)`, [o]);
    throw new Error("a second quote was accepted");
  } catch (e) {
    if (e.code !== "22023") throw new Error(`expected 22023, got ${e.code}: ${e.message}`);
  }
});

await check("an order cannot skip from submitted straight to completed", async () => {
  const o = await newOrder();
  await asUser(bob);
  try {
    await db.query(`select public.advance_order($1, 'completed')`, [o]);
    throw new Error("an order skipped the whole flow");
  } catch (e) {
    if (e.code !== "22023") throw new Error(`expected 22023, got ${e.code}: ${e.message}`);
  }
});

await check("the full lifecycle runs: submitted → quoted → paid → in_progress → completed", async () => {
  const o = await newOrder("msme-udyam");

  await asUser(bob);
  await db.query(`select public.quote_order($1, 0, 49900, null)`, [o]);

  await asUser(alice);
  await credit(alice, 100000, `k-life-${o}`);
  await db.query(`select public.pay_order_from_wallet($1)`, [o]);

  await asUser(bob);
  await db.query(`select public.advance_order($1, 'in_progress')`, [o]);
  const done = await one(`select * from public.advance_order($1, 'completed') as a`, [o]);

  eq(done.status, "completed", "final status");
  if (!done.completed_at) throw new Error("completed_at was not stamped");
});

await check("rejecting a paid order credits every rupee back", async () => {
  const o = await newOrder("pan");

  await asUser(bob);
  await db.query(`select public.quote_order($1, 10700, 29900, null)`, [o]);

  await asUser(alice);
  await credit(alice, 100000, `k-ref-${o}`);
  const before = await balance(alice);
  await db.query(`select public.pay_order_from_wallet($1)`, [o]);
  const afterPay = await balance(alice);
  eq(before - afterPay, 40600, "amount taken");

  await asUser(bob);
  const r = await one(`select * from public.reject_order($1, 'Address proof was not accepted') as r`, [o]);
  eq(r.status, "rejected", "status after rejection");

  eq(await balance(alice), before, "balance is restored exactly");
});

await check("a refund is written as new credits, not by editing the debits", async () => {
  const r = await one(
    `select count(*) filter (where direction='debit')  ::int as debits,
            count(*) filter (where direction='credit') ::int as credits
       from public.wallet_entries
      where order_id = (select id from public.service_orders
                         where status='rejected' order by created_at desc limit 1)`
  );
  eq(r.debits, 2, "the original debits are still there");
  eq(r.credits, 2, "matching credits were added");
});

await check("rejecting twice does not refund twice", async () => {
  const o = await newOrder("gst");
  await asUser(bob);
  await db.query(`select public.quote_order($1, 0, 20000, null)`, [o]);
  await asUser(alice);
  await credit(alice, 50000, `k-dbl-${o}`);
  await db.query(`select public.pay_order_from_wallet($1)`, [o]);
  const paid = await balance(alice);

  await asUser(bob);
  await db.query(`select public.reject_order($1, 'first reason')`, [o]);
  const refunded = await balance(alice);
  eq(refunded - paid, 20000, "refunded once");

  try {
    await db.query(`select public.reject_order($1, 'second attempt')`, [o]);
  } catch {
    // Already rejected — refusing is fine too. What must not happen is a
    // second credit.
  }
  eq(await balance(alice), refunded, "balance did not move again");
});

await check("a rejection without a reason is refused", async () => {
  const o = await newOrder();
  await asUser(bob);
  try {
    await db.query(`select public.reject_order($1, '   ')`, [o]);
    throw new Error("a blank reason was accepted");
  } catch (e) {
    if (e.code !== "22023") throw new Error(`expected 22023, got ${e.code}: ${e.message}`);
  }
});

await check("a completed order cannot be rejected afterwards", async () => {
  const done = await one(
    `select id from public.service_orders where status = 'completed' limit 1`
  );
  await asUser(bob);
  try {
    await db.query(`select public.reject_order($1, 'changed my mind')`, [done.id]);
    throw new Error("a completed order was rejected");
  } catch (e) {
    if (e.code !== "22023") throw new Error(`expected 22023, got ${e.code}: ${e.message}`);
  }
});

await check("is_staff distinguishes the two users", async () => {
  await asUser(bob);
  eq((await one(`select public.is_staff() as s`)).s, true, "bob is staff");
  await asUser(alice);
  eq((await one(`select public.is_staff() as s`)).s, false, "alice is not");
});

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);
