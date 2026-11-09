-- 30 位示意客人（is_demo = true）：新客 14、既有客 9、沉睡客 7；可重複執行
delete from public.customers where is_demo;
select setseed(0.07);

with nick as (
  select n, i from unnest(array['小婷','阿哲','Mia','佳佳','老陳','Kevin','小美','Ivy','阿宏','Sandy','小魚','Eric','Joy','阿德','Nina',
    '小安','Tom','妮妮','阿伯','Grace','小傑','Amy','阿明','Lulu','Ben','小雯','Rita','阿翔','Coco','Leo']) with ordinality as t(n, i)
), base as (
  select i, n,
    (array['rabbit','queen','cat','hatter','alice'])[1 + (i - 1) % 5] as role_key,
    case when i <= 14 then 'N' when i <= 23 then 'E' else 'S' end as nes
  from nick
)
insert into public.customers (id, code, nickname, role_key, role_scores, nes, trips_taken, last_trip_at, consent_at, is_demo, source, created_at)
select
  ('00000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  'D' || lpad(i::text, 5, '0'),
  n, role_key,
  jsonb_build_object('rabbit', round((random()*0.25+0.05)::numeric,2), 'queen', round((random()*0.25+0.05)::numeric,2),
    'cat', round((random()*0.25+0.05)::numeric,2), 'hatter', round((random()*0.25+0.05)::numeric,2), 'alice', round((random()*0.25+0.05)::numeric,2))
    || jsonb_build_object(role_key, 0.45),
  nes,
  case nes when 'N' then 0 else 1 + floor(random()*5)::int end,
  case nes when 'N' then null when 'E' then current_date - (30 + floor(random()*270)::int) else current_date - (380 + floor(random()*520)::int) end,
  now(), true,
  (array['現場 QR','LINE','官網','旅展'])[1 + floor(random()*4)::int],
  now() - make_interval(days => floor(random()*40)::int)
from base;

insert into public.profiles (customer_id, card_a, card_b, card_c, card_d, completion, points)
select c.id,
  jsonb_build_object('companion', (array['自己','另一半','朋友','家人'])[1 + floor(random()*4)::int],
    'months', (array['1–3 月','4–6 月','9–11 月'])[1 + floor(random()*3)::int],
    'days', (array['8–10 天','10–12 天'])[1 + floor(random()*2)::int],
    'budget', (array['8–10 萬','10–13 萬','13–16 萬'])[1 + floor(random()*3)::int]),
  jsonb_build_object('hot', random() < 0.5, 'walk', (array['輕鬆','適中','較多'])[1 + floor(random()*3)::int],
    'maxDrive', (array['3 小時內','4 小時內','不在意'])[1 + floor(random()*3)::int], 'noShop', random() < 0.7),
  jsonb_build_object('interests', jsonb_build_array((array['咖啡與甜點','展覽','音樂會'])[1 + floor(random()*3)::int], (array['極光','購物時間','美食'])[1 + floor(random()*3)::int])),
  jsonb_build_object('contact', (array['只要 LINE 文字','LINE 文字或電話'])[1 + floor(random()*2)::int], 'time', (array['平日晚上','週末','午休'])[1 + floor(random()*3)::int]),
  p.comp, p.comp * 3
from public.customers c
cross join lateral (select case when c.nes = 'N' then (array[0,40,60,80,100])[1 + floor(random()*5)::int] else (array[60,80,100])[1 + floor(random()*3)::int] end as comp) p
where c.is_demo;

insert into public.inquiries (customer_id, trip_name, status, created_at)
select c.id,
  (array['奧捷慢遊 10 天｜維也納與布拉格連泊、兩個自由日','荷比法 10 天｜花季庭園、半日自由的運河城市','葡萄牙慢遊 10 天｜里斯本連泊、海岸小鎮自由日',
    '義大利湖區山城 10 天｜半日導覽、半日巷弄美食','北歐極光 10 天｜玻璃屋兩晚、白天可選活動','經典奧捷 12 天｜音樂會、國王湖、全程中文導覽',
    '希臘愛琴海 10 天｜兩島連泊、海邊留白時光','西班牙建築 11 天｜高第與皇宮全導覽'])[1 + floor(random()*8)::int],
  case when c.nes = 'N' then (array['new','new','replied','quoted'])[1 + floor(random()*4)::int]
       else (array['new','replied','quoted','won','lost'])[1 + floor(random()*5)::int] end,
  c.created_at + interval '1 day'
from public.customers c
where c.is_demo and random() < 0.6;
