-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle 訪客模式:答案立即揭曉(失敗也要顯示)
--
-- 問題:原本 try_guess 只在 solved=true 時回 answer,猜錯就 null
--       → 訪客玩失敗後沒看到答案,失去學習意義
--
-- 修正:try_guess 每次都回傳 answer + zh_name + zh_description + en_description
--       (訪客模式無記分、無排行榜,DevTools 看到答案不影響任何人)
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。idempotent。
-- ═══════════════════════════════════════════════════════════════════

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
  v_zh_name text;
  v_zh_description text;
  v_en_description text;
  v_colors jsonb;
  v_solved boolean;
begin
  -- 找這題(連帶把中英解釋一起拉出來)
  select answer, word_length, puzzle_date, is_guest_pool,
         zh_name, zh_description, en_description
  into v_answer, v_word_length, v_puzzle_date, v_is_guest_pool,
       v_zh_name, v_zh_description, v_en_description
  from public.daily_puzzles
  where id = puzzle_id;

  if not found then
    return jsonb_build_object('error', 'puzzle_not_found');
  end if;

  -- 防作弊:正規題目(非訪客池)只能玩過去日期。訪客池題目跳過此檢查。
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

  if not public.is_valid_guess_word(guess_input) then
    return jsonb_build_object('error', 'not_in_dictionary',
      'message', '不是有效單字');
  end if;

  -- 計算顏色
  v_colors := public.wordle_check(guess_input, v_answer);
  v_solved := (guess_input = upper(v_answer));

  -- 🆕 一律回傳完整答案資訊(訪客模式無記分,沒有作弊風險)
  --    前端在「玩完」當下才把這些 metadata 顯示給使用者看
  return jsonb_build_object(
    'colors', v_colors,
    'solved', v_solved,
    'answer', v_answer,
    'zh_name', v_zh_name,
    'zh_description', v_zh_description,
    'en_description', v_en_description
  );
end;
$function$;


-- ─── 驗證 ────────────────────────────────
select 'try_guess updated (immediate reveal for guests)' as info;
