-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle: 6 月改為禮券制 — get_my_monthly_rewards 月份感知
--
-- 規則:
--   5 月(以及未來一般月份):月排行獎 = 霜淇淋券
--     rank 1  → 10 張
--     rank 2  → 6 張
--     rank 3  → 6 張(並列共享)
--     rank 4  → 4 張
--     rank 5-6→ 3 張
--     rank 7-8→ 2 張
--     rank 9-10→ 1 張
--
--   6 月(僅此一次):月排行獎 = 禮券(NT$)
--     rank 1  → 400 元
--     rank 2-5→ 200 元
--     rank 6-10→ 100 元
--
--   全勤獎、參加獎:兩個月都是霜淇淋券(全勤 2 張 / 參加 1 張)
--
-- 回傳欄位:
--   rank_award       — 月排行拿到的「霜淇淋券張數」(6 月為 0)
--   voucher_amount   — 月排行拿到的「禮券 NT$」(其他月份為 0)
--   total_coupons    — 該月霜淇淋券總計 = full×2 + part×1 + rank_award
--   total_voucher    — 該月禮券總計 = voucher_amount
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。可重跑。
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
  v_ice_from_rank int;
  v_voucher_from_rank int;
  v_ice_table int[];
  v_voucher_table int[];
begin
  if v_student_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  v_start := date_trunc('month', coalesce(target_month, v_today))::date;
  v_end := (v_start + interval '1 month' - interval '1 day')::date;
  v_total_days := extract(day from v_end)::int;

  -- 6 月用禮券,其他月份用霜淇淋券
  if v_start = date '2026-06-01' then
    v_ice_table     := array[0,0,0,0,0,0,0,0,0,0];
    v_voucher_table := array[400,200,200,200,200,100,100,100,100,100];
  else
    v_ice_table     := array[10,6,6,4,3,3,2,2,1,1];
    v_voucher_table := array[0,0,0,0,0,0,0,0,0,0];
  end if;

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

  v_ice_from_rank := case
    when v_top_rank between 1 and 10 then v_ice_table[v_top_rank]
    else 0
  end;
  v_voucher_from_rank := case
    when v_top_rank between 1 and 10 then v_voucher_table[v_top_rank]
    else 0
  end;

  return jsonb_build_object(
    'month', v_start,
    'total_days', v_total_days,
    'attend_days', v_attend_days,
    'solved_count', v_solved_count,
    'total_score', v_total_score,
    'full_attendance', v_full_attendance,
    'participation', v_participation,
    'top_rank', v_top_rank,
    'rank_award', coalesce(v_ice_from_rank, 0),        -- 月排行「霜淇淋券」(6 月為 0)
    'voucher_amount', coalesce(v_voucher_from_rank, 0), -- 月排行「禮券」(其他月份為 0)
    'total_coupons',                                     -- 霜淇淋券總計
      (case when v_full_attendance then 2 else 0 end)
      + (case when v_participation then 1 else 0 end)
      + coalesce(v_ice_from_rank, 0),
    'total_voucher', coalesce(v_voucher_from_rank, 0)   -- 禮券總計
  );
end;
$function$;

grant execute on function public.get_my_monthly_rewards(date) to authenticated;


-- ─── 驗證 ────────────────────────────────
select 'get_my_monthly_rewards updated (month-aware voucher)' as info;
