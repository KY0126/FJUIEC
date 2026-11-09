-- 歐洲旅人護照 App 原型｜第 2 版新增：旅伴、通知、點數明細
-- 接在 schema.sql 之後執行（可重複執行）

-- ========== 旅伴：a 邀請 b，b 完成測驗後由 join_buddy() 建立 ==========
create table if not exists public.buddies (
  id bigint generated always as identity primary key,
  a uuid not null references public.customers(id) on delete cascade,
  b uuid not null references public.customers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (a, b),
  check (a <> b)
);
create index if not exists buddies_b on public.buddies (b);

-- ========== 通知：顧問回覆、旅伴、優惠與禮遇 ==========
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.customers(id) on delete cascade,
  kind text not null check (kind in ('advisor','buddy','perk','system')),
  title text not null,
  body text,
  link text,                         -- App 內路徑，例：#/buddy
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notif_customer on public.notifications (customer_id, created_at desc);

-- ========== 點數明細：每個 reason 只能領一次 ==========
create table if not exists public.point_ledger (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.customers(id) on delete cascade,
  reason text not null,              -- card_a…card_e、buddy:<id>、trip:<訂單>
  label text not null,
  points int not null check (points between -100000 and 100000),
  status text not null default 'posted' check (status in ('posted','pending')),
  created_at timestamptz not null default now(),
  unique (customer_id, reason)
);

alter table public.buddies enable row level security;
alter table public.notifications enable row level security;
alter table public.point_ledger enable row level security;

-- 旅伴：本人只能看自己那幾筆配對；新增一律走 join_buddy()
drop policy if exists bud_own on public.buddies;
create policy bud_own on public.buddies for select
  using (a in (select id from public.customers where user_id = (select auth.uid()))
      or b in (select id from public.customers where user_id = (select auth.uid())));
drop policy if exists bud_advisor on public.buddies;
create policy bud_advisor on public.buddies for select using ((select public.staff_role()) = 'advisor');

-- 通知：本人讀取、標記已讀；顧問可新增與讀取（顧問回覆）
drop policy if exists notif_own_read on public.notifications;
create policy notif_own_read on public.notifications for select
  using (customer_id in (select id from public.customers where user_id = (select auth.uid())));
drop policy if exists notif_own_update on public.notifications;
create policy notif_own_update on public.notifications for update
  using (customer_id in (select id from public.customers where user_id = (select auth.uid())))
  with check (customer_id in (select id from public.customers where user_id = (select auth.uid())));
drop policy if exists notif_advisor on public.notifications;
create policy notif_advisor on public.notifications for all using ((select public.staff_role()) = 'advisor');

-- 點數：本人讀取；本人只能新增檔案卡點數（每張最多 100 點）；其他點數由後台或函式寫入
drop policy if exists pts_own_read on public.point_ledger;
create policy pts_own_read on public.point_ledger for select
  using (customer_id in (select id from public.customers where user_id = (select auth.uid())));
drop policy if exists pts_own_card on public.point_ledger;
create policy pts_own_card on public.point_ledger for insert
  with check (customer_id in (select id from public.customers where user_id = (select auth.uid()))
              and reason in ('card_a','card_b','card_c','card_d','card_e')
              and points between 0 and 100 and status = 'posted');
drop policy if exists pts_advisor on public.point_ledger;
create policy pts_advisor on public.point_ledger for all using ((select public.staff_role()) = 'advisor');

-- 被邀請的人完成測驗後呼叫：建立配對、通知邀請人、雙方各得 100 點
create or replace function public.join_buddy(p_code text)
returns table (nickname text, role_key text)
language plpgsql security definer set search_path = public as $$
declare me public.customers; inv public.customers;
begin
  select * into me from customers where user_id = auth.uid();
  select * into inv from customers where code = upper(p_code);
  if me.id is null or inv.id is null or me.id = inv.id then return; end if;
  if not exists (select 1 from buddies where (a = inv.id and b = me.id) or (a = me.id and b = inv.id)) then
    insert into buddies (a, b) values (inv.id, me.id);
    insert into notifications (customer_id, kind, title, body, link)
      values (inv.id, 'buddy', '旅伴完成測驗',
              coalesce(me.nickname, '你的旅伴') || ' 完成測驗了，看看你們都適合的 3 團。', '#/buddy');
    insert into point_ledger (customer_id, reason, label, points)
      values (inv.id, 'buddy:' || me.id, '旅伴完成測驗', 100), (me.id, 'buddy:' || inv.id, '和旅伴一起測', 100)
      on conflict do nothing;
  end if;
  return query select inv.nickname, inv.role_key;
end $$;

-- 讀取我的旅伴（只回傳推薦需要的欄位：暱稱、角色、測驗答案、檔案 A–C）
create or replace function public.my_buddies()
returns table (buddy_id uuid, nickname text, role_key text, answers jsonb, card_a jsonb, card_b jsonb, card_c jsonb, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  with me as (select id from customers where user_id = auth.uid()),
  pairs as (
    select case when bd.a = me.id then bd.b else bd.a end as other, bd.created_at
    from buddies bd, me where bd.a = me.id or bd.b = me.id)
  select c.id, c.nickname, c.role_key, c.answers, p.card_a, p.card_b, p.card_c, pairs.created_at
  from pairs join customers c on c.id = pairs.other left join profiles p on p.customer_id = c.id
  order by pairs.created_at desc
$$;

revoke execute on function public.join_buddy(text), public.my_buddies() from public, anon;
grant execute on function public.join_buddy(text), public.my_buddies() to authenticated;

do $$ begin
  begin alter publication supabase_realtime add table public.notifications; exception when others then null; end;
end $$;
