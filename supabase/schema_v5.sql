-- 歐洲旅人護照 App 原型｜第 5 版：請假試算
-- 接在 schema_v4.sql 之後執行（可重複執行）
-- 請假條件存在 profiles.card_a->'leave'：{who, left, max, busy[], rest, at}；不記到職日與公司

-- 請假提醒：正式版由永信 LINE 官方帳號在 remind_on 推播
create table if not exists public.leave_reminders (
  customer_id uuid not null references public.customers(id) on delete cascade,
  trip_name text not null,
  depart_on date not null,
  remind_on date not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (customer_id, trip_name)
);
alter table public.leave_reminders enable row level security;
drop policy if exists lr_own on public.leave_reminders;
create policy lr_own on public.leave_reminders for all
  using (customer_id in (select id from public.customers where user_id = (select auth.uid())))
  with check (customer_id in (select id from public.customers where user_id = (select auth.uid())));
drop policy if exists lr_adv on public.leave_reminders;
create policy lr_adv on public.leave_reminders for select using ((select public.staff_role()) = 'advisor');

-- 旅伴看不到「剩幾天特休」：my_buddies 回傳的出發條件拿掉 leave.left
create or replace function public.my_buddies()
returns table (buddy_id uuid, nickname text, role_key text, answers jsonb, card_a jsonb, card_b jsonb, card_c jsonb, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  with me as (select id from customers where user_id = auth.uid()),
  pairs as (
    select case when bd.a = me.id then bd.b else bd.a end as other, bd.created_at
    from buddies bd, me where bd.a = me.id or bd.b = me.id)
  select c.id, c.nickname, c.role_key, c.answers,
         case when p.card_a ? 'leave' then jsonb_set(p.card_a, '{leave}', (p.card_a->'leave') - 'left') else p.card_a end,
         p.card_b, p.card_c, pairs.created_at
  from pairs join customers c on c.id = pairs.other left join profiles p on p.customer_id = c.id
  order by pairs.created_at desc
$$;

-- 一群人（投票者或揪團成員，不含自己）的請假條件彙總：最嚴的上限、不方便月份聯集；不回傳個人數字
create or replace function public.leave_agg(p_ids uuid[]) returns jsonb
language sql stable security definer set search_path = public as $$
  with l as (select p.card_a->'leave' as v from profiles p where p.customer_id = any(p_ids) and p.customer_id <> me_id() and p.card_a ? 'leave')
  select case when count(*) = 0 then null else jsonb_build_object(
    'n', count(*),
    'who', case when count(distinct v->>'who') = 1 then min(v->>'who') else 'work' end,
    'max', min((v->>'max')::numeric),
    'busy', coalesce((select jsonb_agg(distinct m) from l l2, jsonb_array_elements(coalesce(l2.v->'busy','[]'::jsonb)) m), '[]'::jsonb),
    'rest', bool_or(coalesce((v->>'rest')::boolean, false))) end
  from l $$;
revoke execute on function public.leave_agg(uuid[]) from public, anon, authenticated;

create or replace function public.get_poll(p_code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('code', p.code, 'trips', p.trips, 'mine', p.owner = me_id(),
    'owner', (select coalesce(nickname, '旅伴') from customers where id = p.owner),
    'votes', coalesce((select jsonb_agg(jsonb_build_object('nick', coalesce(c.nickname, '旅伴'), 'role', c.role_key, 'votes', v.votes, 'months', v.months, 'me', v.customer_id = me_id()) order by v.updated_at)
                        from poll_votes v join customers c on c.id = v.customer_id where v.poll_id = p.id), '[]'::jsonb),
    'leave', leave_agg(array(select customer_id from poll_votes where poll_id = p.id union select p.owner)))
  from buddy_polls p where p.code = upper(p_code) $$;

create or replace function public.get_group(p_code text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('code', g.code, 'trip', g.trip_name, 'depart', g.depart, 'target', g.target, 'deadline', g.deadline, 'status', g.status,
    'mine', g.owner = me_id(), 'owner', (select coalesce(nickname, '旅伴') from customers where id = g.owner),
    'members', coalesce((select jsonb_agg(jsonb_build_object('nick', coalesce(c.nickname, '旅伴'), 'role', c.role_key, 'me', m.customer_id = me_id()) order by m.joined_at)
                          from trip_group_members m join customers c on c.id = m.customer_id where m.group_id = g.id), '[]'::jsonb),
    'leave', leave_agg(array(select customer_id from trip_group_members where group_id = g.id)))
  from trip_groups g where g.code = upper(p_code) $$;

revoke execute on function public.my_buddies(), public.get_poll(text), public.get_group(text) from public, anon;
grant execute on function public.my_buddies(), public.get_poll(text), public.get_group(text) to authenticated;
