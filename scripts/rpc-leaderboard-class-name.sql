-- ChemWordle:更新 get_monthly_leaderboard,把 student_no 改成 class_name
-- 用法:整段複製貼到 Supabase SQL Editor → Run
-- 注意:此 SQL 必須在 migrate-to-email-model.sql 之後跑(students 表要先有 class_name 欄位)

CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard(
  target_month date DEFAULT NULL::date,
  top_n integer DEFAULT 10
)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_month date;
  v_leaderboard jsonb;
  v_my_rank jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  v_month := date_trunc('month', coalesce(target_month, public.tw_today()))::date;

  -- 用 CTE 計算所有人本月統計與排名
  with monthly_stats as (
    select
      a.student_id,
      s.class_name,           -- 🆕 改:從 s.student_id as student_no → s.class_name
      s.name,
      count(*) as attend_days,
      count(*) filter (where a.solved) as solved_count,
      coalesce(sum(a.score), 0) as total_score,
      round(avg(a.guess_count)::numeric, 2) as avg_guess_count
    from public.attempts a
    join public.students s on s.id = a.student_id
    where date_trunc('month', a.puzzle_date)::date = v_month
    group by a.student_id, s.class_name, s.name
  ),
  ranked as (
    select *,
      rank() over (
        order by total_score desc,
                 solved_count desc,
                 avg_guess_count asc
      ) as rank
    from monthly_stats
  )
  -- 取前 N 名
  select jsonb_agg(
    jsonb_build_object(
      'rank', rank,
      'class_name', class_name,    -- 🆕 改:'student_no' → 'class_name'
      'name', name,
      'total_score', total_score,
      'attend_days', attend_days,
      'solved_count', solved_count,
      'avg_guess_count', avg_guess_count
    ) order by rank
  )
  into v_leaderboard
  from ranked
  where rank <= top_n;

  -- 取我的排名(這段沒動)
  with monthly_stats as (
    select
      a.student_id,
      count(*) as attend_days,
      count(*) filter (where a.solved) as solved_count,
      coalesce(sum(a.score), 0) as total_score,
      round(avg(a.guess_count)::numeric, 2) as avg_guess_count
    from public.attempts a
    where date_trunc('month', a.puzzle_date)::date = v_month
    group by a.student_id
  ),
  ranked as (
    select *,
      rank() over (
        order by total_score desc,
                 solved_count desc,
                 avg_guess_count asc
      ) as rank
    from monthly_stats
  )
  select jsonb_build_object(
    'rank', rank,
    'total_score', total_score,
    'attend_days', attend_days,
    'solved_count', solved_count
  )
  into v_my_rank
  from ranked
  where student_id = auth.uid();

  return jsonb_build_object(
    'month', v_month,
    'top', coalesce(v_leaderboard, '[]'::jsonb),
    'my_rank', v_my_rank
  );
end;
$function$;
