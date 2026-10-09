-- Follow-up to 20261009080000_compliance_suite.sql.
--
-- DIR-3 KYC moved from yearly to once every three financial years (due by
-- 30 June of the third) with effect from 31 March 2026. The year depends on
-- each director, so it left the company calendar and became something a
-- customer tracks as a renewal — which needs the new licence kind below.
--
-- Idempotent: safe to run more than once, and safe on a database where the
-- first migration already ran.

alter table public.business_licences
  drop constraint if exists business_licences_kind_check;

alter table public.business_licences
  add constraint business_licences_kind_check
  check (kind in ('fssai', 'trademark', 'dsc', 'trade_licence', 'shop_establishment',
                  'drug_licence', 'iso', 'dir3kyc', 'other'));

-- Reminders already logged for the old yearly DIR-3 KYC item are now
-- meaningless; marks a customer made against it stay, harmlessly.
delete from public.compliance_reminders_sent where item_key like 'DIR3KYC:%';
