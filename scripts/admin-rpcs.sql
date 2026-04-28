-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle Admin Dashboard RPCs
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。可重跑。
-- 安全:兩個 RPC 都檢查 caller 的 students.role = 'admin',否則回
--       {"error": "forbidden"}。即使被非 admin 學生 console 直接呼叫
--       也擋得住。
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1) 整體統計 ─────────────────────────
create or replace function public.get_admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_role text;
begin
  select role into v_role from public.students where id = auth.uid();
  if v_role is null or v_role <> 'admin' then
    return jsonb_build_object('error', 'forbidden');
  end if;

  return jsonb_build_object(
    'total_users', (select count(*) from public.students),
    'by_role_category', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', cnt) order by cnt desc, label)
      from (
        select
          case role_category
            when 'undergrad' then '大學部'
            when 'master' then '碩士班'
            when 'phd' then '博士班'
            when 'staff' then '教職員'
            else coalesce(role_category, '未分類')
          end as label,
          count(*) as cnt
        from public.students
        group by role_category
      ) t
    ), '[]'::jsonb),
    'by_class', coalesce((
      select jsonb_agg(jsonb_build_object('class_name', class_name, 'count', cnt) order by cnt desc, class_name)
      from (
        select coalesce(class_name, '未設定') as class_name, count(*) as cnt
        from public.students
        group by class_name
      ) t
    ), '[]'::jsonb)
  );
end;
$function$;

grant execute on function public.get_admin_overview() to authenticated;


-- ─── 2) 全部使用者列表(含指定月份分數) ───
create or replace function public.get_admin_user_list(target_month date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_role text;
  v_month date;
begin
  select role into v_role from public.students where id = auth.uid();
  if v_role is null or v_role <> 'admin' then
    return jsonb_build_object('error', 'forbidden');
  end if;

  v_month := date_trunc('month', coalesce(target_month, public.tw_today()))::date;

  return jsonb_build_object(
    'month', v_month,
    'users', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'email', s.email,
          'name', s.name,
          'class_name', s.class_name,
          'role_category', s.role_category,
          'role', s.role,
          'student_id', s.student_id,
          'created_at', s.created_at,
          'attend_days', coalesce(stats.attend_days, 0),
          'solved_count', coalesce(stats.solved_count, 0),
          'failed_count', coalesce(stats.failed_count, 0),
          'total_score', coalesce(stats.total_score, 0),
          'avg_guess_count', stats.avg_guess_count
        )
        order by coalesce(stats.total_score, 0) desc, s.created_at
      )
      from public.students s
      left join (
        select
          student_id,
          count(*) as attend_days,
          count(*) filter (where solved) as solved_count,
          count(*) filter (where not solved) as failed_count,
          sum(score) as total_score,
          round(avg(guess_count)::numeric, 2) as avg_guess_count
        from public.attempts
        where date_trunc('month', puzzle_date)::date = v_month
        group by student_id
      ) stats on stats.student_id = s.id
    ), '[]'::jsonb)
  );
end;
$function$;

grant execute on function public.get_admin_user_list(date) to authenticated;


-- ─── 驗證(以 admin 身份從 SQL Editor 跑會回 forbidden,因為 auth.uid() 是 NULL)──
-- 真實測試要從前端 #/admin 進去
select public.get_admin_overview() as test_overview;
-- 預期:{"error": "forbidden"}(SQL Editor 跑 = 沒登入,正常)
