-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle: 5 月領獎清單(供 6/3 頒獎現場用)
--
-- 內容:
--   PART 1 — 明細:每位有領獎的同學一列,可印或匯出當核對清單
--   PART 2 — 彙整:總共需準備幾張霜淇淋券
--
-- ⚠️ 注意:5/31 23:59(台灣時間)前跑出來的結果都還可能變動;
--         月底結算完(6/1 0:00 之後)再跑一次以最終數字為準。
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。
-- ═══════════════════════════════════════════════════════════════════


-- ─── PART 1: 領獎明細(每人一列) ──────────────────
with may_stats as (
  select
    a.student_id,
    count(*) as attend_days,
    count(*) filter (where solved) as solved_count,
    sum(score) as total_score,
    avg(guess_count) filter (where solved) as avg_guess
  from public.attempts a
  where puzzle_date between '2026-05-01' and '2026-05-31'
  group by a.student_id
),
ranked as (
  select
    *,
    rank() over (
      order by total_score desc,
               solved_count desc,
               coalesce(avg_guess, 99) asc
    ) as month_rank
  from may_stats
),
awards as (
  select
    student_id,
    attend_days,
    solved_count,
    total_score,
    month_rank,
    (attend_days >= 31) as full_attendance,
    (attend_days >= 20) as participation,
    case month_rank
      when 1 then 10
      when 2 then 6
      when 3 then 4
      else 0
    end as rank_award,
    (case when attend_days >= 31 then 2 else 0 end)
      + (case when attend_days >= 20 then 1 else 0 end)
      + (case month_rank when 1 then 10 when 2 then 6 when 3 then 4 else 0 end)
      as total_coupons
  from ranked
)
select
  row_number() over (order by a.total_coupons desc, a.total_score desc, s.name) as "#",
  s.name                       as 姓名,
  s.class_name                 as 班級,
  s.email                      as Email,
  a.attend_days                as 出席,
  a.solved_count               as 答對,
  a.total_score                as 分數,
  case when a.full_attendance then '✓' else '' end as 全勤,
  case when a.participation   then '✓' else '' end as 參加,
  case a.month_rank
    when 1 then '🥇1'
    when 2 then '🥈2'
    when 3 then '🥉3'
    else ''
  end                          as 月排,
  a.total_coupons              as 共領
from awards a
join public.students s on s.id = a.student_id
where a.total_coupons > 0
order by a.total_coupons desc, a.total_score desc, s.name;


-- ─── PART 2: 總券數彙整(要準備幾張) ──────────────
with may_stats as (
  select
    student_id,
    count(*) as attend_days,
    count(*) filter (where solved) as solved_count,
    sum(score) as total_score,
    avg(guess_count) filter (where solved) as avg_guess
  from public.attempts
  where puzzle_date between '2026-05-01' and '2026-05-31'
  group by student_id
),
ranked as (
  select
    *,
    rank() over (
      order by total_score desc,
               solved_count desc,
               coalesce(avg_guess, 99) asc
    ) as month_rank
  from may_stats
)
select
  count(*) filter (where attend_days >= 31)                  as "全勤人數",
  count(*) filter (where attend_days >= 31) * 2              as "全勤總券",
  count(*) filter (where attend_days >= 20)                  as "參加獎人數",
  count(*) filter (where attend_days >= 20) * 1              as "參加總券",
  count(*) filter (where month_rank = 1)                     as "第一名人數",
  count(*) filter (where month_rank = 1) * 10                as "第一名總券",
  count(*) filter (where month_rank = 2)                     as "第二名人數",
  count(*) filter (where month_rank = 2) * 6                 as "第二名總券",
  count(*) filter (where month_rank = 3)                     as "第三名人數",
  count(*) filter (where month_rank = 3) * 4                 as "第三名總券",
  (count(*) filter (where attend_days >= 31) * 2)
    + (count(*) filter (where attend_days >= 20) * 1)
    + (count(*) filter (where month_rank = 1) * 10)
    + (count(*) filter (where month_rank = 2) * 6)
    + (count(*) filter (where month_rank = 3) * 4)            as "✅ 總計要準備"
from ranked;
