-- Face ID, Touch ID, Windows Hello and Android fingerprint on the wallet.
--
-- WHAT IS ACTUALLY STORED, AND WHAT IS NOT
--
-- Not a fingerprint. Not a face. Nothing biometric ever leaves the customer's
-- device or reaches this database — that is the whole point of WebAuthn. The
-- sensor unlocks a private key held in the phone's secure enclave, and the key
-- signs a challenge. What is kept here is the matching PUBLIC key, which is
-- useless to anybody who steals it: it verifies signatures and cannot produce
-- one.
--
-- This matters legally as well as technically. Storing a fingerprint template
-- would make LAWFIC a processor of biometric data under the DPDP Act, with
-- everything that follows. Storing a public key is storing a public key.
--
-- THE COUNTER IS A CLONE DETECTOR
--
-- Authenticators report how many times they have been used. If a signature
-- arrives with a counter at or below the last one we saw, the credential has
-- most likely been copied — and the verification is rejected. Passkeys synced
-- through iCloud or Google report zero and never increment, so a zero counter
-- is exempt rather than treated as an attack; anything else must climb.
--
-- ONE ROW PER DEVICE, NOT PER PERSON
--
-- A customer with a laptop and a phone registers both, and losing one does not
-- lock them out of the other. `label` is what they called it, so the list is
-- readable enough for somebody to recognise the device they lost and remove
-- it.

create table if not exists public.wallet_passkeys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,

  /* The credential ID, base64url, as the authenticator issued it. Unique
     across the whole table: a credential belongs to exactly one account, and a
     duplicate would mean two users claiming the same authenticator. */
  credential_id text not null unique check (length(credential_id) between 16 and 512),

  /* The COSE public key, base64url. Verifies signatures; cannot make them. */
  public_key    text not null check (length(public_key) <= 2048),

  /* Clone detection. See above. */
  counter       bigint not null default 0,

  /* usb, nfc, ble, internal, hybrid — how the browser reached it. Passed back
     on the next authentication so the browser prompts the right way. */
  transports    text[] not null default '{}',

  /* Whether the credential is synced to a cloud keychain. Worth knowing when
     somebody asks why removing it from one device did not remove it. */
  backed_up     boolean not null default false,

  label         text not null default '' check (length(label) <= 60),
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

create index if not exists wallet_passkeys_user_idx on public.wallet_passkeys (user_id);

alter table public.wallet_passkeys enable row level security;

-- A customer sees and removes their own keys, and nobody else's.
drop policy if exists "passkeys own read" on public.wallet_passkeys;
create policy "passkeys own read"
  on public.wallet_passkeys for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "passkeys own delete" on public.wallet_passkeys;
create policy "passkeys own delete"
  on public.wallet_passkeys for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- INSERT AND UPDATE ARE NOT GRANTED TO CLIENTS, DELIBERATELY.
--
-- Registering a credential is only meaningful if the server verified the
-- attestation first, and bumping the counter is only meaningful if the server
-- verified the signature. A client that could write these rows directly could
-- register a key nobody ever proved they held, or freeze the counter to defeat
-- clone detection. Both writes go through the service role in
-- app/api/wallet/passkey/*, after verification.
--
-- The absence of a policy is the control: with RLS on, no policy means no
-- access.

comment on table public.wallet_passkeys is
  'WebAuthn public keys for wallet unlock. No biometric data — the sensor never leaves the device.';
