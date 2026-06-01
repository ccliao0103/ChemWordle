-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle:月排行擴大到 top 10(新版獎勵規則)
--
-- 新規則(by Olympic rank,並列共享獎品):
--   rank 1     → 10 張
--   rank 2-3   → 6 張   (用 position-table 自動處理:array[10,6,6,...])
--   rank 4     → 4 張
--   rank 5-6   → 3 張
--   rank 7-8   → 2 張
--   rank 9-10  → 1 張
--
-- 套用 position-table 是因為:Olympic rank 對應「該名次佔的最小位置」,
-- 所以 array[10,6,6,4,3,3,2,2,1,1] 中下標 = olympic_rank 直接得獎品數,
-- 完美處理任何並列情況(不需額外 case 分支)。
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1) 更新個人月獎勵試算 RPC ──────────────────
create or replace function public.get_my_monthly_rewards(target_month date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_student_id uuid := auth.uid();
  v_today date := public.tw_today();
  v_start date;
  v_end date;
  v_total_days int;
  v_attend_days int;
  v_solved_count int;
  v_total_score int;
  v_full_attendance boolean;
  v_participation boolean;
  v_top_rank int;
  v_rank_award int;
  v_total_coupons int;
  v_award_table int[] := array[10, 6, 6, 4, 3, 3, 2, 2, 1, 1];
begin
  if v_student_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  v_start := date_trunc('month', coalesce(target_month, v_today))::date;
  v_end := (v_start + interval '1 month' - interval '1 day')::date;
  v_total_days := extract(day from v_end)::int;

  select count(*),
         count(*) filter (where solved),
         coalesce(sum(score), 0)
    into v_attend_days, v_solved_count, v_total_score
    from public.attempts
    where student_id = v_student_id
      and puzzle_date between v_start and v_end;

  v_attend_days  := coalesce(v_attend_days, 0);
  v_solved_count := coalesce(v_solved_count, 0);
  v_total_score  := coalesce(v_total_score, 0);

  v_full_attendance := (v_attend_days >= v_total_days);
  v_participation   := (v_attend_days >= 20);

  select rk into v_top_rank from (
    select student_id,
           rank() over (
             order by sum(score) desc,
                      count(*) filter (where solved) desc,
                      coalesce(avg(guess_count) filter (where solved), 99) asc
           ) as rk
    from public.attempts
    where puzzle_date between v_start and v_end
    group by student_id
  ) t where student_id = v_student_id;

  v_rank_award := case
    when v_top_rank between 1 and 10 then v_award_table[v_top_rank]
    else 0
  end;

  v_total_coupons :=
    (case when v_full_attendance then 2 else 0 end) +
    (case when v_participation   then 1 else 0 end) +
    coalesce(v_rank_award, 0);

  return jsonb_build_object(
    'month', v_start,
    'total_days', v_total_days,
    'attend_days', v_attend_days,
    'solved_count', v_solved_count,
    'total_score', v_total_score,
    'full_attendance', v_full_attendance,
    'participation', v_participation,
    'top_rank', v_top_rank,
    'rank_award', v_rank_award,
    'total_coupons', v_total_coupons
  );
end;
$function$;

grant execute on function public.get_my_monthly_rewards(date) to authenticated;


-- ═══════════════════════════════════════════════════════════════════
-- 📋 查詢 1:總名單(有領券的全部人,按券數由多到少)
-- ═══════════════════════════════════════════════════════════════════
with may_stats as (
  select student_id,
         count(*) as attend_days,
         count(*) filter (where solved) as solved_count,
         sum(score) as total_score,
         avg(guess_count) filter (where solved) as avg_guess
  from public.attempts
  where puzzle_date between '2026-05-01' and '2026-05-31'
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
  select student_id, attend_days, solved_count, total_score, olympic_rank,
         (attend_days >= 31) as full_attendance,
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
           + rank_award                                  as total_coupons
  from awards
)
select
  row_number() over (order by t.total_coupons desc, t.total_score desc, s.name) as "#",
  s.name                       as 姓名,
  s.class_name                 as 班級,
  s.email                      as Email,
  t.attend_days                as 出席,
  t.solved_count               as 答對,
  t.total_score                as 分數,
  case when t.full_attendance then '✓' else '' end as 全勤,
  case when t.participation   then '✓' else '' end as 參加,
  case when t.olympic_rank between 1 and 10 then format('第 %s 名', t.olympic_rank) else '' end as 月排,
  t.rank_award                 as 排名券,
  t.total_coupons              as 共領
from totals t
join public.students s on s.id = t.student_id
where t.total_coupons > 0
order by t.total_coupons desc, t.total_score desc, s.name;


-- ═══════════════════════════════════════════════════════════════════
-- 📋 查詢 2:班別名單(排除前十名,依班別分群,班內按分數 desc → 出席 desc → 姓名)
-- ═══════════════════════════════════════════════════════════════════
with may_stats as (
  select student_id,
         count(*) as attend_days,
         count(*) filter (where solved) as solved_count,
         sum(score) as total_score,
         avg(guess_count) filter (where solved) as avg_guess
  from public.attempts
  where puzzle_date between '2026-05-01' and '2026-05-31'
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
  select student_id, attend_days, solved_count, total_score, olympic_rank,
         (attend_days >= 31) as full_attendance,
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
           + rank_award                                  as total_coupons
  from awards
)
select
  s.class_name                 as 班級,
  s.name                       as 姓名,
  s.email                      as Email,
  t.attend_days                as 出席,
  t.solved_count               as 答對,
  t.total_score                as 分數,
  case when t.full_attendance then '✓' else '' end as 全勤,
  case when t.participation   then '✓' else '' end as 參加,
  t.total_coupons              as 共領
from totals t
join public.students s on s.id = t.student_id
where t.total_coupons > 0
  and (t.olympic_rank is null or t.olympic_rank > 10)
order by s.class_name, t.total_score desc, t.attend_days desc, s.name;
