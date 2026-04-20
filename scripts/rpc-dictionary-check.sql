-- ChemWordle:字典檢查 Helper
--
-- 用法:整個檔案複製貼到 Supabase Dashboard → SQL Editor → Run
-- 可重複跑(CREATE OR REPLACE 是 idempotent)。
--
-- 本檔案只建立 helper 和 GRANT。真正要把檢查加到 submit_guess / try_guess,
-- 見下方附錄(那部分需要你手動編輯現有的 function)。


-- ─────────────────────────────────────────
-- Helper function:查字典裡有沒有這個詞
-- ─────────────────────────────────────────
create or replace function public.is_valid_guess_word(guess text)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from public.valid_words
    where word = upper(guess)
  );
$$;

-- 讓 anon 與 authenticated 角色都能呼叫(security definer 跨過 RLS)
grant execute on function public.is_valid_guess_word(text) to anon, authenticated;


-- ─────────────────────────────────────────
-- 驗證(三個結果合在同一列,Supabase SQL Editor 才能一次看全)
-- ─────────────────────────────────────────
select
  public.is_valid_guess_word('CARBON') as carbon_true,
  public.is_valid_guess_word('XZQPWL') as xzqpwl_false,
  public.is_valid_guess_word('carbon') as lowercase_true,
  (select count(*) from public.valid_words) as total_words;
-- 預期一列四欄:  true | false | true | 15232


-- ═════════════════════════════════════════════════════════════════
-- 附錄:要讓字典檢查真正生效,手動加進現有的兩個 RPC
-- ═════════════════════════════════════════════════════════════════
-- 在 Supabase Dashboard → Database → Functions 找到 submit_guess 與 try_guess,
-- 編輯這兩個函式,在 wrong_length 檢查之後加這 4 行:
--
--   if not public.is_valid_guess_word(guess_input) then
--     return jsonb_build_object('error', 'not_in_dictionary',
--                               'message', '不是有效單字');
--   end if;
--
-- 兩個函式都要加一次。Save 之後前端就會自動顯示「不是有效單字」toast,
-- 且不佔用學生每日 6 次猜測機會。
