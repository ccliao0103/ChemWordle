-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle batch3 整併:
--   1. 停用複數題目 OXIDES、ANIONS
--   2. 加入 5 題訪客池(SILICA POROUS REDUCE VAPOR IONIZE)
--   3. 加入 4 題每日題庫(CHIRAL DOPING HEXENE DIENE)
--   4. 重洗所有學生的 queue(讓現有測試者也拿到乾淨無複數的題序)
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run
-- 注意:會清掉 in-progress 進行中的 sessions(若有測試者正在玩,他們會
--      重新從第一格開始,但已完成的 attempts 紀錄不受影響)。
-- ═══════════════════════════════════════════════════════════════════


-- ─── 1) 停用複數題目(不刪,避免 FK 問題) ──
update public.daily_puzzles
  set is_active = false
where answer in ('OXIDES', 'ANIONS');


-- ─── 2) 加入 5 題訪客池 ─────────────────
insert into public.daily_puzzles
  (puzzle_date, answer, category, is_active, is_guest_pool, zh_name, zh_description, en_description)
values
  (null, 'SILICA', 'mat', true, true, '二氧化矽',
   'SiO₂,玻璃、石英、矽膠的主要成分。',
   'SiO₂; main component of glass, quartz, and silica gel.'),
  (null, 'POROUS', 'mat', true, true, '多孔的',
   '含有許多微小孔洞的材料,如沸石、活性碳、海綿。',
   'Containing many tiny pores; e.g., zeolites, activated carbon, sponges.'),
  (null, 'REDUCE', 'reaction', true, true, '還原',
   '獲得電子(氧化態降低)的化學反應;與氧化相對。',
   'Gaining electrons (oxidation state decreases); opposite of oxidation.'),
  (null, 'VAPOR', 'gen', true, true, '蒸氣',
   '物質的氣態(美式拼法;英式為 vapour)。',
   'The gaseous state of a substance (US spelling; UK uses "vapour").'),
  (null, 'IONIZE', 'phys-chem', true, true, '解離',
   '中性原子或分子獲得 / 失去電子變成離子。',
   'Neutral atoms or molecules gaining or losing electrons to form ions.');


-- ─── 3) 加入 4 題每日題庫(以 7/1-7/4 占位日期,per-user queue 下日期僅 metadata)──
insert into public.daily_puzzles
  (puzzle_date, answer, category, is_active, zh_name, zh_description, en_description)
values
  ('2026-07-01', 'CHIRAL', 'organic', true, '掌性的',
   '分子有不對稱中心,左右手對映異構,如胺基酸。',
   'Having a non-superimposable mirror image; e.g., most amino acids.'),
  ('2026-07-02', 'DOPING', 'mat', true, '摻雜',
   '在純物質中加入少量雜質改變性質,如半導體、ITO 透明導電膜。',
   'Adding small amounts of impurities to alter properties (e.g., semiconductors).'),
  ('2026-07-03', 'HEXENE', 'organic', true, '己烯',
   'C₆H₁₂,六碳烯烴,如 1-己烯。',
   'C₆H₁₂; a six-carbon alkene, e.g., 1-hexene.'),
  ('2026-07-04', 'DIENE', 'organic', true, '二烯',
   '含 2 個 C=C 雙鍵的烴類,如丁二烯。',
   'Hydrocarbons with two C=C double bonds, e.g., butadiene.');


-- ─── 4) 重洗所有學生的 queue ─────────────
-- (確保現有 4 位測試者的 queue 不會還含有 OXIDES/ANIONS,且涵蓋新的 4 題)
delete from public.guess_sessions where is_complete = false;
truncate public.student_puzzle_queues;

do $$
declare v_student record;
begin
  for v_student in select id from public.students loop
    perform public.shuffle_round_for_student(v_student.id);
  end loop;
end$$;


-- ─── 5) 驗證 ─────────────────────────
select
  (select count(*) from public.daily_puzzles where is_guest_pool=false and is_active=true) as daily_active,
  (select count(*) from public.daily_puzzles where is_guest_pool=false and is_active=false) as daily_inactive,
  (select count(*) from public.daily_puzzles where is_guest_pool=true and is_active=true) as guest_active,
  (select count(distinct student_id) from public.student_puzzle_queues) as students_reshuffled,
  (select max(position) from public.student_puzzle_queues) as max_position;
-- 預期:
--   daily_active = 72 (was 70 - 2 deactivated + 4 new)
--   daily_inactive = 2 (OXIDES, ANIONS)
--   guest_active = 26 (was 21 + 5 new)
--   students_reshuffled = 4
--   max_position = 71 (positions 0..71 = 72 items per queue)
