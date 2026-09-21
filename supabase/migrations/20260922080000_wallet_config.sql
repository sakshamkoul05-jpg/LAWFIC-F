-- wallet_config: the card holder's appearance, kept per customer.
--
-- WHY THIS EXISTS NOW
--
-- The wallet's finish, colour, stamping, stitch and note style were held in
-- localStorage on purpose while the object was still being redesigned — see
-- components/wallet/useWalletConfig.ts, which said the shape settles first and
-- the schema follows. The shape has not moved since 2026-09-07, and the cost of
-- waiting is that a customer's wallet silently returns to the factory finish
-- (leather / walnut / blind / tonal / classic) on every new device, every
-- private window and every cleared cache. The wallet page promises "sign in to
-- keep the material, colour and engraving you choose". These columns are what
-- makes that true.
--
-- These sit on wallet_prefs rather than in a table of their own: it is already
-- one cosmetic row per user, already owner-scoped by RLS, and already read by
-- the wallet page in the same query. A second table would be a second join for
-- no separation that means anything.
--
-- The engraving is NOT here. It goes on living in `nameplate`, which is the one
-- field whose meaning survived the redesign intact.
--
-- WHY `wallet_finish` AND NOT `finish`
--
-- wallet_prefs already HAS a `finish` column, left over from the card model
-- that the wallet replaced — every existing row holds 'matte', a surface
-- treatment for a plastic card face. Reusing it would mean writing 'leather'
-- into a column whose card-era CHECK constraint, if it still carries one, is
-- not knowable from source: the table was created outside these migrations.
-- That fails the whole upsert with 23514 and loses the customer's choices. The
-- retired column is left untouched and unread, exactly as `card_type` is.
--
-- `stitch` rather than `thread` for the same reason: `thread` is the retired
-- bifold's stitching, still read by the customise screen.
--
-- NO CHECK CONSTRAINTS, DELIBERATELY
--
-- Every value is validated on the way in and on the way out by
-- lib/wallet3d/config.ts, which falls back to the default when it does not
-- recognise one. A CHECK listing today's six finishes would turn shipping a
-- seventh into a failed save for every customer who picked it, until a
-- migration caught up — which is exactly the trap card_type set (see the note
-- in app/api/wallet/prefs/route.ts). The length caps bound the storage; the
-- application bounds the meaning.
--
-- Cosmetic only. Nothing here touches a balance, the ledger or an order.
--
-- Apply in the Supabase dashboard SQL editor, or via the CLI.

alter table public.wallet_prefs
  add column if not exists wallet_finish text not null default 'leather',
  add column if not exists finish_color text not null default 'walnut',
  add column if not exists emboss       text not null default 'blind',
  add column if not exists stitch       text not null default 'tonal',
  add column if not exists note_style   text not null default 'classic';

-- Bound the storage without pinning the vocabulary.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'wallet_prefs_config_length'
  ) then
    alter table public.wallet_prefs
      add constraint wallet_prefs_config_length check (
        length(wallet_finish) <= 32
        and length(finish_color) <= 32
        and length(emboss) <= 32
        and length(stitch) <= 32
        and length(note_style) <= 32
      );
  end if;
end $$;

comment on column public.wallet_prefs.wallet_finish is 'Material family: see FINISHES in lib/wallet3d/finishes.ts. Named wallet_finish because `finish` is the retired card column.';
comment on column public.wallet_prefs.finish_color is 'Colour within that finish. Each finish carries its own short list.';
comment on column public.wallet_prefs.emboss       is 'Blind or foiled stamping: see EMBOSS.';
comment on column public.wallet_prefs.stitch       is 'Stitching colour: see THREADS. Named stitch because `thread` is the retired bifold column.';
comment on column public.wallet_prefs.note_style   is 'How the LAWFIC Credits inside are printed: see NOTE_STYLES.';

-- RLS is already on the table and already scoped to the owner by the policies
-- in 000_wallet_prefs.sql. New columns inherit them; nothing to add.
