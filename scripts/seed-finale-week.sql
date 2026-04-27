-- ChemWordle 收尾週題目(6/26 → 6/30)
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run
-- 前置:已跑過 rpc-guest-pool-and-en.sql(zh_name/zh_description/en_description 欄位)
-- 後果:6/26-6/30 共 5 題上線,加上原本 4/23-6/25 的 64 題 = 共 69 題涵蓋整個活動

-- 防呆:若這 5 個日期已經有題目,先清掉
delete from public.daily_puzzles
where puzzle_date between '2026-06-26' and '2026-06-30';

-- 插入收尾週
insert into public.daily_puzzles
  (puzzle_date, answer, category, is_active, zh_name, zh_description, en_description)
values
  ('2026-06-26', 'IONIC',  'gen',     true, '離子的',
   '含離子鍵或離子組成的,如 NaCl、MgO。',
   'Composed of ions or characterized by ionic bonds; e.g., NaCl, MgO.'),

  ('2026-06-27', 'RUBBER', 'mat',     true, '橡膠',
   '高彈性高分子,天然(乳膠)或合成(SBR、丁腈橡膠等)。',
   'Highly elastic polymer; natural (latex) or synthetic (SBR, nitrile, etc.).'),

  ('2026-06-28', 'FLAME',  'gen',     true, '火焰',
   '燃燒產生的可見光熱現象;焰色測試是初等化學鑑定金屬離子的方法。',
   'The visible light from combustion; flame tests identify metal ions by color.'),

  ('2026-06-29', 'YIELD',  'reaction', true, '產率',
   '化學反應實際產物與理論產物的比值,常以百分比表示。',
   'Ratio of actual to theoretical product in a reaction, usually expressed as %.'),

  ('2026-06-30', 'ETHENE', 'organic', true, '乙烯',
   'C₂H₄,IUPAC 正式名(俗名 ethylene),合成聚乙烯(PE)的單體。',
   'C₂H₄; IUPAC name (commonly ethylene), monomer for polyethylene (PE).');


-- 驗證
select puzzle_date, answer, word_length, zh_name
from public.daily_puzzles
where puzzle_date between '2026-06-26' and '2026-06-30'
order by puzzle_date;
-- 預期 5 列:6/26 IONIC 5 / 6/27 RUBBER 6 / 6/28 FLAME 5 / 6/29 YIELD 5 / 6/30 ETHENE 6
