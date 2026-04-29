-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle: 碩士 → 碩士班、博士 → 博士班(顯示文字一致化)
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。可重跑(idempotent)。
-- ═══════════════════════════════════════════════════════════════════

-- 1) 更新已存在的 students 紀錄
update public.students set class_name = '碩士班' where class_name = '碩士';
update public.students set class_name = '博士班' where class_name = '博士';

-- 2) 改寫 handle_new_user trigger(把 class_name case 改成班字尾)
--    其餘邏輯與 per-user-queue.sql 完全一致
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
                      when 'master' then '碩士班'  -- 🆕 was '碩士'
                      when 'phd'    then '博士班'  -- 🆕 was '博士'
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

  -- 自動洗第一輪 queue(per-user 設計)
  perform public.shuffle_round_for_student(new.id);

  return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 3) 驗證
select class_name, count(*) as count
from public.students
group by class_name
order by class_name;
-- 預期不再有「碩士」「博士」單字,改成「碩士班」「博士班」
