-- ChemWordle migration 修補
-- 起因:原 migrate-to-email-model.sql 使用了 PostgreSQL 不支援的
--       `add constraint if not exists` 語法,導致整段 SQL 在那一行 abort,
--       後續的 constraint 與 trigger 重寫沒跑到 → 註冊報「Database error saving new user」
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。idempotent,可重複執行。

-- ───────────────────────────────────────────
-- 1) 補上唯一約束(用 drop+add 達成 idempotent)
-- ───────────────────────────────────────────
alter table public.students drop constraint if exists students_email_unique;
alter table public.students add constraint students_email_unique unique (email);

-- ───────────────────────────────────────────
-- 2) 補上 check constraints
-- ───────────────────────────────────────────
alter table public.students drop constraint if exists students_role_category_check;
alter table public.students add constraint students_role_category_check
  check (role_category in ('undergrad', 'master', 'phd', 'staff'));

alter table public.students drop constraint if exists students_year_tag_check;
alter table public.students add constraint students_year_tag_check
  check (year_tag is null or year_tag in ('化一', '化二', '化三', '化四'));

alter table public.students drop constraint if exists students_class_tag_check;
alter table public.students add constraint students_class_tag_check
  check (class_tag is null or class_tag in ('甲', '乙'));

-- ───────────────────────────────────────────
-- 3) 重新安裝 trigger function(CREATE OR REPLACE 是 idempotent)
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
  v_name := nullif(trim(new.raw_user_meta_data->>'name'), '');
  v_email := lower(new.email);
  v_role_category := new.raw_user_meta_data->>'role_category';
  v_year_tag := nullif(trim(new.raw_user_meta_data->>'year_tag'), '');
  v_class_tag := nullif(trim(new.raw_user_meta_data->>'class_tag'), '');
  v_student_id := nullif(trim(new.raw_user_meta_data->>'student_id'), '');

  if v_name is null or char_length(v_name) < 2 then
    raise exception 'INVALID_NAME';
  end if;

  if v_role_category is null
     or v_role_category not in ('undergrad', 'master', 'phd', 'staff') then
    raise exception 'INVALID_ROLE_CATEGORY';
  end if;

  if v_role_category = 'undergrad' then
    if v_year_tag is null or v_year_tag not in ('化一', '化二', '化三', '化四') then
      raise exception 'INVALID_YEAR_TAG';
    end if;
    if v_class_tag is null or v_class_tag not in ('甲', '乙') then
      raise exception 'INVALID_CLASS_TAG';
    end if;
    v_class_name := v_year_tag || v_class_tag;
  else
    v_year_tag := null;
    v_class_tag := null;
    v_class_name := case v_role_category
                      when 'master' then '碩士'
                      when 'phd'    then '博士'
                      when 'staff'  then '教職員'
                    end;
  end if;

  v_role := case when v_role_category = 'staff' then 'teacher' else 'student' end;

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

-- ───────────────────────────────────────────
-- 4) 重新綁 trigger
-- ───────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────────────────────
-- 5) 驗證:確認 students 欄位齊全
-- ───────────────────────────────────────────
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'students'
order by ordinal_position;
-- 預期看到:id / student_id (nullable) / name / role / class_name /
--          email / role_category / year_tag / class_tag / created_at / updated_at

-- ───────────────────────────────────────────
-- 6) 驗證:trigger 存在
-- ───────────────────────────────────────────
select tgname, tgrelid::regclass
from pg_trigger
where tgname = 'on_auth_user_created';
-- 預期一列:on_auth_user_created | auth.users
