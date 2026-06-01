-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle Admin: 月領獎名單 RPC
--
-- 給後台「下載 CSV」用。回傳指定月份所有有領券的人,前端再依需要
-- 篩成「總名單」或「班別名單(排除前十)」。
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。可重跑。
-- 安全:檢查 caller 的 students.role = 'admin'。
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.get_admin_award_list(target_month date default null)
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
  v_total_days int;
  v_rows jsonb;
begin
  select role into v_role from public.students where id = auth.uid();
  if v_role is null or v_role <> 'admin' then
    return jsonb_build_object('error', 'forbidden');
  end if;

  v_start := date_trunc('month', coalesce(target_month, public.tw_today()))::date;
  v_end := (v_start + interval '1 month' - interval '1 day')::date;
  v_total_days := extract(day from v_end)::int;

  with may_stats as (
    select student_id,
           count(*) as attend_days,
           count(*) filter (where solved) as solved_count,
           sum(score) as total_score,
           avg(guess_count) filter (where solved) as avg_guess
    from public.attempts
    where puzzle_date between v_start and v_end
    group by student_id
  ),
  ranked as (
    select *,
           rank() over (
             order by total_score desc,
                      solved_count desc,
                      coalesce(avg_guess, 99) asc
           ) as olympic_rank
    from may_stats
  ),
  awards as (
    select *,
           (attend_days >= v_total_days) as full_attendance,
           (attend_days >= 20) as participation,
           case
             when olympic_rank between 1 and 10
               then (array[10,6,6,4,3,3,2,2,1,1])[olympic_rank]
             else 0
           end as rank_award
    from ranked
  ),
  totals as (
    select *,
           (case when full_attendance then 2 else 0 end)
             + (case when participation then 1 else 0 end)
             + rank_award as total_coupons
    from awards
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'name',            s.name,
      'class_name',      s.class_name,
      'email',           s.email,
      'attend_days',     t.attend_days,
      'solved_count',    t.solved_count,
      'total_score',     t.total_score,
      'full_attendance', t.full_attendance,
      'participation',   t.participation,
      'olympic_rank',    t.olympic_rank,
      'rank_award',      t.rank_award,
      'total_coupons',   t.total_coupons
    ) order by t.total_coupons desc, t.total_score desc, s.name
  ), '[]'::jsonb)
  into v_rows
  from totals t
  join public.students s on s.id = t.student_id
  where t.total_coupons > 0;

  return jsonb_build_object(
    'month_start', v_start,
    'total_days', v_total_days,
    'rows', v_rows
  );
end;
$function$;

grant execute on function public.get_admin_award_list(date) to authenticated;


-- ─── 驗證 ────────────────────────────────
select 'get_admin_award_list installed' as info;
