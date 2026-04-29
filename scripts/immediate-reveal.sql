-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle: 答案立刻揭曉(per-user 模式下不需要再延遲一天)
--
-- 原因:per-user shuffled queue 後,每位學生題目不同,「明日揭曉」
--       已失去防傳答案的意義。改成玩完當下顯示答案 + 中英解釋,
--       強化學習印象。
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。idempotent。
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1) submit_guess:finished 時回傳 answer + zh_name/zh_description/en_description ───
create or replace function public.submit_guess(guess_input text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_student_id uuid := auth.uid();
  v_today date := public.tw_today();
  v_puzzle_id uuid;
  v_answer text;
  v_word_length int;
  v_zh_name text;
  v_zh_description text;
  v_en_description text;
  v_session_guesses jsonb;
  v_current_count int;
  v_colors jsonb;
  v_solved boolean;
  v_score int;
  v_new_guess jsonb;
  v_score_table int[] := array[100, 90, 80, 70, 60, 50];
begin
  if v_student_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  v_puzzle_id := public.get_student_puzzle_for_today(v_student_id);
  if v_puzzle_id is null then
    return jsonb_build_object('error', 'no_puzzle_today');
  end if;

  select answer, word_length, zh_name, zh_description, en_description
  into v_answer, v_word_length, v_zh_name, v_zh_description, v_en_description
  from public.daily_puzzles where id = v_puzzle_id;

  guess_input := upper(trim(guess_input));

  if guess_input !~ '^[A-Z]+$' then
    return jsonb_build_object('error', 'invalid_chars',
      'message', '只能輸入英文字母');
  end if;

  if char_length(guess_input) <> v_word_length then
    return jsonb_build_object('error', 'wrong_length',
      'message', format('必須是 %s 個字母', v_word_length));
  end if;

  if not public.is_valid_guess_word(guess_input) then
    return jsonb_build_object('error', 'not_in_dictionary',
      'message', '不是有效單字');
  end if;

  if exists (
    select 1 from public.attempts
    where student_id = v_student_id and puzzle_date = v_today
  ) then
    return jsonb_build_object('error', 'already_completed',
      'message', '今日已完成,明天再來');
  end if;

  select guesses into v_session_guesses
  from public.guess_sessions
  where student_id = v_student_id and puzzle_date = v_today;

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

  v_new_guess := jsonb_build_object('word', guess_input, 'colors', v_colors);
  v_session_guesses := v_session_guesses || jsonb_build_array(v_new_guess);

  insert into public.guess_sessions (student_id, puzzle_date, guesses, updated_at)
  values (v_student_id, v_today, v_session_guesses, now())
  on conflict (student_id, puzzle_date) do update set
    guesses = excluded.guesses, updated_at = now();

  if v_solved or v_current_count >= 6 then
    if v_solved then
      v_score := v_score_table[v_current_count];
    else
      v_score := 0;
    end if;

    insert into public.attempts (
      student_id, puzzle_date, guess_count, solved, score, guesses
    ) values (
      v_student_id, v_today, v_current_count, v_solved, v_score, v_session_guesses
    );

    update public.guess_sessions set is_complete = true
    where student_id = v_student_id and puzzle_date = v_today;

    -- 🆕 finished 回傳完整答案 + 中英解釋(立即揭曉模式)
    return jsonb_build_object(
      'status', 'finished',
      'colors', v_colors,
      'solved', v_solved,
      'guess_count', v_current_count,
      'score', v_score,
      'answer', v_answer,
      'zh_name', v_zh_name,
      'zh_description', v_zh_description,
      'en_description', v_en_description
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


-- ─── 2) get_today_puzzle_info:completed 狀態也回傳完整答案 ───
create or replace function public.get_today_puzzle_info()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_student_id uuid := auth.uid();
  v_today date := public.tw_today();
  v_puzzle_id uuid;
  v_word_length int;
  v_answer text;
  v_zh_name text;
  v_zh_description text;
  v_en_description text;
  v_session_guesses jsonb;
  v_attempt record;
begin
  if v_student_id is null then
    return jsonb_build_object('error', 'not_authenticated');
  end if;

  v_puzzle_id := public.get_student_puzzle_for_today(v_student_id);
  if v_puzzle_id is null then
    return jsonb_build_object(
      'status', 'no_puzzle',
      'message', '題庫尚未建立或帳號異常'
    );
  end if;

  select word_length, answer, zh_name, zh_description, en_description
  into v_word_length, v_answer, v_zh_name, v_zh_description, v_en_description
  from public.daily_puzzles where id = v_puzzle_id;

  -- 今天已完成?
  select * into v_attempt
  from public.attempts
  where student_id = v_student_id and puzzle_date = v_today;

  if found then
    -- 🆕 已完成 → 也回傳答案 + 中英解釋(讓重整頁面也能看)
    return jsonb_build_object(
      'status', 'completed',
      'puzzle_date', v_today,
      'word_length', v_word_length,
      'guess_count', v_attempt.guess_count,
      'solved', v_attempt.solved,
      'score', v_attempt.score,
      'guesses', v_attempt.guesses,
      'answer', v_answer,
      'zh_name', v_zh_name,
      'zh_description', v_zh_description,
      'en_description', v_en_description
    );
  end if;

  -- 未完成,看有沒有進行中的 session
  select guesses into v_session_guesses
  from public.guess_sessions
  where student_id = v_student_id and puzzle_date = v_today;

  return jsonb_build_object(
    'status', 'in_progress',
    'puzzle_date', v_today,
    'word_length', v_word_length,
    'guesses', coalesce(v_session_guesses, '[]'::jsonb)
  );
end;
$function$;


-- ─── 3) 驗證(從前端 /game 進去測會更精準) ───
select 'submit_guess installed' as info;
select 'get_today_puzzle_info installed' as info;
