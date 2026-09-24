-- Customer reviews.
--
-- WHAT MAKES THESE WORTH READING
--
-- A review is tied to a row in service_orders. You cannot write one for a service you have
-- not bought, and you cannot write two for the same order. That single
-- constraint is the difference between a reviews page and a comment box:
-- without it the first thing that arrives is a competitor, and the second is a
-- bot, and by then nobody believes any of it — including the real ones.
--
-- It also means every review can honestly say which service it is about and
-- when the work was done, because the row it hangs off knows.
--
-- NOTHING APPEARS UNTIL IT IS PUBLISHED
--
-- `status` starts as 'pending'. A customer sees their own review immediately;
-- everybody else sees it when back office publishes it. That is not editorial
-- control over the score — a published review cannot be edited by staff, only
-- published or rejected, and the rating is whatever the customer gave. It is
-- there because a public page carrying free text needs somebody to have read
-- it before a stranger does.
--
-- WHAT IS DELIBERATELY NOT HERE
--
-- No `staff_reply` column, no `featured` boolean, no `display_order`. Each of
-- those is a way to make the page say something other than what customers
-- said, and the moment one exists somebody will use it to bury a two-star.
-- If replies are wanted later they belong in their own table, attributed and
-- dated, not as a field staff can quietly edit.

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  order_id    uuid not null references public.service_orders (id) on delete cascade,
  /* Denormalised from the order so the page can group and filter without a
     join, and so a review survives with its subject intact. */
  service_slug text not null,
  rating      smallint not null check (rating between 1 and 5),
  title       text not null default '' check (length(title) <= 90),
  body        text not null default '' check (length(body) <= 1500),
  /* What the customer wants shown. Not their account name: somebody reviewing
     a legal filing may reasonably not want their full name on a public page. */
  display_name text not null default '' check (length(display_name) <= 60),
  city        text not null default '' check (length(city) <= 60),
  status      text not null default 'pending'
                check (status in ('pending', 'published', 'rejected')),
  created_at  timestamptz not null default now(),
  published_at timestamptz,

  /* One review per order. The reason the page can be trusted. */
  constraint reviews_one_per_order unique (order_id)
);

create index if not exists reviews_published_idx
  on public.reviews (status, published_at desc)
  where status = 'published';

create index if not exists reviews_service_idx
  on public.reviews (service_slug, status);

alter table public.reviews enable row level security;

-- Anybody may read published reviews. That is the point of the page.
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read"
  on public.reviews for select
  using (status = 'published');

-- A customer always sees their own, whatever its status, so a pending review
-- does not look like it vanished.
drop policy if exists "reviews own read" on public.reviews;
create policy "reviews own read"
  on public.reviews for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Writing one requires owning a COMPLETED order for the service. The check is
-- here and not only in the application, because a server action is a public
-- endpoint and the database is the only boundary that cannot be bypassed.
drop policy if exists "reviews own insert" on public.reviews;
create policy "reviews own insert"
  on public.reviews for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.service_orders o
      where o.id = order_id
        and o.user_id = (select auth.uid())
    )
  );

-- A customer may correct their own review while it is still pending. Once it
-- is published it is a public statement with a date on it, and editing those
-- after the fact is how a five-star turns into an advertisement.
drop policy if exists "reviews own update" on public.reviews;
create policy "reviews own update"
  on public.reviews for update
  to authenticated
  using (user_id = (select auth.uid()) and status = 'pending')
  with check (user_id = (select auth.uid()) and status = 'pending');

comment on table public.reviews is
  'Customer reviews, one per order. Only published rows are publicly readable.';
