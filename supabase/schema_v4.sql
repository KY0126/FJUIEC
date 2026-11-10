-- 歐洲旅人護照 App 原型｜第 4 版：旅伴投票、揪團、自我介紹
-- 接在 schema_v3.sql 之後執行（可重複執行）

alter table public.profiles add column if not exists intro jsonb;   -- 自我介紹：{tone, tags, text, custom, vis}

-- 三選一投票：發起人丟 2–3 團，旅伴按「想去 2／可以 1／不行 0」，並勾可以出發的月份
create table if not exists public.buddy_polls (
  id bigint generated always as identity primary key,
  code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  owner uuid not null references public.customers(id) on delete cascade,
  trips text[] not null check (array_length(trips, 1) between 2 and 3),
  created_at timestamptz not null default now()
);
create table if not exists public.poll_votes (
  poll_id bigint not null references public.buddy_polls(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  votes int[] not null,
  months int[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (poll_id, customer_id)
);

-- 揪團：選一團和出發月份，目標 2–6 人；App 只收「想一起報」的意願，名額與報名由顧問確認
create table if not exists public.trip_groups (
  id bigint generated always as identity primary key,
  code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  owner uuid not null references public.customers(id) on delete cascade,
  trip_name text not null,
  depart text,
  target int not null default 2 check (target between 2 and 6),
  deadline date not null default (current_date + 7),
  status text not null default 'open' check (status in ('open','full','sent')),
  created_at timestamptz not null default now()
);
create table if not exists public.trip_group_members (
  group_id bigint not null references public.trip_groups(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, customer_id)
);

alter table public.buddy_polls enable row level security;
alter table public.poll_votes enable row level security;
alter table public.trip_groups enable row level security;
alter table public.trip_group_members enable row level security;

-- 直接讀表只限本人與顧問；其他人一律透過下面的函式、而且要知道 6 碼代碼
drop policy if exists polls_own on public.buddy_polls;
create policy polls_own on public.buddy_polls for select using (owner in (select id from public.customers where user_id = (select auth.uid())));
drop policy if exists votes_own on public.poll_votes;
create policy votes_own on public.poll_votes for select using (customer_id in (select id from public.customers where user_id = (select auth.uid())));
drop policy if exists groups_own on public.trip_groups;
create policy groups_own on public.trip_groups for select using (owner in (select id from public.customers where user_id = (select auth.uid())));
drop policy if exists gm_own on public.trip_group_members;
create policy gm_own on public.trip_group_members for select using (customer_id in (select id from public.customers where user_id = (select auth.uid())));
drop policy if exists polls_adv on public.buddy_polls;
create policy polls_adv on public.buddy_polls for select using ((select public.staff_role()) = 'advisor');
drop policy if exists groups_adv on public.trip_groups;
create policy groups_adv on public.trip_groups for select using ((select public.staff_role()) = 'advisor');
drop policy if exists gm_adv on public.trip_group_members;
create policy gm_adv on public.trip_group_members for select using ((select public.staff_role()) = 'advisor');

create or replace function public.me_id() returns uuid language sql stable security definer set search_path = public as $$
  select id from customers where user_id = auth.uid() $$;

create or replace function public.create_poll(p_trips text[]) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := me_id(); c text;
begin
  if me is null or array_length(p_trips, 1) not between 2 and 3 then return null; end if;
  insert into buddy_polls (owner, trips) values (me, p_trips) returning code into c;
  return c;
end $$;

create or replace function public.vote_poll(p_code text, p_votes int[], p_months int[]) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := me_id(); p buddy_polls; first boolean;
begin
  select * into p from buddy_polls where code = upper(p_code);
  if me is null or p.id is null or array_length(p_votes, 1) <> array_length(p.trips, 1) then return; end if;
  first := not exists (select 1 from poll_votes where poll_id = p.id and customer_id = me);
  insert into poll_votes (poll_id, customer_id, votes, months) values (p.id, me, p_votes, coalesce(p_months, '{}'))
    on conflict (poll_id, customer_id) do update set votes = excluded.votes, months = excluded.months, updated_at = now();
  if first and me <> p.owner then
    insert into notifications (customer_id, kind, title, body, link)
      select p.owner, 'buddy', '旅伴投票了', coalesce(nickname, '你的旅伴') || ' 在你發起的投票選好了', '#/buddy' from customers where id = me;
  end if;
end $$;

create or replace function public.get_poll(p_code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('code', p.code, 'trips', p.trips, 'mine', p.owner = me_id(),
    'owner', (select coalesce(nickname, '旅伴') from customers where id = p.owner),
    'votes', coalesce((select jsonb_agg(jsonb_build_object('nick', coalesce(c.nickname, '旅伴'), 'role', c.role_key, 'votes', v.votes, 'months', v.months, 'me', v.customer_id = me_id()) order by v.updated_at)
                        from poll_votes v join customers c on c.id = v.customer_id where v.poll_id = p.id), '[]'::jsonb))
  from buddy_polls p where p.code = upper(p_code) $$;

create or replace function public.create_group(p_trip text, p_depart text, p_target int) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := me_id(); g trip_groups;
begin
  if me is null or p_target not between 2 and 6 then return null; end if;
  insert into trip_groups (owner, trip_name, depart, target) values (me, p_trip, p_depart, p_target) returning * into g;
  insert into trip_group_members (group_id, customer_id) values (g.id, me);
  return g.code;
end $$;

create or replace function public.join_group(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := me_id(); g trip_groups; n int;
begin
  select * into g from trip_groups where code = upper(p_code);
  if me is null or g.id is null then return 'notfound'; end if;
  if exists (select 1 from trip_group_members where group_id = g.id and customer_id = me) then return 'already'; end if;
  if g.status <> 'open' or g.deadline < current_date then return 'closed'; end if;
  insert into trip_group_members (group_id, customer_id) values (g.id, me);
  insert into notifications (customer_id, kind, title, body, link)
    select g.owner, 'buddy', '有人加入你的揪團', coalesce(nickname, '你的旅伴') || ' 加入「' || split_part(g.trip_name, '｜', 1) || '」揪團', '#/buddy' from customers where id = me;
  select count(*) into n from trip_group_members where group_id = g.id;
  if n >= g.target then
    update trip_groups set status = 'full' where id = g.id;
    insert into point_ledger (customer_id, reason, label, points)
      select customer_id, 'group:' || g.id, '揪團成功', 100 from trip_group_members where group_id = g.id on conflict do nothing;
    insert into notifications (customer_id, kind, title, body, link)
      select customer_id, 'perk', '揪團成功 +100 點', split_part(g.trip_name, '｜', 1) || ' 已湊滿 ' || n || ' 人，顧問會確認名額', '#/buddy' from trip_group_members where group_id = g.id;
  end if;
  return 'ok';
end $$;

create or replace function public.get_group(p_code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('code', g.code, 'trip', g.trip_name, 'depart', g.depart, 'target', g.target, 'deadline', g.deadline, 'status', g.status,
    'mine', g.owner = me_id(), 'owner', (select coalesce(nickname, '旅伴') from customers where id = g.owner),
    'members', coalesce((select jsonb_agg(jsonb_build_object('nick', coalesce(c.nickname, '旅伴'), 'role', c.role_key, 'me', m.customer_id = me_id()) order by m.joined_at)
                          from trip_group_members m join customers c on c.id = m.customer_id where m.group_id = g.id), '[]'::jsonb))
  from trip_groups g where g.code = upper(p_code) $$;

-- 揪團湊滿後，發起人把意願送給顧問（不收錢、不佔位）
create or replace function public.send_group(p_code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := me_id(); g trip_groups; n int;
begin
  select * into g from trip_groups where code = upper(p_code) and owner = me;
  if g.id is null then return false; end if;
  select count(*) into n from trip_group_members where group_id = g.id;
  insert into inquiries (customer_id, trip_name) values (me, g.trip_name || '（揪團 ' || g.code || '，' || n || ' 人，' || coalesce(g.depart, '月份未定') || '）');
  update trip_groups set status = 'sent' where id = g.id;
  return true;
end $$;

revoke execute on function public.me_id(), public.create_poll(text[]), public.vote_poll(text, int[], int[]), public.get_poll(text),
  public.create_group(text, text, int), public.join_group(text), public.get_group(text), public.send_group(text) from public, anon;
grant execute on function public.me_id(), public.create_poll(text[]), public.vote_poll(text, int[], int[]), public.get_poll(text),
  public.create_group(text, text, int), public.join_group(text), public.get_group(text), public.send_group(text) to authenticated;
