-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle 後端擴充:訪客池 + 英文解釋 + 改 get_guest_puzzle + try_guess
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。idempotent,可重複執行。
--
-- 本檔做的事:
--   1) daily_puzzles 加 en_description 欄位(英文解釋,給 EN modal 用)
--   2) daily_puzzles 加 is_guest_pool 欄位(true = 訪客池題目)
--   3) puzzle_date 改成 nullable(訪客池題目沒有日期)
--   4) 加約束:is_guest_pool=true ⇔ puzzle_date is null
--   5) 重寫 get_guest_puzzle:從訪客池隨機抽,空時 fallback 到舊題目
--   6) 重寫 try_guess:訪客池題目不受日期限制
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1) en_description 欄位 ──────────────
alter table public.daily_puzzles
  add column if not exists en_description text;

comment on column public.daily_puzzles.en_description
  is 'English explanation, shown when UI is in EN mode or alongside Chinese in reveal modal';


-- ─── 2) is_guest_pool 欄位 ───────────────
alter table public.daily_puzzles
  add column if not exists is_guest_pool boolean not null default false;

comment on column public.daily_puzzles.is_guest_pool
  is '若 true 則屬於訪客隨機池(獨立於每日題目排程)';


-- ─── 3) puzzle_date 改 nullable ──────────
alter table public.daily_puzzles
  alter column puzzle_date drop not null;


-- ─── 4) 一致性約束(訪客池與日期互斥) ──
-- is_guest_pool=true:必須 puzzle_date is null
-- is_guest_pool=false:必須有 puzzle_date
alter table public.daily_puzzles
  drop constraint if exists daily_puzzles_date_pool_consistency;
alter table public.daily_puzzles
  add constraint daily_puzzles_date_pool_consistency
  check (
    (is_guest_pool = true and puzzle_date is null) or
    (is_guest_pool = false and puzzle_date is not null)
  );


-- ─── 5) 重寫 get_guest_puzzle ─────────────
-- 新邏輯:
--   1. 先從 is_guest_pool=true 的題目中隨機抽 → is_fallback=false
--   2. 若訪客池空,fallback 抽過去日期(< tw_today)最新的正規題 → is_fallback=true
--   3. 都沒有就回錯誤(不太可能,但兜底)
create or replace function public.get_guest_puzzle()
  returns jsonb
  language plpgsql
  stable
  security definer
  set search_path = public
as $function$
declare
  v_puzzle public.daily_puzzles%rowtype;
begin
  -- (1) 隨機抽訪客池
  select * into v_puzzle
  from public.daily_puzzles
  where is_guest_pool = true and is_active = true
  order by random()
  limit 1;

  if found then
    return jsonb_build_object(
      'puzzle_id', v_puzzle.id,
      'word_length', v_puzzle.word_length,
      'category', v_puzzle.category,
      'is_fallback', false
    );
  end if;

  -- (2) Fallback:過去日期最新的題
  select * into v_puzzle
  from public.daily_puzzles
  where is_guest_pool = false
    and is_active = true
    and puzzle_date is not null
    and puzzle_date < public.tw_today()
  order by puzzle_date desc
  limit 1;

  if found then
    return jsonb_build_object(
      'puzzle_id', v_puzzle.id,
      'word_length', v_puzzle.word_length,
      'category', v_puzzle.category,
      'is_fallback', true
    );
  end if;

  -- (3) 真的什麼都沒有
  return jsonb_build_object('error', 'no_guest_puzzle');
end;
$function$;

grant execute on function public.get_guest_puzzle() to anon, authenticated;


-- ─── 6) 重寫 try_guess(訪客池題目不受日期限制) ──
create or replace function public.try_guess(puzzle_id uuid, guess_input text)
 returns jsonb
 language plpgsql
 stable
 security definer
 set search_path to 'public'
as $function$
declare
  v_answer text;
  v_word_length int;
  v_puzzle_date date;
  v_is_guest_pool boolean;
  v_colors jsonb;
  v_solved boolean;
begin
  -- 找這題
  select answer, word_length, puzzle_date, is_guest_pool
  into v_answer, v_word_length, v_puzzle_date, v_is_guest_pool
  from public.daily_puzzles
  where id = puzzle_id;

  if not found then
    return jsonb_build_object('error', 'puzzle_not_found');
  end if;

  -- 防作弊:正規題目(非訪客池)只能玩過去日期
  -- 訪客池題目沒日期,跳過此檢查
  if not v_is_guest_pool then
    if v_puzzle_date is null or v_puzzle_date >= public.tw_today() then
      return jsonb_build_object('error', 'puzzle_not_available');
    end if;
  end if;

  -- 檢查猜測格式
  guess_input := upper(trim(guess_input));

  if guess_input !~ '^[A-Z]+$' then
    return jsonb_build_object('error', 'invalid_chars');
  end if;

  if char_length(guess_input) <> v_word_length then
    return jsonb_build_object('error', 'wrong_length');
  end if;

  -- 字典檢查(假設已建好 is_valid_guess_word helper)
  if not public.is_valid_guess_word(guess_input) then
    return jsonb_build_object('error', 'not_in_dictionary',
      'message', '不是有效單字');
  end if;

  -- 計算顏色
  v_colors := public.wordle_check(guess_input, v_answer);
  v_solved := (guess_input = upper(v_answer));

  return jsonb_build_object(
    'colors', v_colors,
    'solved', v_solved,
    'answer', case when v_solved then v_answer else null end
  );
end;
$function$;


-- ─── 驗證 ────────────────────────────────
-- A. 欄位齊全
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'daily_puzzles'
  and column_name in ('en_description', 'is_guest_pool', 'puzzle_date')
order by column_name;
-- 預期:
--   en_description | text     | YES | null
--   is_guest_pool  | boolean  | NO  | false
--   puzzle_date    | date     | YES | null

-- B. RPC 可用
select public.get_guest_puzzle() as guest_puzzle_now;
-- 預期:目前訪客池空,會回 fallback(舊題)或 error
