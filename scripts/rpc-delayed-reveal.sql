-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle 延遲揭曉功能(需求 A+B 合併版)
--
-- 用法:整段複製貼到 Supabase Dashboard → SQL Editor → Run
-- 前置:先跑過 scripts/seed-words.sql 和 scripts/rpc-dictionary-check.sql
-- ═══════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────
-- 1) daily_puzzles 加兩個欄位(中文翻譯)
-- ────────────────────────────────────────────
alter table public.daily_puzzles
  add column if not exists zh_name text,
  add column if not exists zh_description text;

comment on column public.daily_puzzles.zh_name is '中文名,如「苯酚」';
comment on column public.daily_puzzles.zh_description is '中文解釋,給隔天揭曉 modal 顯示';


-- ────────────────────────────────────────────
-- 2) 新增 get_yesterday_puzzle_reveal() RPC
--    回傳昨日答案 + 中文翻譯;若昨天沒排題,回 null
-- ────────────────────────────────────────────
create or replace function public.get_yesterday_puzzle_reveal()
  returns jsonb
  language sql
  stable
  security definer
  set search_path = public
as $function$
  select jsonb_build_object(
    'puzzle_date', puzzle_date,
    'answer', answer,
    'zh_name', zh_name,
    'zh_description', zh_description
  )
  from public.daily_puzzles
  where puzzle_date = (public.tw_today() - interval '1 day')::date
    and is_active = true
  limit 1;
$function$;

grant execute on function public.get_yesterday_puzzle_reveal() to authenticated;


-- ────────────────────────────────────────────
-- 3) 改 submit_guess:finished 時不再回傳 answer
--    (其他邏輯完全一樣,含字典檢查)
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_guess(guess_input text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_today date := public.tw_today();
  v_answer text;
  v_word_length int;
  v_session_guesses jsonb;
  v_current_count int;
  v_colors jsonb;
  v_solved boolean;
  v_score int;
  v_new_guess jsonb;
  v_score_table int[] := array[100, 90, 80, 70, 60, 50];
begin
  if auth.uid() is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  select answer, word_length
  into v_answer, v_word_length
  from public.daily_puzzles
  where puzzle_date = v_today and is_active = true;

  if not found then
    return jsonb_build_object('error', 'no_puzzle_today');
  end if;

  guess_input := upper(trim(guess_input));

  if guess_input !~ '^[A-Z]+$' then
    return jsonb_build_object('error', 'invalid_chars',
      'message', '只能輸入英文字母');
  end if;

  if char_length(guess_input) <> v_word_length then
    return jsonb_build_object('error', 'wrong_length',
      'message', format('必須是 %s 個字母', v_word_length));
  end if;

  -- 字典檢查
  if not public.is_valid_guess_word(guess_input) then
    return jsonb_build_object('error', 'not_in_dictionary',
      'message', '不是有效單字');
  end if;

  if exists (
    select 1 from public.attempts
    where student_id = auth.uid() and puzzle_date = v_today
  ) then
    return jsonb_build_object('error', 'already_completed',
      'message', '今日已完成,明天再來');
  end if;

  select guesses into v_session_guesses
  from public.guess_sessions
  where student_id = auth.uid() and puzzle_date = v_today;

  if not found then
    v_session_guesses := '[]'::jsonb;
  end if;

  v_current_count := jsonb_array_length(v_session_guesses);

  if v_current_count >= 6 then
    return jsonb_build_object('error', 'max_attempts_reached');
  end if;

  v_colors := public.wordle_check(guess_input, v_answer);
  v_solved := (guess_input = upper(v_answer));
  v_current_count := v_current_count + 1;

  v_new_guess := jsonb_build_object(
    'word', guess_input,
    'colors', v_colors
  );
  v_session_guesses := v_session_guesses || jsonb_build_array(v_new_guess);

  insert into public.guess_sessions (student_id, puzzle_date, guesses, updated_at)
  values (auth.uid(), v_today, v_session_guesses, now())
  on conflict (student_id, puzzle_date)
  do update set
    guesses = excluded.guesses,
    updated_at = now();

  if v_solved or v_current_count >= 6 then
    if v_solved then
      v_score := v_score_table[v_current_count];
    else
      v_score := 0;
    end if;

    insert into public.attempts (
      student_id, puzzle_date, guess_count, solved, score, guesses
    ) values (
      auth.uid(), v_today, v_current_count, v_solved, v_score, v_session_guesses
    );

    update public.guess_sessions
    set is_complete = true
    where student_id = auth.uid() and puzzle_date = v_today;

    -- 🆕 answer 不再回傳(延遲揭曉;明日登入時 modal 顯示)
    return jsonb_build_object(
      'status', 'finished',
      'colors', v_colors,
      'solved', v_solved,
      'guess_count', v_current_count,
      'score', v_score,
      'answer', null
    );
  end if;

  return jsonb_build_object(
    'status', 'continue',
    'colors', v_colors,
    'guess_count', v_current_count,
    'remaining', 6 - v_current_count
  );
end;
$function$;


-- ────────────────────────────────────────────
-- 4) 驗證
-- ────────────────────────────────────────────
-- 欄位存在?
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'daily_puzzles'
  and column_name in ('zh_name', 'zh_description');
-- 預期:兩列 text

-- 昨日揭曉 RPC 可用?(未填翻譯也會回答案)
select public.get_yesterday_puzzle_reveal() as yesterday_info;
