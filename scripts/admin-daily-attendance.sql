-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle Admin: 每日使用人數(月曆檢視用)
--
-- 回傳指定月份(預設台灣今天的月份)每天有多少不重複學生完成,以及
-- 其中有多少答對。前端會做成月曆熱圖。
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。可重跑。
-- 安全:檢查 caller 的 students.role = 'admin',否則回 forbidden。
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.get_admin_daily_attendance(target_month date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_role text;
  v_start date;
  v_end date;
begin
  select role into v_role from public.students where id = auth.uid();
  if v_role is null or v_role <> 'admin' then
    return jsonb_build_object('error', 'forbidden');
  end if;

  v_start := date_trunc('month', coalesce(target_month, public.tw_today()))::date;
  v_end   := (v_start + interval '1 month' - interval '1 day')::date;

  return jsonb_build_object(
    'month_start', v_start,
    'month_end', v_end,
    'today', public.tw_today(),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', d,
        'attempt_count', cnt,
        'solved_count', solved_cnt
      ) order by d)
      from (
        select puzzle_date as d,
               count(distinct student_id) as cnt,
               count(distinct student_id) filter (where solved) as solved_cnt
        from public.attempts
        where puzzle_date between v_start and v_end
        group by puzzle_date
      ) t
    ), '[]'::jsonb)
  );
end;
$function$;

grant execute on function public.get_admin_daily_attendance(date) to authenticated;


-- ─── 驗證 ────────────────────────────────
select 'get_admin_daily_attendance installed' as info;
-- 在前端 admin 頁面切月份就會直接呼叫,不用在這測
