-- LAWFIC — the four services that are live.
--
-- Fees are in paise and are the LIST price. The figure a user actually pays is
-- whatever staff quote on their order, because government fees move with state,
-- turnover and category. These values seed the site copy, not the invoice.

insert into public.services
  (slug, name, category, government_fee_paise, professional_fee_paise, turnaround, sort_order)
values
  ('aadhaar',     'Aadhaar Services',          'Identity',      5000,  19900, 'Appointment in 2–4 days', 1),
  ('msme-udyam',  'MSME Udyam Registration',   'Business',         0,  49900, 'Same day',                2),
  ('gst',         'GST Registration',          'Tax',              0, 149900, '7–10 working days',       3),
  ('pan',         'PAN Services',              'Identity',     10700,  29900, 'e-PAN in 48 hours',       4);
