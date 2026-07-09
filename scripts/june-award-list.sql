-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle: 6 月領獎名單(適用寄信通知 / 領獎核對)
--
-- 6 月獎項對照:
--   🥇 1 名     → 400 元禮券
--   2-5 名     → 200 元禮券
--   6-10 名    → 100 元禮券
--   全勤獎     → 霜淇淋券 2 張(出席 30 天,June)
--   參加獎     → 霜淇淋券 1 張(出席 ≥ 20 天)
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。
--       結果面板右上角 ⬇ Download CSV。
-- ═══════════════════════════════════════════════════════════════════

with june_stats as (
  select student_id,
         count(*) as attend_days,
         count(*) filter (where solved) as solved_count,
         sum(score) as total_score,
         avg(guess_count) filter (where solved) as avg_guess
  from public.attempts
  where puzzle_date between '2026-06-01' and '2026-06-30'
  group by student_id
),
ranked as (
  select *,
         rank() over (
           order by total_score desc,
                    solved_count desc,
                    coalesce(avg_guess, 99) asc
         ) as olympic_rank
  from june_stats
),
awards as (
  select student_id, attend_days, solved_count, total_score, olympic_rank,
         (attend_days >= 30) as full_attendance,
         (attend_days >= 20) as participation,
         case
           when olympic_rank between 1 and 10
             then (array[400,200,200,200,200,100,100,100,100,100])[olympic_rank]
           else 0
         end as voucher_amount
  from ranked
),
totals as (
  select *,
         (case when full_attendance then 2 else 0 end)
           + (case when participation then 1 else 0 end)
           as ice_cream_coupons
  from awards
)
select
  row_number() over (order by
    t.voucher_amount desc,
    t.ice_cream_coupons desc,
    t.total_score desc,
    s.name
  ) as "#",
  s.name                       as 姓名,
  s.class_name                 as 班級,
  s.email                      as Email,
  t.attend_days                as 6月出席,
  t.solved_count               as 答對,
  t.total_score                as 分數,
  case when t.full_attendance then '✓' else '' end                                  as 全勤,
  case when t.participation   then '✓' else '' end                                  as 參加,
  case when t.olympic_rank between 1 and 10 then format('第 %s 名', t.olympic_rank) else '' end as 月排,
  t.ice_cream_coupons          as 霜淇淋券,
  t.voucher_amount             as 禮券元
from totals t
join public.students s on s.id = t.student_id
where t.ice_cream_coupons > 0 or t.voucher_amount > 0
order by
  t.voucher_amount desc,
  t.ice_cream_coupons desc,
  t.total_score desc,
  s.name;
