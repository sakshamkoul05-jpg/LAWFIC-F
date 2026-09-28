import { NextResponse } from "next/server";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  grantUnlock,
  issueChallenge,
  lockConfigured,
  relyingParty,
  revokeUnlock,
  takeChallenge,
} from "@/lib/wallet-lock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Face ID, Touch ID, Windows Hello and Android fingerprint, on the wallet.
 *
 * ONE ROUTE, FOUR STEPS
 *
 * register/options → register/verify → auth/options → auth/verify. They share
 * a file because they share the relying party, the challenge handling and the
 * gate, and four files repeating all three is four places to get the origin
 * check wrong.
 *
 * NOTHING BIOMETRIC ARRIVES HERE
 *
 * The sensor unlocks a private key inside the device's secure enclave; the key
 * signs our challenge. We store the matching public key and verify signatures
 * with it. No fingerprint, no face, no template — which is both the security
 * design and the reason this does not make LAWFIC a processor of biometric
 * data under the DPDP Act.
 *
 * WHY THE WRITES USE THE SERVICE ROLE
 *
 * wallet_passkeys grants clients SELECT and DELETE and nothing else. Inserting
 * a credential is only meaningful after the server has verified the
 * attestation, and bumping the counter is only meaningful after it has
 * verified a signature — so both happen here, behind that verification, with a
 * key the browser does not have. A client that could write those rows could
 * register a credential nobody proved they held, or freeze the counter and
 * defeat clone detection.
 */

type Step = "register/options" | "register/verify" | "auth/options" | "auth/verify" | "revoke";

type Row = {
  id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string[];
  label: string;
};

export async function POST(request: Request) {
  if (!lockConfigured()) {
    return NextResponse.json(
      {
        error: "not_configured",
        message:
          "Wallet lock is not switched on for this deployment. It needs WALLET_LOCK_SECRET set.",
      },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });
  const user = auth.user;

  let body: { step?: Step; label?: string; response?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { rpID, origin } = await relyingParty();

  /* The customer's existing credentials, read under their own RLS. */
  const { data } = await supabase
    .from("wallet_passkeys")
    .select("id, credential_id, public_key, counter, transports, label")
    .eq("user_id", user.id);
  const keys = (data ?? []) as Row[];

  switch (body.step) {
    /* ── 1. what to register ────────────────────────────────────────── */
    case "register/options": {
      const options = await generateRegistrationOptions({
        rpName: "LAWFIC Wallet",
        rpID,
        userID: new TextEncoder().encode(user.id),
        userName: user.email ?? user.id,
        attestationType: "none",
        /* Already-registered credentials are excluded so the browser says
           "you already have one of these on this device" rather than silently
           creating a second that shadows the first. */
        excludeCredentials: keys.map((k) => ({ id: k.credential_id })),
        authenticatorSelection: {
          /* platform: the sensor built into this device — Face ID, Touch ID,
             Windows Hello, the fingerprint reader. Not a USB key: the request
             was for the thing on the phone. */
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          /* required, not preferred. Without it a device can satisfy the
             ceremony by merely being present — which is a possession check,
             not a biometric one, and the wallet is asking for a person. */
          userVerification: "required",
        },
      });

      await issueChallenge();
      /* The library's challenge is replaced by ours so there is exactly one
         source of truth, and it is the one the cookie burns after use. */
      return NextResponse.json({ ...options, challenge: await reissue(options.challenge) });
    }

    /* ── 2. verify and store ────────────────────────────────────────── */
    case "register/verify": {
      const expectedChallenge = await takeChallenge();
      if (!expectedChallenge) {
        return NextResponse.json({ error: "challenge_expired" }, { status: 400 });
      }

      let verification;
      try {
        verification = await verifyRegistrationResponse({
          response: body.response as RegistrationResponseJSON,
          expectedChallenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
          requireUserVerification: true,
        });
      } catch {
        return NextResponse.json({ error: "verification_failed" }, { status: 400 });
      }

      if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json({ error: "verification_failed" }, { status: 400 });
      }

      const { credential, credentialBackedUp } = verification.registrationInfo;

      const admin = createAdminClient();
      if (!admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });

      const { error } = await admin.from("wallet_passkeys").insert({
        user_id: user.id,
        credential_id: credential.id,
        public_key: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        transports: credential.transports ?? [],
        backed_up: credentialBackedUp,
        label: (body.label ?? "").slice(0, 60) || "This device",
      });

      if (error) {
        /* The unique index on credential_id. Registering the same authenticator
           twice is a mistake, not an attack. */
        if (error.code === "23505") {
          return NextResponse.json({ error: "already_registered" }, { status: 409 });
        }
        console.error("[wallet/passkey] insert failed", error);
        return NextResponse.json({ error: "save_failed" }, { status: 500 });
      }

      /* Registering proves possession and a successful user verification right
         now, so the wallet opens without a second prompt. */
      await grantUnlock(user.id);
      return NextResponse.json({ ok: true });
    }

    /* ── 3. what to sign ────────────────────────────────────────────── */
    case "auth/options": {
      if (!keys.length) return NextResponse.json({ error: "no_passkeys" }, { status: 404 });

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: keys.map((k) => ({
          id: k.credential_id,
          transports: k.transports as never,
        })),
        userVerification: "required",
      });

      await issueChallenge();
      return NextResponse.json({ ...options, challenge: await reissue(options.challenge) });
    }

    /* ── 4. verify the signature and unlock ─────────────────────────── */
    case "auth/verify": {
      const expectedChallenge = await takeChallenge();
      if (!expectedChallenge) {
        return NextResponse.json({ error: "challenge_expired" }, { status: 400 });
      }

      const response = body.response as AuthenticationResponseJSON;
      const key = keys.find((k) => k.credential_id === response?.id);
      if (!key) return NextResponse.json({ error: "unknown_credential" }, { status: 404 });

      let verification;
      try {
        verification = await verifyAuthenticationResponse({
          response,
          expectedChallenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
          requireUserVerification: true,
          credential: {
            id: key.credential_id,
            publicKey: new Uint8Array(Buffer.from(key.public_key, "base64url")),
            counter: Number(key.counter),
            transports: key.transports as never,
          },
        });
      } catch {
        return NextResponse.json({ error: "verification_failed" }, { status: 400 });
      }

      if (!verification.verified) {
        return NextResponse.json({ error: "verification_failed" }, { status: 400 });
      }

      const next = verification.authenticationInfo.newCounter;

      /* CLONE DETECTION. A counter that has not advanced means the same
         signature state was used twice, which is what a copied credential
         looks like. Synced passkeys report 0 forever and are exempt —
         treating them as clones would reject every iCloud keychain in the
         country. */
      if (Number(key.counter) > 0 && next <= Number(key.counter)) {
        console.warn("[wallet/passkey] counter did not advance", { id: key.id });
        return NextResponse.json({ error: "possible_clone" }, { status: 400 });
      }

      const admin = createAdminClient();
      if (admin) {
        await admin
          .from("wallet_passkeys")
          .update({ counter: next, last_used_at: new Date().toISOString() })
          .eq("id", key.id);
      }

      await grantUnlock(user.id);
      return NextResponse.json({ ok: true });
    }

    /* ── lock it again ──────────────────────────────────────────────── */
    case "revoke": {
      await revokeUnlock();
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "bad_step" }, { status: 400 });
  }
}

/**
 * Remove a credential.
 *
 * Runs under the customer's own RLS rather than the service role: deleting
 * your own key needs no elevated privilege, and a delete that can only touch
 * your own rows cannot be turned into a way to remove somebody else's.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "not_signed_in" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { error } = await supabase.from("wallet_passkeys").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "delete_failed" }, { status: 500 });

  /* Removing the last key would otherwise leave the wallet locked behind a
     credential that no longer exists. */
  const { count } = await supabase
    .from("wallet_passkeys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id);

  if (!count) await revokeUnlock();

  return NextResponse.json({ ok: true, remaining: count ?? 0 });
}

/**
 * The options object carries a challenge the library generated; ours is the
 * one in the cookie. Rather than let two exist, the cookie's value is read
 * straight back and returned, so the browser signs exactly what the verify
 * step will compare against.
 */
async function reissue(_libraryChallenge: string): Promise<string> {
  const { cookies } = await import("next/headers");
  return (await cookies()).get("lawfic_wallet_challenge")?.value ?? _libraryChallenge;
}
