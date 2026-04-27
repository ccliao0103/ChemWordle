-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle 重大遷移:從「學號推 email」改成「自由 email + 身分分類」
--
-- ⚠️ 這會清掉所有 pilot 資料!請確認 attempts / guess_sessions 裡
--    的測試帳號都不需要保留才跑。
--
-- 執行步驟(建議順序):
--   1. 先跑本檔(清表 + schema + trigger)← 這一段
--   2. 去 Supabase Dashboard → Authentication → Users,全選 → Delete
--      (SQL 清不掉 auth.users,要透過 Dashboard)
--   3. 給我 get_monthly_leaderboard 的現有 SQL,我改好後你再跑
--   4. 重新註冊,第一個帳號手動改 role = 'admin'
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────
-- 1) 清空 pilot 資料(保留 daily_puzzles 和字典!)
-- ───────────────────────────────────────────
-- 依賴順序:attempts / guess_sessions 依 students,所以先清這兩個
truncate public.attempts restart identity cascade;
truncate public.guess_sessions restart identity cascade;
-- students 留空(auth.users 清了,這邊也要空)
delete from public.students;

-- 確認:daily_puzzles 和 valid_words 不被清
-- (若不小心清了要重跑 seed-words.sql)
select 'daily_puzzles' as t, count(*) as remaining from public.daily_puzzles
union all select 'valid_words', count(*) from public.valid_words;
-- 預期:daily_puzzles 7 (or whatever you have), valid_words 15232


-- ───────────────────────────────────────────
-- 2) students 表 schema 變更
-- ───────────────────────────────────────────
-- 允許 student_id 為 null(改為可選)
alter table public.students
  alter column student_id drop not null;

-- 新欄位
alter table public.students
  add column if not exists email text,
  add column if not exists role_category text,
  add column if not exists year_tag text,
  add column if not exists class_tag text;

-- 唯一限制(email 不可重複)
alter table public.students
  add constraint if not exists students_email_unique unique (email);

-- 分類檢查
alter table public.students
  drop constraint if exists students_role_category_check;
alter table public.students
  add constraint students_role_category_check
    check (role_category in ('undergrad', 'master', 'phd', 'staff'));

-- year_tag 檢查(僅 undergrad 有值)
alter table public.students
  drop constraint if exists students_year_tag_check;
alter table public.students
  add constraint students_year_tag_check
    check (year_tag is null or year_tag in ('化一', '化二', '化三', '化四'));

-- class_tag 檢查
alter table public.students
  drop constraint if exists students_class_tag_check;
alter table public.students
  add constraint students_class_tag_check
    check (class_tag is null or class_tag in ('甲', '乙'));

-- class_name 邏輯保留(用作顯示 tag),下面 trigger 自動計算填入


-- ───────────────────────────────────────────
-- 3) 重寫 handle_new_user trigger function
-- ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_name text;
  v_email text;
  v_role_category text;
  v_year_tag text;
  v_class_tag text;
  v_student_id text;
  v_class_name text;
  v_role text;
begin
  -- 讀 auth metadata
  v_name := nullif(trim(new.raw_user_meta_data->>'name'), '');
  v_email := lower(new.email);
  v_role_category := new.raw_user_meta_data->>'role_category';
  v_year_tag := nullif(trim(new.raw_user_meta_data->>'year_tag'), '');
  v_class_tag := nullif(trim(new.raw_user_meta_data->>'class_tag'), '');
  v_student_id := nullif(trim(new.raw_user_meta_data->>'student_id'), '');

  -- 驗證:姓名
  if v_name is null or char_length(v_name) < 2 then
    raise exception 'INVALID_NAME';
  end if;

  -- 驗證:role_category
  if v_role_category is null
     or v_role_category not in ('undergrad', 'master', 'phd', 'staff') then
    raise exception 'INVALID_ROLE_CATEGORY';
  end if;

  -- undergrad 必須要有年級+班別
  if v_role_category = 'undergrad' then
    if v_year_tag is null or v_year_tag not in ('化一', '化二', '化三', '化四') then
      raise exception 'INVALID_YEAR_TAG';
    end if;
    if v_class_tag is null or v_class_tag not in ('甲', '乙') then
      raise exception 'INVALID_CLASS_TAG';
    end if;
    v_class_name := v_year_tag || v_class_tag;  -- 「化三甲」
  else
    -- 非 undergrad:year/class 不能填
    v_year_tag := null;
    v_class_tag := null;
    v_class_name := case v_role_category
                      when 'master' then '碩士'
                      when 'phd'    then '博士'
                      when 'staff'  then '教職員'
                    end;
  end if;

  -- role:staff → teacher,其餘 → student;admin 手動設
  v_role := case when v_role_category = 'staff' then 'teacher' else 'student' end;

  -- 寫入(student_id 可選,填什麼就什麼)
  insert into public.students (
    id, email, name, role, role_category,
    year_tag, class_tag, class_name, student_id,
    created_at, updated_at
  ) values (
    new.id, v_email, v_name, v_role, v_role_category,
    v_year_tag, v_class_tag, v_class_name, v_student_id,
    now(), now()
  );

  return new;
end;
$function$;

-- 確保 trigger 綁定
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ───────────────────────────────────────────
-- 4) 驗證
-- ───────────────────────────────────────────
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'students'
order by ordinal_position;

-- 預期會看到(順序可能不同):
--   id, student_id(nullable), name, role, class_name, email, role_category,
--   year_tag, class_tag, created_at, updated_at
