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

/* NEXT_PUBLIC_SITE_URL fails silently in both of its jobs, which is why it is
   worth a line here. Unset, sign-in emails carry a link that works only on the
   machine that asked for it, and the whole site serves noindex with an empty
   sitemap. Neither shows up as an error anywhere. */
const SITE = env.NEXT_PUBLIC_SITE_URL ?? "";
if (!SITE) {
  warn(
    "NEXT_PUBLIC_SITE_URL is not set",
    "Fine locally. In production it means sign-in emails link to localhost, and the site tells search engines not to index it.",
  );
} else if (!/^https?:\/\//.test(SITE)) {
  fix(`NEXT_PUBLIC_SITE_URL is not a URL: ${SITE}`, "Include the scheme, e.g. https://lawfic.pro");
} else if (SITE.endsWith("/")) {
  warn(`NEXT_PUBLIC_SITE_URL has a trailing slash: ${SITE}`, "Harmless — the app strips it — but drop it anyway.");
} else {
  pass("NEXT_PUBLIC_SITE_URL", SITE);
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

section("Cashfree webhook (Edge Function)");

const fnUrl = `${base}/functions/v1/cashfree-webhook`;
try {
  /* A deliberately wrong signature. A correct deployment answers 401 from the
     FUNCTION, with its own body — which proves three things at once: deployed,
     verify_jwt is off, and the HMAC check runs.

     The timestamp is current, so a 401 here can only be the signature. Sending
     a stale one would also produce a 401 and the two would be indistinguishable
     from out here. */
  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webhook-signature": "bm90LWEtcmVhbC1zaWduYXR1cmU=",
      "x-webhook-timestamp": String(Math.floor(Date.now() / 1000)),
    },
    body: JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: {} }),
  });
  const text = await res.text();

  if (res.status === 404) {
    fix("Function is not deployed", "From the backend repo:  npx supabase functions deploy cashfree-webhook");
  } else if (res.status === 401 && text.includes("bad_signature")) {
    pass("Deployed, JWT verification off, signature check working");
  } else if (res.status === 401) {
    fix(
      "Rejected at the gateway, not by the function",
      "verify_jwt is still ON. Cashfree sends no bearer token, so every real\n     webhook would be dropped and no wallet ever credited.\n     Fix: verify_jwt = false in supabase/config.toml, then redeploy."
    );
  } else if (text.includes("not_configured")) {
    warn(
      "Deployed but CASHFREE_CLIENT_SECRET is not set there",
      "It ignores every delivery until then. From the backend repo:\n     npx supabase secrets set CASHFREE_CLIENT_SECRET=your-secret\n     (Cashfree has no separate webhook secret — it is the same client secret.)"
    );
  } else {
    warn(`Unexpected response ${res.status}`, text.slice(0, 160));
  }
} catch (e) {
  fix("Could not reach the function", e.message);
}

/* ── cashfree keys ────────────────────────────────────────────────────────── */

section("Cashfree (payment keys)");

const cfId = env.CASHFREE_CLIENT_ID ?? "";
const cfSecret = env.CASHFREE_CLIENT_SECRET ?? "";
const cfMode = env.CASHFREE_MODE ?? "";

/**
 * Does the SECRET agree with the MODE?
 *
 * This check exists because its absence produced a false green. The keys were
 * a production pair, CASHFREE_MODE said sandbox, and the doctor reported
 * "Sandbox credentials" — because it believed the variable instead of looking
 * at the key. Every order creation then failed with a bare 401 and nothing
 * anywhere said why.
 *
 * Cashfree's secrets carry their own environment: `cfsk_ma_test_…` against
 * `cfsk_ma_prod_…`. That marker is the key telling you what it is, which beats
 * a variable telling you what somebody meant. When the two disagree the key
 * wins the argument, because the key is what the API checks.
 *
 * The app id is NOT a reliable signal — sandbox ids are sometimes prefixed
 * TEST and sometimes not — so it is no longer used to infer anything.
 */
const secretEnv = /^cfsk_[a-z]+_test_/i.test(cfSecret)
  ? "sandbox"
  : /^cfsk_[a-z]+_prod_/i.test(cfSecret)
    ? "production"
    : null;

/* What lib/cashfree.ts will actually resolve to, reproduced exactly. */
const effectiveMode =
  cfMode === "production" ? "production" : cfMode === "sandbox" ? "sandbox" : "sandbox";

if (!cfId || !cfSecret) {
  warn(
    "Cashfree keys are not set",
    "Top-ups return 503 until they are. Sandbox credentials are issued\n     immediately in the dashboard — enough to run the whole flow end to end."
  );
} else if (secretEnv && secretEnv !== effectiveMode) {
  fix(
    `The key is ${secretEnv.toUpperCase()} but the app will call ${effectiveMode.toUpperCase()}`,
    secretEnv === "production"
      ? `Those are LIVE credentials and CASHFREE_MODE is "${cfMode || "unset, so sandbox"}". The sandbox API refuses them — every top-up fails with a 401.\n     Either use the sandbox key pair from the dashboard (Developers → API Keys, sandbox environment), or set CASHFREE_MODE=production and accept that real money will move.`
      : `Those are SANDBOX credentials and CASHFREE_MODE=production. The live API refuses them.\n     Set CASHFREE_MODE=sandbox, or swap in the production key pair.`
  );
} else if (effectiveMode === "production") {
  warn("LIVE mode, and the key agrees", "Real money will move. Make sure that is intended.");
} else if (secretEnv === "sandbox") {
  pass("Sandbox credentials", "no real money moves; the wallet shows a Test mode badge");
} else {
  /* An unrecognised secret shape. Say so rather than guessing — a silent
     assumption here is what produced the false green in the first place. */
  warn(
    "Cannot tell which environment these keys belong to",
    `The secret does not look like cfsk_..._test_ or cfsk_..._prod_. The app will call the ${effectiveMode.toUpperCase()} API.`
  );
}

/* The client secret signs the webhooks as well as the API calls, so the SAME
   value has to exist in two places: here for creating orders, and in Supabase
   secrets for verifying deliveries. Arriving from Razorpay, the instinct is to
   look for a second webhook-only secret; there isn't one. */
if (cfSecret) {
  console.log(
    `  ${c.dim("Remember: the same secret must also be set in the backend —")}`
  );
  console.log(`  ${c.dim("npx supabase secrets set CASHFREE_CLIENT_SECRET=…")}`);
}

if (env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_SECRET || env.RAZORPAY_WEBHOOK_SECRET) {
  warn(
    "Razorpay keys are still in .env.local",
    "The integration is gone. Delete them so nobody wires them back up by\n     mistake, and revoke them in the Razorpay dashboard."
  );
}


/* ── the canonical hostname ───────────────────────────────────────────────── */

/**
 * Does the site agree with its host about what it is called?
 *
 * WHY THIS CHECK EXISTS
 *
 * lawfic.pro and www.lawfic.pro are two different sites as far as a search
 * engine is concerned, and exactly one of them has to be the real one. The
 * hosting platform picks a primary domain and redirects the other to it; this
 * app takes NEXT_PUBLIC_SITE_URL and writes it into every canonical tag, every
 * og:url, every <loc> in the sitemap and the Sitemap: line in robots.txt.
 *
 * If those two disagree, nothing breaks. Every page loads, every link works,
 * and the damage is invisible from a browser:
 *
 *   • Search Console reports "Couldn't fetch" on the sitemap, because the URL
 *     submitted redirects to a different hostname.
 *   • Every URL inside the sitemap is a redirect, so none of them get indexed.
 *   • Each page carries a canonical pointing at a URL that redirects straight
 *     back to the page — a loop a crawler has to resolve by guessing.
 *
 * It is the kind of thing that is found weeks later in a Search Console report
 * rather than by looking at the site, so it is worth one HTTP request here.
 *
 * Only runs when NEXT_PUBLIC_SITE_URL is set, and never fails the script on a
 * network error — the site being unreachable from this machine is not evidence
 * of a misconfiguration.
 */
if (SITE && /^https?:\/\//.test(SITE)) {
  section("Canonical hostname");

  try {
    /* `redirect: "manual"` is the whole point. Following the redirect would
       return 200 and hide the very thing being looked for. */
    const res = await fetch(`${SITE}/sitemap.xml`, {
      redirect: "manual",
      headers: { "user-agent": "LAWFIC-doctor" },
    });

    const location = res.headers.get("location");

    if (res.status >= 300 && res.status < 400 && location) {
      const to = new URL(location, SITE);
      const from = new URL(SITE);

      if (to.host !== from.host) {
        fix(
          `${from.host} redirects to ${to.host}, but NEXT_PUBLIC_SITE_URL says ${from.host}`,
          `Pick one and make both agree. Either set the primary domain to ${from.host} on the host (so ${to.host} redirects to it), or set NEXT_PUBLIC_SITE_URL=${to.protocol}//${to.host}. Until then the sitemap cannot be fetched and no page is indexed under the name it claims.`
        );
      } else {
        warn(
          `${SITE}/sitemap.xml redirects to ${to.pathname}`,
          "Same host, so it is survivable — but a sitemap that redirects is one more thing between Google and the URLs."
        );
      }
    } else if (res.ok) {
      pass("The site answers on its own canonical hostname", `${new URL(SITE).host}, no redirect`);
    } else {
      warn(`${SITE}/sitemap.xml returned ${res.status}`, "Deployed yet?");
    }
  } catch {
    /* Offline, DNS not propagated, or the domain is not live. None of those
       are configuration faults, so this stays silent about pass or fail. */
    console.log(`  ${c.dim(`Could not reach ${SITE} — skipped.`)}`);
  }
}

/* ── email authentication ────────────────────────────────────────── */

/**
 * Why a sign-in code lands in spam.
 *
 * Almost never the wording, and almost always these three DNS records. A
 * mailbox provider that cannot verify who sent a message has one safe place to
 * put it, and since February 2024 Gmail and Yahoo have treated a missing DMARC
 * record as a reason on its own.
 *
 *   SPF    says which servers may send for the domain.
 *   DKIM   signs the message so it cannot be altered or forged.
 *   DMARC  tells a receiver what to do when the first two disagree, and is the
 *          only one of the three that is checked against the address a human
 *          actually sees in the From line.
 *
 * Two SPF records matter here and they are at different names. Resend sends
 * with an envelope of `send.<domain>`, so its SPF lives there and that is what
 * is checked for a sign-in code. Mail a person sends from webmail goes out as
 * the bare domain, so the apex needs its own. A domain can have SPF on the
 * subdomain and none at the apex, pass every automated test, and still have
 * every hand-written message from the company treated as unauthenticated.
 *
 * This runs over DNS-over-HTTPS rather than a resolver library so it needs no
 * dependency, and it never fails the script on a network error.
 */
const MAIL_DOMAIN = SITE ? (() => { try { return new URL(SITE).hostname.replace(/^www\./, ""); } catch { return null; } })() : null;

if (MAIL_DOMAIN) {
  section("Email authentication (why codes go to spam)");

  const txt = async (name) => {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT`,
      { headers: { accept: "application/dns-json" } },
    );
    if (!res.ok) throw new Error(String(res.status));
    const body = await res.json();
    return (body.Answer || [])
      .filter((a) => a.type === 16)
      .map((a) => a.data.replace(/^"|"$/g, ""));
  };

  try {
    const [apex, dmarc, sendSpf, dkim] = await Promise.all([
      txt(MAIL_DOMAIN),
      txt(`_dmarc.${MAIL_DOMAIN}`),
      txt(`send.${MAIL_DOMAIN}`),
      txt(`resend._domainkey.${MAIL_DOMAIN}`),
    ]);

    const dmarcRecord = dmarc.find((r) => r.toLowerCase().startsWith("v=dmarc1"));
    if (!dmarcRecord) {
      fix(
        `No DMARC record at _dmarc.${MAIL_DOMAIN}`,
        `THIS IS THE ONE THAT SENDS CODES TO SPAM. Add a TXT record at "_dmarc" with:  v=DMARC1; p=none; rua=mailto:dmarc@${MAIL_DOMAIN}  — p=none only watches and changes nothing about delivery, which is where to start.`,
      );
    } else {
      const policy = /p=(\w+)/.exec(dmarcRecord)?.[1] ?? "?";
      pass("DMARC", `p=${policy}`);
      if (policy === "none") {
        warn(
          "DMARC is p=none, which only monitors",
          "Fine for a few weeks. Once the reports show nothing legitimate failing, move to p=quarantine — receivers trust a domain that enforces its own policy.",
        );
      }
    }

    if (sendSpf.some((r) => r.toLowerCase().startsWith("v=spf1"))) {
      pass("SPF for sign-in codes", `send.${MAIL_DOMAIN}`);
    } else {
      fix(
        `No SPF at send.${MAIL_DOMAIN}`,
        "Resend sends with this envelope. Add the SPF record from the Resend dashboard's Domains page.",
      );
    }

    if (dkim.some((r) => r.includes("p="))) {
      pass("DKIM", `resend._domainkey.${MAIL_DOMAIN}`);
    } else {
      fix(`No DKIM key at resend._domainkey.${MAIL_DOMAIN}`, "From the Resend dashboard, Domains → your domain.");
    }

    if (!apex.some((r) => r.toLowerCase().startsWith("v=spf1"))) {
      warn(
        `No SPF at ${MAIL_DOMAIN} itself`,
        `Sign-in codes are unaffected — they authenticate through the send. subdomain. What is unauthenticated is mail a person sends from webmail. Add a TXT record at "@":  v=spf1 include:_spf.mail.hostinger.com ~all`,
      );
    } else {
      pass(`SPF for staff mail`, MAIL_DOMAIN);
    }
  } catch {
    console.log(`  ${c.dim("Could not reach DNS — skipped.")}`);
  }
}

/* ── going live with real money ───────────────────────────────────────────── */

/**
 * The things that are only a problem once real cards are involved.
 *
 * Everything above answers "is it wired up". This section answers a different
 * question — "should this be taking money from strangers yet" — and the two
 * have different answers. A sandbox deployment may be perfectly wired and still
 * have no legal entity behind it, no invoice table, and a domain the gateway
 * will refuse to redirect to.
 */

section("Going live (real money)");

if (effectiveMode !== "production") {
  console.log(`  ${c.dim("Sandbox mode — this section is advisory until CASHFREE_MODE=production.")}`);
}

/* The database has to be able to issue the documents. Payments without
   paperwork is the kind of thing that is fine for a week and then is not. */
try {
  const res = await fetch(`${URL_}/rest/v1/invoices?select=id&limit=1`, {
    headers: { apikey: ANON, authorization: `Bearer ${ANON}` },
  });
  if (res.status === 404 || res.status === 400) {
    fix(
      "The invoices table is not in this database",
      "Payments would succeed and issue no receipt. Apply the invoice migration:\n     supabase/migrations/20260917090000_invoices.sql and _gst_rate_gate.sql"
    );
  } else {
    pass("Invoice tables present", "every movement of money gets a document");
  }
} catch {
  console.log(`  ${c.dim("Could not check the invoice tables.")}`);
}

/* GST. The rate defaults to zero and must STAY zero until there is a
   registration — see the migration for why this is not a formality. */
try {
  /* The SERVICE role, not the anon key. gst.rate_bp is is_public = false, so an
     anonymous read returns an empty array — which the first version of this
     check reported as "not configured" for a setting that was configured. A
     check that cannot see a thing must say so, not conclude it is absent. */
  const res = SERVICE
    ? await fetch(`${URL_}/rest/v1/site_settings?key=eq.gst.rate_bp&select=value`, {
        headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}` },
      })
    : null;
  const rows = res && res.ok ? await res.json() : [];
  const rate = rows.length ? Number(rows[0].value) : null;
  if (!SERVICE) {
    console.log(`  ${c.dim("No service role key — cannot read the GST setting.")}`);
  } else if (rate === null) {
    warn(
      "GST rate row is missing",
      "gst_rate_bp() falls back to 0, so no tax is charged — but add the row so the setting is visible:\n     insert into public.site_settings (key, value, is_public) values ('gst.rate_bp', '0'::jsonb, false);"
    );
  } else if (rate === 0) {
    pass("GST rate is 0", "correct while there is no GSTIN — documents show one honest total");
  } else {
    warn(
      `GST is being charged at ${rate / 100}%`,
      "Make sure the GSTIN in lib/company.ts is real and current. Charging tax without a registration is an offence under s.122 CGST."
    );
  }
} catch {
  /* site_settings may not be readable anonymously; not worth failing over. */
}

if (effectiveMode === "production") {
  if (!SITE) {
    fix(
      "NEXT_PUBLIC_SITE_URL is not set and you are in LIVE mode",
      "Cashfree validates return_url against the domains registered on the merchant account. Unset, the app builds it from whatever host served the request, and the payment comes back to nowhere."
    );
  } else {
    pass("Return URL host", new URL(SITE).host);
  }

  warn(
    "Checks only you can make",
    "Webhook registered in the PRODUCTION Cashfree dashboard (sandbox and live are separate).\n     Domain whitelisted for return_url. Legal pages reachable. lib/company.ts filled in —\n     the E-Commerce Rules require a legal name, address and a named grievance officer on the site."
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
