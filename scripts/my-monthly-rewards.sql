-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle:個人月獎勵試算
--
-- 給單一學生看「我這個月拿到幾張霜淇淋券」
--   - 全勤獎(出席整月)→ 2 張
--   - 參加獎(出席 ≥ 20 天)→ 1 張(可與全勤同時)
--   - 月排行 🥇/🥈/🥉 → 10 / 6 / 4 張
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。可重跑。
-- 安全:需登入(auth.uid()),只能看自己。
-- ═══════════════════════════════════════════════════════════════════

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
begin
  if v_student_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  v_start := date_trunc('month', coalesce(target_month, v_today))::date;
  v_end := (v_start + interval '1 month' - interval '1 day')::date;
  v_total_days := extract(day from v_end)::int;

  -- 我的本月統計
  select count(*),
         count(*) filter (where solved),
         coalesce(sum(score), 0)
    into v_attend_days, v_solved_count, v_total_score
    from public.attempts
    where student_id = v_student_id
      and puzzle_date between v_start and v_end;

  v_attend_days   := coalesce(v_attend_days, 0);
  v_solved_count  := coalesce(v_solved_count, 0);
  v_total_score   := coalesce(v_total_score, 0);

  v_full_attendance := (v_attend_days >= v_total_days);
  v_participation   := (v_attend_days >= 20);

  -- 月排行(同 leaderboard tiebreaker:總分 desc → 答對次數 desc → 平均猜測 asc)
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

  v_rank_award := case v_top_rank
    when 1 then 10
    when 2 then 6
    when 3 then 4
    else 0
  end;

  v_total_coupons :=
    (case when v_full_attendance then 2 else 0 end) +
    (case when v_participation   then 1 else 0 end) +
    v_rank_award;

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


-- ─── 驗證 ────────────────────────────────
select 'get_my_monthly_rewards installed' as info;
