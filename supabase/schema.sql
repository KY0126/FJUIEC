-- 歐洲旅人護照 App 原型｜Supabase 資料庫結構
-- 在 Supabase 專案的 SQL Editor 整段貼上執行（可重複執行）
-- 旅客：匿名登入，只能讀寫自己的資料；顧問：看全部客人；主管：只看統計檢視表

-- ========== 員工與角色 ==========
create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('advisor','manager')),
  created_at timestamptz not null default now()
);

create or replace function public.staff_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.staff where user_id = auth.uid()
$$;

-- ========== 客人 ==========
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,      -- 匿名登入的身分；示意資料為 null
  code text unique not null default upper(substr(md5(random()::text), 1, 6)), -- 6 碼交接代碼
  nickname text,                                                        -- 選填，不收真實姓名
  role_key text,                                                        -- rabbit / queen / cat / hatter / alice
  role_scores jsonb,                                                    -- 五角色分數
  answers jsonb,                                                        -- 12 題作答
  nes text not null default 'N' check (nes in ('N','E','S')),           -- 新客／既有客／沉睡客
  trips_taken int not null default 0,
  last_trip_at date,
  consent_at timestamptz,                                               -- 同意收集的時間
  is_demo boolean not null default false,
  source text,                                                          -- 例：現場 QR、LINE、官網
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========== 旅人檔案（A–E 卡） ==========
create table if not exists public.profiles (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  card_a jsonb,   -- 出發條件：同行者、可出發月份、天數、預算
  card_b jsonb,   -- 耐受度：怕熱、步行、車程、購物站
  card_c jsonb,   -- 興趣：咖啡甜點、展覽、音樂會、極光、購物時間
  card_d jsonb,   -- 接手偏好：只要 LINE 文字、方便時段
  card_e jsonb,   -- 禮遇：生日月份、禮物類型、驚喜偏好
  card_f jsonb,   -- 報名資料（詢價後）：房型、飲食、寵物與天數
  completion int not null default 0 check (completion between 0 and 100),
  points int not null default 0,
  updated_at timestamptz not null default now()
);

-- ========== 收藏、詢問、顧問註記、行為紀錄 ==========
create table if not exists public.favorites (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.customers(id) on delete cascade,
  trip_name text not null,
  created_at timestamptz not null default now(),
  unique (customer_id, trip_name)
);

create table if not exists public.inquiries (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.customers(id) on delete cascade,
  trip_name text not null,
  status text not null default 'new' check (status in ('new','replied','quoted','won','lost')),
  advisor_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.advisor_notes (
  id bigint generated always as identity primary key,
  customer_id uuid not null references public.customers(id) on delete cascade,
  advisor_id uuid not null default auth.uid() references auth.users(id),
  note text not null,
  next_action text,
  due_on date,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  customer_id uuid references public.customers(id) on delete cascade,
  type text not null,   -- quiz_start, quiz_complete, profile_card, rec_click, favorite, share, inquiry
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_type_time on public.events (type, created_at);
create index if not exists inquiries_status on public.inquiries (status);

-- ========== 權限（RLS） ==========
alter table public.staff enable row level security;
alter table public.customers enable row level security;
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.inquiries enable row level security;
alter table public.advisor_notes enable row level security;
alter table public.events enable row level security;

-- 員工：只能看自己的員工資料
drop policy if exists staff_self on public.staff;
create policy staff_self on public.staff for select using (user_id = auth.uid());

-- 客人：本人讀寫自己那一筆；顧問可讀、可改 NES
drop policy if exists cust_own on public.customers;
create policy cust_own on public.customers for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists cust_advisor_read on public.customers;
create policy cust_advisor_read on public.customers for select using (public.staff_role() = 'advisor');
drop policy if exists cust_advisor_update on public.customers;
create policy cust_advisor_update on public.customers for update using (public.staff_role() = 'advisor');

-- 檔案、收藏：本人讀寫；顧問可讀
drop policy if exists prof_own on public.profiles;
create policy prof_own on public.profiles for all
  using (customer_id in (select id from public.customers where user_id = auth.uid()))
  with check (customer_id in (select id from public.customers where user_id = auth.uid()));
drop policy if exists prof_advisor on public.profiles;
create policy prof_advisor on public.profiles for select using (public.staff_role() = 'advisor');

drop policy if exists fav_own on public.favorites;
create policy fav_own on public.favorites for all
  using (customer_id in (select id from public.customers where user_id = auth.uid()))
  with check (customer_id in (select id from public.customers where user_id = auth.uid()));
drop policy if exists fav_advisor on public.favorites;
create policy fav_advisor on public.favorites for select using (public.staff_role() = 'advisor');

-- 詢問：本人建立與讀取；顧問讀取與更新狀態
drop policy if exists inq_own_read on public.inquiries;
create policy inq_own_read on public.inquiries for select
  using (customer_id in (select id from public.customers where user_id = auth.uid()));
drop policy if exists inq_own_insert on public.inquiries;
create policy inq_own_insert on public.inquiries for insert
  with check (customer_id in (select id from public.customers where user_id = auth.uid()));
drop policy if exists inq_advisor on public.inquiries;
create policy inq_advisor on public.inquiries for all using (public.staff_role() = 'advisor');

-- 顧問註記：只有顧問
drop policy if exists notes_advisor on public.advisor_notes;
create policy notes_advisor on public.advisor_notes for all using (public.staff_role() = 'advisor');

-- 行為紀錄：本人只能新增；不開放讀取明細（主管看統計檢視表）
drop policy if exists ev_insert on public.events;
create policy ev_insert on public.events for insert
  with check (customer_id is null or customer_id in (select id from public.customers where user_id = auth.uid()));

-- ========== 主管端統計（只回傳彙總，不含個人明細） ==========
create or replace function public.mgr_funnel()
returns table (step text, n bigint)
language sql stable security definer set search_path = public as $$
  select * from (
    select '完成測驗'::text, count(*) from customers where role_key is not null
    union all select '建立檔案', count(*) from profiles where completion >= 40
    union all select '詢問行程', count(distinct customer_id) from inquiries
    union all select '已報價', count(distinct customer_id) from inquiries where status in ('quoted','won')
    union all select '成交', count(distinct customer_id) from inquiries where status = 'won'
  ) t
  where public.staff_role() = 'manager'
$$;

create or replace function public.mgr_segments()
returns table (nes text, role_key text, n bigint)
language sql stable security definer set search_path = public as $$
  select nes, role_key, count(*) from customers
  where public.staff_role() = 'manager'
  group by nes, role_key
$$;

create or replace function public.mgr_trips()
returns table (trip_name text, inquiries bigint, won bigint)
language sql stable security definer set search_path = public as $$
  select trip_name, count(*), count(*) filter (where status = 'won') from inquiries
  where public.staff_role() = 'manager'
  group by trip_name order by 2 desc
$$;

-- 顧問用交接代碼找人
create or replace function public.find_by_code(c text)
returns setof public.customers
language sql stable security definer set search_path = public as $$
  select * from customers where code = upper(c) and public.staff_role() = 'advisor'
$$;

-- ========== 即時更新（顧問端清單） ==========
do $$ begin
  begin alter publication supabase_realtime add table public.customers; exception when others then null; end;
  begin alter publication supabase_realtime add table public.inquiries; exception when others then null; end;
end $$;
