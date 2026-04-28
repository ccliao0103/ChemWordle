-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle: Per-user shuffled puzzle queue
--
-- 動機:防班群傳答案、防小組協作。每位學生有專屬洗牌題目序列。
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run。idempotent,可重跑。
-- 前置:已跑過所有先前 SQL(seed-words / fix-migration / rpc-delayed-reveal /
--       rpc-guest-pool-and-en / rpc-leaderboard-class-name / seed-daily-puzzles /
--       seed-finale-week)
-- ═══════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────
-- 1) 建 student_puzzle_queues 表
-- ────────────────────────────────────────────────
create table if not exists public.student_puzzle_queues (
  student_id    uuid not null references public.students(id) on delete cascade,
  position      int not null,
  puzzle_id     uuid not null references public.daily_puzzles(id),
  round_number  int not null default 1,
  added_at      timestamptz not null default now(),
  primary key (student_id, position)
);

create index if not exists idx_spq_student_position
  on public.student_puzzle_queues(student_id, position);

alter table public.student_puzzle_queues enable row level security;
-- 不開 policy,前端不應直接讀;RPC 用 security definer 跨過


-- ────────────────────────────────────────────────
-- 2) Helper function:為單一學生洗一輪題目,append 到 queue 末尾
-- ────────────────────────────────────────────────
create or replace function public.shuffle_round_for_student(p_student_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_start_pos int;
  v_round int;
  v_inserted int;
begin
  -- 找下一個位置與輪數
  select coalesce(max(position), -1) + 1,
         coalesce(max(round_number), 0) + 1
  into v_start_pos, v_round
  from public.student_puzzle_queues
  where student_id = p_student_id;

  -- 把所有非訪客池且 active 的題目隨機排序,append
  with shuffled as (
    select id as puzzle_id,
           row_number() over (order by random()) - 1 as ordinal
    from public.daily_puzzles
    where is_guest_pool = false and is_active = true
  )
  insert into public.student_puzzle_queues
    (student_id, position, puzzle_id, round_number)
  select p_student_id, v_start_pos + ordinal, puzzle_id, v_round
  from shuffled
  on conflict (student_id, position) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$function$;

grant execute on function public.shuffle_round_for_student(uuid) to authenticated;


-- ────────────────────────────────────────────────
-- 3) Helper function:計算學生的 Day N(從 created_at 在台灣時區算起)
-- ────────────────────────────────────────────────
create or replace function public.student_day_for(p_student_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $function$
  select greatest(0, (public.tw_today() - ((created_at at time zone 'Asia/Taipei')::date)))::int
  from public.students
  where id = p_student_id;
$function$;

grant execute on function public.student_day_for(uuid) to authenticated;


-- ────────────────────────────────────────────────
-- 4) Helper function:取學生「今天」應玩的 puzzle_id
--    若 queue 不夠長(用完了),自動再洗一輪
-- ────────────────────────────────────────────────
create or replace function public.get_student_puzzle_for_today(p_student_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_day int;
  v_puzzle_id uuid;
begin
  v_day := public.student_day_for(p_student_id);
  if v_day is null then return null; end if;

  -- 查 queue
  select puzzle_id into v_puzzle_id
  from public.student_puzzle_queues
  where student_id = p_student_id and position = v_day;

  -- 沒有 → 試著洗下一輪
  if v_puzzle_id is null then
    perform public.shuffle_round_for_student(p_student_id);
    select puzzle_id into v_puzzle_id
    from public.student_puzzle_queues
    where student_id = p_student_id and position = v_day;
  end if;

  return v_puzzle_id;
end;
$function$;


-- ────────────────────────────────────────────────
-- 5) Backfill:為現有學生洗第一輪(在開新 trigger 前做)
-- ────────────────────────────────────────────────
do $$
declare
  v_student record;
begin
  for v_student in select id from public.students loop
    if not exists (
      select 1 from public.student_puzzle_queues where student_id = v_student.id
    ) then
      perform public.shuffle_round_for_student(v_student.id);
    end if;
  end loop;
end$$;


-- ────────────────────────────────────────────────
-- 6) 改 handle_new_user trigger:註冊時自動洗第一輪
-- ────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_name text;
  v_email text;
  v_role_category text;
  v_year_tag text;
  v_class_tag text;
  v_student_id text;
  v_class_name text;
  v_role text;
begin
  v_name := nullif(trim(new.raw_user_meta_data->>'name'), '');
  v_email := lower(new.email);
  v_role_category := new.raw_user_meta_data->>'role_category';
  v_year_tag := nullif(trim(new.raw_user_meta_data->>'year_tag'), '');
  v_class_tag := nullif(trim(new.raw_user_meta_data->>'class_tag'), '');
  v_student_id := nullif(trim(new.raw_user_meta_data->>'student_id'), '');

  if v_name is null or char_length(v_name) < 2 then
    raise exception 'INVALID_NAME';
  end if;

  if v_role_category is null
     or v_role_category not in ('undergrad', 'master', 'phd', 'staff') then
    raise exception 'INVALID_ROLE_CATEGORY';
  end if;

  if v_role_category = 'undergrad' then
    if v_year_tag is null or v_year_tag not in ('化一', '化二', '化三', '化四') then
      raise exception 'INVALID_YEAR_TAG';
    end if;
    if v_class_tag is null or v_class_tag not in ('甲', '乙') then
      raise exception 'INVALID_CLASS_TAG';
    end if;
    v_class_name := v_year_tag || v_class_tag;
  else
    v_year_tag := null;
    v_class_tag := null;
    v_class_name := case v_role_category
                      when 'master' then '碩士'
                      when 'phd'    then '博士'
                      when 'staff'  then '教職員'
                    end;
  end if;

  v_role := case when v_role_category = 'staff' then 'teacher' else 'student' end;

  insert into public.students (
    id, email, name, role, role_category,
    year_tag, class_tag, class_name, student_id,
    created_at, updated_at
  ) values (
    new.id, v_email, v_name, v_role, v_role_category,
    v_year_tag, v_class_tag, v_class_name, v_student_id,
    now(), now()
  );

  -- 🆕 自動洗第一輪 queue
  perform public.shuffle_round_for_student(new.id);

  return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ────────────────────────────────────────────────
-- 7) 新 trigger:管理員加新 daily_puzzle 時,append 到所有學生 queue
-- ────────────────────────────────────────────────
create or replace function public.append_new_puzzle_to_all_queues()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  -- 只處理:新加的、active、非訪客池
  if new.is_guest_pool = true then return new; end if;
  if new.is_active = false then return new; end if;

  -- 為每位學生 append 此題到他們 queue 的末尾
  insert into public.student_puzzle_queues
    (student_id, position, puzzle_id, round_number)
  select
    s.id,
    coalesce(max(spq.position), -1) + 1,
    new.id,
    coalesce(max(spq.round_number), 1)
  from public.students s
  left join public.student_puzzle_queues spq on spq.student_id = s.id
  group by s.id;

  return new;
end;
$function$;

drop trigger if exists on_daily_puzzle_inserted on public.daily_puzzles;
create trigger on_daily_puzzle_inserted
  after insert on public.daily_puzzles
  for each row execute function public.append_new_puzzle_to_all_queues();


-- ────────────────────────────────────────────────
-- 8) 改 get_today_puzzle_info():從 queue 拿題
-- ────────────────────────────────────────────────
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

  select word_length into v_word_length
  from public.daily_puzzles where id = v_puzzle_id;

  -- 今天是否已完成?
  select * into v_attempt
  from public.attempts
  where student_id = v_student_id and puzzle_date = v_today;

  if found then
    return jsonb_build_object(
      'status', 'completed',
      'puzzle_date', v_today,
      'word_length', v_word_length,
      'guess_count', v_attempt.guess_count,
      'solved', v_attempt.solved,
      'score', v_attempt.score,
      'guesses', v_attempt.guesses
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


-- ────────────────────────────────────────────────
-- 9) 改 submit_guess():從 queue 拿 answer
-- ────────────────────────────────────────────────
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

  -- 從 queue 拿今天的題
  v_puzzle_id := public.get_student_puzzle_for_today(v_student_id);
  if v_puzzle_id is null then
    return jsonb_build_object('error', 'no_puzzle_today');
  end if;

  select answer, word_length into v_answer, v_word_length
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


-- ────────────────────────────────────────────────
-- 10) 改 get_yesterday_puzzle_reveal():從 queue 找昨日 (Day N-1) 題
-- ────────────────────────────────────────────────
create or replace function public.get_yesterday_puzzle_reveal()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_student_id uuid := auth.uid();
  v_today date := public.tw_today();
  v_day int;
  v_yesterday_pos int;
  v_puzzle_id uuid;
  v_puzzle public.daily_puzzles%rowtype;
begin
  if v_student_id is null then return null; end if;

  v_day := public.student_day_for(v_student_id);
  if v_day is null then return null; end if;

  v_yesterday_pos := v_day - 1;
  if v_yesterday_pos < 0 then return null; end if;  -- 今天才註冊,沒有昨天

  select puzzle_id into v_puzzle_id
  from public.student_puzzle_queues
  where student_id = v_student_id and position = v_yesterday_pos;

  if v_puzzle_id is null then return null; end if;

  select * into v_puzzle from public.daily_puzzles where id = v_puzzle_id;

  return jsonb_build_object(
    'puzzle_date', (v_today - interval '1 day')::date,
    'answer', v_puzzle.answer,
    'zh_name', v_puzzle.zh_name,
    'zh_description', v_puzzle.zh_description,
    'en_description', v_puzzle.en_description
  );
end;
$function$;


-- ────────────────────────────────────────────────
-- 11) 驗證
-- ────────────────────────────────────────────────

-- A. 表存在 + 索引
select table_name from information_schema.tables
where table_schema = 'public' and table_name = 'student_puzzle_queues';

-- B. 已存在的學生有沒有被 backfill?
select
  s.email,
  s.created_at::date as registered,
  count(spq.position) as queue_size,
  min(spq.position) as min_pos,
  max(spq.position) as max_pos,
  public.student_day_for(s.id) as today_day_n
from public.students s
left join public.student_puzzle_queues spq on spq.student_id = s.id
group by s.id, s.email, s.created_at
order by s.created_at;
-- 預期:每位 queue_size = daily_puzzles 中 is_guest_pool=false and is_active=true 的數量(目前 70)

-- C. trigger 存在
select tgname, tgrelid::regclass
from pg_trigger
where tgname in ('on_auth_user_created', 'on_daily_puzzle_inserted');
-- 預期 2 列

-- D. 拿你自己今天的題目 ID(看是不是隨機,跟 4/23 CARBON 不同)
select public.get_student_puzzle_for_today(auth.uid()) as my_today_puzzle_id;
-- 拿到 uuid → 對應 daily_puzzles 看是哪個字
