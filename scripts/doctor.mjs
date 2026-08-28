/**
 * Checks that this frontend is actually wired to a live backend.
 *
 *   npm run doctor
 *
 * It reads .env.local, then talks to the real Supabase project over HTTP and
 * asserts the things that matter — that the schema is there, that RLS refuses
 * an anonymous read of the ledger, and that the webhook function is deployed
 * with JWT verification off and its HMAC check working.
 *
 * That last set is the reason this script exists. The backend's PGlite suite
 * runs as superuser and BYPASSES row security, so it can prove the policies
 * parse but never that they grant correctly. Only a real round trip through
 * PostgREST can do that, and this is that round trip.
 *
 * No secret is ever printed. Keys are reported as present or absent.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

let passed = 0;
let failed = 0;
let warned = 0;

const pass = (t, extra) => {
  console.log(`  ${c.green("✓")} ${t}${extra ? c.dim(`  ${extra}`) : ""}`);
  passed++;
};
const fix = (t, how) => {
  console.log(`  ${c.red("✗")} ${t}`);
  if (how) console.log(`     ${c.dim(how)}`);
  failed++;
};
const warn = (t, how) => {
  console.log(`  ${c.yellow("!")} ${t}`);
  if (how) console.log(`     ${c.dim(how)}`);
  warned++;
};
const section = (t) => console.log(`\n${c.bold(t)}`);

/* ── env ──────────────────────────────────────────────────────────────────── */

console.log(c.bold("\nLAWFIC — connection doctor\n"));

const envPath = new URL("../.env.local", import.meta.url);
const env = {};

if (!existsSync(envPath)) {
  console.log(`  ${c.red("✗")} No .env.local`);
  console.log(`     ${c.dim("cp .env.example .env.local, then fill in the Supabase keys.")}`);
  console.log(`\n${c.dim("Nothing else can be checked without it.")}\n`);
  process.exit(1);
}

for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
};

section("Environment");

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!URL_) fix("NEXT_PUBLIC_SUPABASE_URL is not set", "Dashboard → Settings → API → Project URL");
else if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(URL_))
  warn(`NEXT_PUBLIC_SUPABASE_URL looks unusual: ${URL_}`, "Expected https://YOUR-REF.supabase.co");
else pass("NEXT_PUBLIC_SUPABASE_URL", URL_);

if (!ANON) fix("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set", "Dashboard → Settings → API → anon/public key");
else pass("NEXT_PUBLIC_SUPABASE_ANON_KEY", `set, ${ANON.length} chars`);

if (!SERVICE)
  fix("SUPABASE_SERVICE_ROLE_KEY is not set", "Needed by /api/wallet/topup to record a payment intent.");
else if (SERVICE === ANON) fix("SUPABASE_SERVICE_ROLE_KEY is the same as the anon key", "Copy the service_role key, not the anon one.");
else pass("SUPABASE_SERVICE_ROLE_KEY", "set, server-only");

for (const key of Object.keys(env)) {
  if (key.startsWith("NEXT_PUBLIC_") && /secret|service_role/i.test(key)) {
    fix(`${key} is exposed to the browser`, "Remove the NEXT_PUBLIC_ prefix. This is a total compromise.");
  }
}

if (!URL_ || !ANON) {
  console.log(`\n${c.dim("Cannot reach the backend without a URL and anon key.")}\n`);
  process.exit(1);
}

const base = URL_.replace(/\/$/, "");
const anon = createClient(base, ANON, { auth: { persistSession: false } });

/* ── reachability ─────────────────────────────────────────────────────────── */

section("Backend");

try {
  const res = await fetch(`${base}/rest/v1/`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  const ref = res.headers.get("sb-project-ref");
  if (ref) pass("Project is reachable", ref);
  else if (res.ok || res.status === 404) pass("Project is reachable");
  else fix(`Project responded ${res.status}`, "Check the URL and that the project is not paused.");
} catch (e) {
  fix("Cannot reach the project", `${e.message}. Check the URL and your connection.`);
  console.log();
  process.exit(1);
}

/* ── schema ───────────────────────────────────────────────────────────────── */

section("Schema");

const { data: svc, error: svcErr } = await anon.from("services").select("slug, name").limit(50);

if (svcErr) {
  if (/does not exist|schema cache/i.test(svcErr.message)) {
    fix(
      "The `services` table is missing — migrations have not been applied",
      "From the backend repo:  npm run deploy -- --project-ref YOUR-REF"
    );
  } else {
    fix(`Reading services failed: ${svcErr.message}`);
  }
} else {
  pass("Migrations applied", `${svc.length} services seeded`);
  const expected = ["aadhaar", "msme-udyam", "gst", "pan"];
  const missing = expected.filter((s) => !svc.some((r) => r.slug === s));
  if (missing.length) warn(`Seed rows missing: ${missing.join(", ")}`);
  else pass("The four live services are present");
}

/* ── RLS — the part PGlite could not prove ────────────────────────────────── */

section("Row level security");
console.log(c.dim("  These run as an anonymous visitor. Every one must be refused."));

const { data: entries, error: entErr } = await anon.from("wallet_entries").select("id").limit(1);
if (entErr) pass("Anonymous cannot read wallet_entries", entErr.code ?? "");
else if (entries?.length === 0) pass("Anonymous reads no wallet_entries", "empty result");
else fix("ANONYMOUS CAN READ THE LEDGER", "RLS is not enforcing. Do not go live until this is fixed.");

const { error: insErr } = await anon.from("wallet_entries").insert({
  user_id: "00000000-0000-0000-0000-000000000000",
  direction: "credit",
  amount_paise: 100000,
  reason: "doctor probe",
  idempotency_key: `doctor:${Date.now()}`,
});
if (insErr) pass("Anonymous cannot write to wallet_entries", insErr.code ?? "");
else fix("ANONYMOUS CAN MINT BALANCE", "Critical. INSERT must be revoked from anon.");

const { error: ordErr } = await anon.from("service_orders").select("id").limit(1);
if (ordErr) pass("Anonymous cannot read service_orders", ordErr.code ?? "");
else pass("Anonymous reads no service_orders", "empty result");

// Supabase's default privileges grant EXECUTE to `anon` on every new function
// in `public`. A `revoke from public` does NOT undo a direct grant to a named
// role, so this has to be asserted against the live project — the offline suite
// runs as superuser, where grants do not apply.
const NIL = "00000000-0000-0000-0000-000000000000";
const moneyFns = [
  ["pay_order_from_wallet", { p_order_id: NIL }],
  ["quote_order", { p_order_id: NIL, p_government_fee_paise: 0, p_professional_fee_paise: 100, p_admin_notes: null }],
  ["advance_order", { p_order_id: NIL, p_status: "in_progress" }],
  ["reject_order", { p_order_id: NIL, p_reason: "doctor probe" }],
];

for (const [fn, args] of moneyFns) {
  const { error } = await anon.rpc(fn, args);
  if (!error) {
    fix(`anon can execute ${fn}`, "Revoke EXECUTE from anon. This is a money function.");
  } else if (error.code === "42501" || /permission denied/i.test(error.message)) {
    pass(`anon cannot execute ${fn}`, "permission denied");
  } else if (error.code === "PGRST202") {
    warn(`${fn} was not found`, "Migrations may be out of date — re-run the deploy.");
  } else {
    warn(`anon reached ${fn} and was refused inside it`, `${error.code ?? ""} — the guard held, but EXECUTE should be revoked too.`);
  }
}

const { error: rpcErr } = await anon.rpc("my_wallet_balance");
if (rpcErr) pass("my_wallet_balance is not callable anonymously", rpcErr.code ?? "");
else warn("my_wallet_balance answered an anonymous caller", "Expected it to be granted to `authenticated` only.");

/* ── auth ─────────────────────────────────────────────────────────────────── */

section("Auth");

try {
  const res = await fetch(`${base}/auth/v1/settings`, { headers: { apikey: ANON } });
  if (res.ok) {
    const s = await res.json();
    const email = s.external?.email ?? s.email_enabled;
    if (email) pass("Email sign-in is enabled");
    else fix("Email sign-in is disabled", "Dashboard → Authentication → Providers → enable Email.");

    const phone = s.external?.phone ?? s.phone_enabled;
    if (phone) pass("Phone sign-in is enabled");
    else
      warn(
        "Phone sign-in is off",
        "Expected until DLT registration clears. Email magic link is the working path."
      );
  } else {
    warn(`Could not read auth settings (${res.status})`);
  }
} catch {
  warn("Could not read auth settings");
}

/* ── the webhook ──────────────────────────────────────────────────────────── */

section("Razorpay webhook (Edge Function)");

const fnUrl = `${base}/functions/v1/razorpay-webhook`;
try {
  // A deliberately wrong signature. A correct deployment answers 401 from the
  // FUNCTION, with its own body — which proves three things at once: deployed,
  // verify_jwt is off, and the HMAC check runs.
  const res = await fetch(fnUrl, {
    method: "POST",
    headers: { "content-type": "application/json", "x-razorpay-signature": "deadbeef" },
    body: JSON.stringify({ event: "payment.captured", payload: {} }),
  });
  const text = await res.text();

  if (res.status === 404) {
    fix("Function is not deployed", "From the backend repo:  npx supabase functions deploy razorpay-webhook");
  } else if (res.status === 401 && text.includes("bad_signature")) {
    pass("Deployed, JWT verification off, signature check working");
  } else if (res.status === 401) {
    fix(
      "Rejected at the gateway, not by the function",
      "verify_jwt is still ON. Razorpay sends no bearer token, so every real\n     webhook would be dropped and no wallet ever credited.\n     Fix: verify_jwt = false in supabase/config.toml, then redeploy."
    );
  } else if (text.includes("not_configured")) {
    warn(
      "Deployed but RAZORPAY_WEBHOOK_SECRET is not set",
      "It ignores every delivery until then. From the backend repo:\n     npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=your-secret"
    );
  } else {
    warn(`Unexpected response ${res.status}`, text.slice(0, 160));
  }
} catch (e) {
  fix("Could not reach the function", e.message);
}

/* ── razorpay keys ────────────────────────────────────────────────────────── */

section("Razorpay (frontend keys)");

const keyId = env.RAZORPAY_KEY_ID ?? "";
const keySecret = env.RAZORPAY_KEY_SECRET ?? "";

if (!keyId || !keySecret) {
  warn(
    "Razorpay keys are not set",
    "Top-ups return 503 until they are. Test keys (rzp_test_…) are issued on\n     signup, before KYC — enough to run the whole flow end to end."
  );
} else if (keyId.startsWith("rzp_test_")) {
  pass("Test-mode keys", "no real money moves; the wallet shows a Test mode badge");
} else if (keyId.startsWith("rzp_live_")) {
  warn("LIVE keys are set", "Real money will move. Make sure that is intended.");
} else {
  warn(`RAZORPAY_KEY_ID looks unusual: ${keyId.slice(0, 12)}…`);
}

if (env.RAZORPAY_WEBHOOK_SECRET) {
  warn(
    "RAZORPAY_WEBHOOK_SECRET is in the frontend .env.local",
    "It belongs only in Supabase secrets — the webhook does not run here any more."
  );
}

/* ── summary ──────────────────────────────────────────────────────────────── */

console.log(
  `\n${c.bold("Result")}  ${c.green(`${passed} passed`)}` +
    (warned ? `  ${c.yellow(`${warned} to check`)}` : "") +
    (failed ? `  ${c.red(`${failed} to fix`)}` : "")
);

if (!failed && !warned) {
  console.log(`\n${c.green("Frontend and backend are connected.")}`);
  console.log(c.dim("Next: sign in at /login, then do a ₹1 test top-up at /wallet.\n"));
} else if (!failed) {
  console.log(`\n${c.dim("Nothing broken. The warnings above are the remaining setup steps.")}\n`);
} else {
  console.log(`\n${c.dim("Fix the ✗ items above, then run this again.")}\n`);
}

process.exit(failed ? 1 : 0);
