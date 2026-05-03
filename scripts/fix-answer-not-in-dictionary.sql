-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle 修補:答案沒進字典(導致使用者打不出來)
--
-- 問題:batch3 新增的題目(HEXENE / CHIRAL / DIENE / DOPING /
--      IONIZE / POROUS / REDUCE / SILICA / VAPOR)只 insert 進
--      daily_puzzles,沒同步進 valid_words → 即使是答案,使用者
--      打進去也會被「不是有效單字」擋下。
--
-- 修法:
--   1) 列出目前缺漏的答案(診斷)
--   2) 把所有 daily_puzzles.answer 補進 valid_words
--   3) 加 trigger:以後 insert/update daily_puzzles 自動同步進字典
--      (避免再忘記)
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。idempotent。
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1) 診斷:目前哪些答案不在字典裡? ────────────
select dp.answer, dp.is_active, dp.is_guest_pool, dp.puzzle_date
from public.daily_puzzles dp
left join public.valid_words vw on vw.word = upper(dp.answer)
where vw.word is null
order by dp.puzzle_date nulls first, dp.answer;
-- 預期:現在會列出 batch3 那批


-- ─── 2) 一次補上所有缺漏 ─────────────────────────
insert into public.valid_words (word)
select distinct upper(answer) from public.daily_puzzles
on conflict (word) do nothing;


-- ─── 3) 防呆 trigger:以後新增/更新 daily_puzzles 自動同步進字典 ─
create or replace function public.sync_puzzle_answer_to_dictionary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.answer is not null then
    insert into public.valid_words (word)
    values (upper(NEW.answer))
    on conflict (word) do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_sync_puzzle_to_dict on public.daily_puzzles;
create trigger trg_sync_puzzle_to_dict
  after insert or update of answer on public.daily_puzzles
  for each row
  execute function public.sync_puzzle_answer_to_dictionary();


-- ─── 4) 驗證 ──────────────────────────────────────
-- A. 應該不再有缺漏
select count(*) as still_missing
from public.daily_puzzles dp
left join public.valid_words vw on vw.word = upper(dp.answer)
where vw.word is null;
-- 預期:0

-- B. 試試之前打不進去的字
select
  public.is_valid_guess_word('HEXENE') as hexene_should_be_true,
  public.is_valid_guess_word('CHIRAL') as chiral_should_be_true,
  public.is_valid_guess_word('DIENE')  as diene_should_be_true,
  public.is_valid_guess_word('DOPING') as doping_should_be_true,
  public.is_valid_guess_word('IONIZE') as ionize_should_be_true,
  public.is_valid_guess_word('POROUS') as porous_should_be_true,
  public.is_valid_guess_word('REDUCE') as reduce_should_be_true,
  public.is_valid_guess_word('SILICA') as silica_should_be_true,
  public.is_valid_guess_word('VAPOR')  as vapor_should_be_true;
-- 預期:全部 true
