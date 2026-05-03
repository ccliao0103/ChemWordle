-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle 後台:手動調整某學生今天的成績
--
-- 用途:當有 bug 害學生不公平地拿到 0 分(例如答案不在字典),
--      手動把他改成「第 N 次猜中」,給對應分數。
--
-- 計分對照(跟線上版一致):
--   第 1 次中 = 100 分
--   第 2 次中 =  90 分
--   第 3 次中 =  80 分
--   第 4 次中 =  70 分  ← 預設
--   第 5 次中 =  60 分
--   第 6 次中 =  50 分
--
-- 用法:
--   1. 改下方 ▼▼▼ 三個變數
--   2. 整段複製貼到 Supabase SQL Editor → Run
--   3. 看輸出確認 BEFORE / AFTER 對得起來
-- ═══════════════════════════════════════════════════════════════════

do $$
declare
  -- ▼▼▼ 改這三個就好 ▼▼▼
  p_email           text := 'student@example.com';   -- 學生 email
  p_target_guess    int  := 4;                       -- 假裝第幾次猜中(1-6)
  p_target_date     date := public.tw_today();       -- 哪天的成績(預設今天)
  -- ▲▲▲                                       ▲▲▲

  v_score_table     int[] := array[100, 90, 80, 70, 60, 50];
  v_student_id      uuid;
  v_student_name    text;
  v_target_score    int;
  v_before          record;
begin
  -- 找學生
  select id, name into v_student_id, v_student_name
  from public.students
  where lower(email) = lower(p_email);

  if v_student_id is null then
    raise exception '找不到 email = % 的學生', p_email;
  end if;

  if p_target_guess < 1 or p_target_guess > 6 then
    raise exception 'p_target_guess 必須是 1-6,你給的是 %', p_target_guess;
  end if;

  v_target_score := v_score_table[p_target_guess];

  -- 看現況
  select * into v_before
  from public.attempts
  where student_id = v_student_id and puzzle_date = p_target_date;

  if found then
    raise notice 'BEFORE: 學生=% 日期=% 第%次 solved=% 分數=%',
      v_student_name, p_target_date, v_before.guess_count,
      v_before.solved, v_before.score;

    update public.attempts
    set guess_count = p_target_guess,
        solved = true,
        score = v_target_score
    where student_id = v_student_id and puzzle_date = p_target_date;
  else
    raise notice 'BEFORE: 學生=% 日期=% 沒有 attempt 紀錄(將新建一筆)',
      v_student_name, p_target_date;

    insert into public.attempts (
      student_id, puzzle_date, guess_count, solved, score, guesses
    ) values (
      v_student_id, p_target_date, p_target_guess, true, v_target_score, '[]'::jsonb
    );
  end if;

  raise notice 'AFTER : 學生=% 日期=% 第%次 solved=true 分數=%',
    v_student_name, p_target_date, p_target_guess, v_target_score;
end$$;


-- ─── 驗證:看調整後的紀錄 ─────────────────
select s.name, s.email, a.puzzle_date, a.guess_count, a.solved, a.score
from public.attempts a
join public.students s on s.id = a.student_id
where lower(s.email) = lower('student@example.com')   -- ⚠️ 同樣改成你剛剛調整的 email
  and a.puzzle_date = public.tw_today()
order by a.puzzle_date desc;
