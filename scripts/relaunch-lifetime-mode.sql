-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle 轉型:常駐練習模式的後端
--
-- 1) app_config 表 + relaunch_date() helper
--    「重新上線日」的單一真相來源。改日期只要跑一行 UPDATE,
--    不用改 RPC 也不用重新部署前端。
--
-- 2) get_my_lifetime_stats()   個人累積統計 + streak(寬容 1 天)
-- 3) get_lifetime_leaderboard() 永久累積榜
--
-- 兩者都只計算 puzzle_date >= relaunch_date 的資料,
-- 5/1–6/30 的競賽期紀錄保留在 DB 但不計入(見 DECISIONS.md #2)。
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。可重跑。
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1) app_config ──────────────────────────────
create table if not exists public.app_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;
-- 不建 policy:前端不直接讀,只透過 security definer 函式取用。

insert into public.app_config (key, value)
values ('relaunch_date', '2026-10-01')
on conflict (key) do nothing;

comment on table public.app_config is
  '全站設定的鍵值表。relaunch_date = 常駐練習模式的起算日,streak 與永久榜都從這天開始計算。';


create or replace function public.relaunch_date()
returns date
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select value::date from public.app_config where key = 'relaunch_date'),
    date '2026-10-01'
  );
$$;

grant execute on function public.relaunch_date() to anon, authenticated;


-- ─── 2) 個人累積統計 + streak ────────────────────
--
-- streak 規則(DECISIONS.md #3):
--   - 允許中間缺 1 天;缺 2 天(含)以上才斷。
--   - 數值是「實際有玩的天數」,不是日曆跨度。
--   - 最後一次遊玩需在 today − 2 之內,streak 才算還活著。
--
create or replace function public.get_my_lifetime_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_student_id uuid := auth.uid();
  v_today      date := public.tw_today();
  v_start      date := public.relaunch_date();
  v_challenged int;
  v_solved     int;
  v_last       date;
  v_streak     int := 0;
  v_best       int := 0;
  v_played_today boolean;
begin
  if v_student_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select count(*),
         count(*) filter (where solved),
         max(puzzle_date)
    into v_challenged, v_solved, v_last
    from public.attempts
    where student_id = v_student_id
      and puzzle_date >= v_start;

  v_challenged := coalesce(v_challenged, 0);
  v_solved     := coalesce(v_solved, 0);

  if v_challenged > 0 then
    -- 把有玩的日期由新到舊排,相鄰間隔 > 2 天視為斷點,
    -- 用累加斷點數分組,grp = 0 就是最近這一段。
    with played as (
      select distinct puzzle_date as d
      from public.attempts
      where student_id = v_student_id
        and puzzle_date >= v_start
    ),
    marked as (
      select d,
             case when (lag(d) over (order by d desc) - d) > 2 then 1 else 0 end as is_break
      from played
    ),
    grouped as (
      select d,
             sum(is_break) over (order by d desc rows between unbounded preceding and current row) as grp
      from marked
    ),
    sized as (
      select grp, count(*) as cnt
      from grouped
      group by grp
    )
    select
      coalesce((select cnt from sized where grp = 0), 0),
      coalesce((select max(cnt) from sized), 0)
    into v_streak, v_best;

    -- 最近一次遊玩若已超過 2 天,目前 streak 算斷掉
    if (v_today - v_last) > 2 then
      v_streak := 0;
    end if;
  end if;

  v_played_today := exists (
    select 1 from public.attempts
    where student_id = v_student_id and puzzle_date = v_today
  );

  return jsonb_build_object(
    'relaunch_date',  v_start,
    'challenged',     v_challenged,
    'solved',         v_solved,
    'accuracy',       case when v_challenged > 0
                        then round(v_solved::numeric * 100 / v_challenged, 1)
                        else null end,
    'streak',         coalesce(v_streak, 0),
    'best_streak',    coalesce(v_best, 0),
    'last_played',    v_last,
    'played_today',   v_played_today
  );
end;
$function$;

grant execute on function public.get_my_lifetime_stats() to authenticated;


-- ─── 3) 永久累積榜 ───────────────────────────────
--
-- 排序:累積答對 desc → 挑戰天數 desc → 平均猜測次數 asc
-- (學習工具導向:先看「學會幾個字」,再看「有多常來」,最後才比效率)
--
create or replace function public.get_lifetime_leaderboard(top_n int default 20)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_student_id uuid := auth.uid();
  v_start date := public.relaunch_date();
  v_top jsonb;
  v_me  jsonb;
begin
  with agg as (
    select a.student_id,
           count(*) as challenged,
           count(*) filter (where a.solved) as solved,
           avg(a.guess_count) filter (where a.solved) as avg_guess
    from public.attempts a
    where a.puzzle_date >= v_start
    group by a.student_id
  ),
  ranked as (
    select agg.*,
           rank() over (
             order by solved desc,
                      challenged desc,
                      coalesce(avg_guess, 99) asc
           ) as rk
    from agg
  )
  select
    coalesce((
      select jsonb_agg(jsonb_build_object(
               'rank',       r.rk,
               'name',       s.name,
               'class_name', s.class_name,
               'solved',     r.solved,
               'challenged', r.challenged,
               'accuracy',   round(r.solved::numeric * 100 / nullif(r.challenged, 0), 1)
             ) order by r.rk, s.name)
      from ranked r
      join public.students s on s.id = r.student_id
      where r.rk <= top_n
    ), '[]'::jsonb),
    (
      select jsonb_build_object(
               'rank',       r.rk,
               'solved',     r.solved,
               'challenged', r.challenged,
               'accuracy',   round(r.solved::numeric * 100 / nullif(r.challenged, 0), 1)
             )
      from ranked r
      where r.student_id = v_student_id
    )
  into v_top, v_me;

  return jsonb_build_object(
    'relaunch_date', v_start,
    'top', v_top,
    'my_rank', v_me
  );
end;
$function$;

grant execute on function public.get_lifetime_leaderboard(int) to authenticated;


-- ─── 驗證 ───────────────────────────────────────
select
  public.relaunch_date() as relaunch_date,
  (select count(*) from public.app_config) as config_rows;
-- 預期:relaunch_date = 2026-10-01,config_rows = 1
--
-- 之後要改上線日:
--   update public.app_config set value = '2026-10-15', updated_at = now()
--   where key = 'relaunch_date';
