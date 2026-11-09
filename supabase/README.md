# Supabase 設定（App 版原型）

1. 建立 Supabase 專案（建議 Tokyo 或 Singapore 區）。
2. Authentication → Sign In / Providers：開啟 **Anonymous sign-ins**（旅客端用）與 Email（顧問、主管用）。
3. SQL Editor 依序執行 `schema.sql`、`seed.sql`（30 位示意客人，`is_demo = true`）。
4. Authentication → Users 建立顧問與主管帳號，再執行：
   ```sql
   insert into public.staff (user_id, display_name, role) values
   ('<顧問 user id>', '示範顧問', 'advisor'),
   ('<主管 user id>', '示範主管', 'manager');
   ```
5. 前端只放 Project URL 與 publishable（anon）key；service_role key 不可放進網頁。

權限：旅客只能讀寫自己的資料；顧問可看全部客人並更新詢問狀態；主管只能呼叫 `mgr_funnel`、`mgr_segments`、`mgr_trips` 取得彙總數字。
