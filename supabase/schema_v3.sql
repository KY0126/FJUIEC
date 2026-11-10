-- 歐洲旅人護照 App 原型｜第 3 版：會員頁與設定
-- 接在 schema_v2.sql 之後執行（可重複執行）

alter table public.customers add column if not exists avatar_key text
  check (avatar_key in ('rabbit','queen','cat','hatter','alice'));        -- 會員頭像（只能選角色頭像，不收照片）
alter table public.customers add column if not exists region text
  check (region in ('北部','中部','南部','東部','離島'));                  -- 居住地區（選填，用來通知說明會、找門市）
alter table public.customers add column if not exists prefs jsonb not null default '{}'::jsonb; -- 通知分類、勿擾時段、預設篩選
alter table public.customers add column if not exists consent_withdrawn_at timestamptz;          -- 撤回同意的時間

-- 旅客可以改自己的暱稱、頭像、地區、偏好與測驗結果，但不能自己改出團次數、NES 分群、交接代碼與示意標記
create or replace function public.guard_customer_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and public.staff_role() is null then   -- 只限制從 App 來的旅客；後台 SQL 與顧問不受影響
    new.code := old.code; new.trips_taken := old.trips_taken; new.last_trip_at := old.last_trip_at;
    new.nes := old.nes; new.is_demo := old.is_demo; new.user_id := old.user_id; new.consent_at := old.consent_at;
  end if;
  return new;
end $$;
revoke execute on function public.guard_customer_update() from public, anon, authenticated;
drop trigger if exists guard_customer_update on public.customers;
create trigger guard_customer_update before update on public.customers
  for each row execute function public.guard_customer_update();
