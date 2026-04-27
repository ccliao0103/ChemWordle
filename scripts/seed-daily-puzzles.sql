-- ═══════════════════════════════════════════════════════════════════
-- ChemWordle 排程題庫 + 訪客池(初版)
--
-- 用法:整段複製貼到 Supabase SQL Editor → Run
--
-- 內容:
--   1. 補 4/23 既有的 CARBON 加上 en_description(其餘已補)
--   2. 排程 4/24 → 6/25 共 63 題每日題目(混合 5 字 + 6 字,易→難分布)
--   3. 訪客池 21 題(無日期,is_guest_pool=true,訪客每次隨機抽)
--
-- 6/26 → 6/30 (5 天) 故意留空作為比賽收尾週,前端顯示「今日題目尚未開放」
--
-- 前置:已經跑過 rpc-guest-pool-and-en.sql(en_description / is_guest_pool 欄位)
-- ═══════════════════════════════════════════════════════════════════


-- ─── 0) 清掉未來日期的 daily(若之前測試插過)+ 清空舊訪客池 ──
delete from public.daily_puzzles where puzzle_date >= '2026-04-24';
delete from public.daily_puzzles where is_guest_pool = true;


-- ─── 1) 4/23 既有的 CARBON,補上 en_description ──
update public.daily_puzzles
set en_description = 'Atomic number 6, the backbone element of all organic compounds.'
where puzzle_date = '2026-04-23' and answer = 'CARBON';


-- ─── 2) 每日題排程 4/24 → 6/25(63 題) ──────
insert into public.daily_puzzles
  (puzzle_date, answer, category, is_active, zh_name, zh_description, en_description)
values
  ('2026-04-24', 'OXYGEN', 'element', true, '氧', '原子序 8,大氣中第二豐富的氣體,支持燃燒與呼吸。', 'Atomic number 8, second most abundant atmospheric gas; supports combustion and respiration.'),
  ('2026-04-25', 'WATER',  'gen',     true, '水', 'H₂O,生命之源,通用溶劑。', 'H₂O; the universal solvent and source of life.'),
  ('2026-04-26', 'SODIUM', 'element', true, '鈉', '原子序 11 (Na),鹼金屬,常見於食鹽 NaCl。', 'Atomic number 11 (Na), alkali metal commonly found in table salt (NaCl).'),
  ('2026-04-27', 'SILVER', 'element', true, '銀', '原子序 47 (Ag),貴金屬,導電性在金屬中居冠。', 'Atomic number 47 (Ag), precious metal with the highest electrical conductivity among metals.'),
  ('2026-04-28', 'COPPER', 'element', true, '銅', '原子序 29 (Cu),電線與管線的主要材料。', 'Atomic number 29 (Cu), primary material for electrical wiring and pipes.'),
  ('2026-04-29', 'METAL',  'element', true, '金屬', '金屬元素的單數通稱。', 'Singular term for metallic elements.'),
  ('2026-04-30', 'SOLID',  'gen',     true, '固體', '物質三態之一,有固定形狀與體積。', 'One of the three states of matter; has both fixed shape and volume.'),
  ('2026-05-01', 'ATOMIC', 'desc',    true, '原子的', '原子層次的;如 atomic mass 原子量。', 'Relating to atoms; e.g., atomic mass.'),
  ('2026-05-02', 'COBALT', 'element', true, '鈷', '原子序 27 (Co),鋰電池正極材料,磁性金屬。', 'Atomic number 27 (Co), cathode material in lithium-ion batteries; a magnetic metal.'),
  ('2026-05-03', 'SULFUR', 'element', true, '硫', '原子序 16 (S),黃色非金屬,火山氣體常見成分。', 'Atomic number 16 (S), yellow nonmetal commonly found in volcanic emissions.'),
  ('2026-05-04', 'HELIUM', 'element', true, '氦', '原子序 2 (He),宇宙第二豐富元素,氣球與低溫實驗用氣。', 'Atomic number 2 (He), the second most abundant element in the universe; used in balloons and cryogenics.'),
  ('2026-05-05', 'ARGON',  'element', true, '氬', '原子序 18 (Ar),惰性氣體,焊接保護氣體。', 'Atomic number 18 (Ar), noble gas used as shielding gas in welding.'),
  ('2026-05-06', 'IODINE', 'element', true, '碘', '原子序 53 (I),紫黑色固體,常用殺菌劑。', 'Atomic number 53 (I), purple-black solid, common antiseptic.'),
  ('2026-05-07', 'NICKEL', 'element', true, '鎳', '原子序 28 (Ni),不銹鋼合金重要成分。', 'Atomic number 28 (Ni), key alloying element in stainless steel.'),
  ('2026-05-08', 'ENERGY', 'phys-chem', true, '能量', '物理化學基本量,單位焦耳(J)。', 'Fundamental physical quantity, measured in joules (J).'),
  ('2026-05-09', 'ESTER',  'organic', true, '酯', 'R-COO-R'' 官能基,水果香味的來源。', 'R-COO-R'' functional group; source of fruit fragrances.'),
  ('2026-05-10', 'ETHER',  'organic', true, '醚', 'R-O-R 官能基,常用麻醉劑。', 'R-O-R functional group; once used as anesthetic.'),
  ('2026-05-11', 'ETHANE', 'organic', true, '乙烷', 'C₂H₆,最簡單的烷烴之一,天然氣成分。', 'C₂H₆, simplest alkane after methane; component of natural gas.'),
  ('2026-05-12', 'METHYL', 'organic', true, '甲基', 'CH₃- 取代基,最小的烷基。', 'The CH₃- substituent; smallest alkyl group.'),
  ('2026-05-13', 'AMINE',  'organic', true, '胺', 'R-NH₂ 官能基,含氮化合物。', 'R-NH₂ functional group; nitrogen-containing organic compound.'),
  ('2026-05-14', 'SUGAR',  'biochem', true, '糖', '單醣或雙醣總稱,如葡萄糖、蔗糖。', 'Mono- or disaccharides; e.g., glucose, sucrose.'),
  ('2026-05-15', 'LIPID',  'biochem', true, '脂質', '油脂、磷脂等不溶於水的有機分子。', 'Fats, phospholipids, and other water-insoluble organic molecules.'),
  ('2026-05-16', 'OXIDE',  'inorg',   true, '氧化物', '含氧化合物的單數形式。', 'Singular form of oxygen-containing compounds.'),
  ('2026-05-17', 'OXIDES', 'inorg',   true, '氧化物(複)', '含氧的化合物通稱。', 'Plural of oxide; general term for oxygen-containing compounds.'),
  ('2026-05-18', 'PROTON', 'phys-chem', true, '質子', '氫原子核,帶正電基本粒子。', 'Hydrogen nucleus; positively charged subatomic particle.'),
  ('2026-05-19', 'ALKENE', 'organic', true, '烯烴', '含 C=C 雙鍵的烴類。', 'Hydrocarbons containing C=C double bonds.'),
  ('2026-05-20', 'HEXANE', 'organic', true, '己烷', 'C₆H₁₄,常用非極性溶劑,萃取脂溶性物質。', 'C₆H₁₄, common nonpolar solvent for extracting fats and oils.'),
  ('2026-05-21', 'BUTANE', 'organic', true, '丁烷', 'C₄H₁₀,打火機燃料。', 'C₄H₁₀, fuel in cigarette lighters.'),
  ('2026-05-22', 'VOLUME', 'gen',     true, '體積', '佔用空間的量,單位常用 L 或 mL。', 'The amount of space occupied; usually measured in L or mL.'),
  ('2026-05-23', 'LIQUID', 'gen',     true, '液體', '物質三態之一,有固定體積但無固定形狀。', 'One of the three states of matter; has fixed volume but no fixed shape.'),
  ('2026-05-24', 'ENZYME', 'biochem', true, '酵素', '生物體內的蛋白質催化劑,加速反應但本身不被消耗。', 'Biological protein catalyst that speeds up reactions without being consumed.'),
  ('2026-05-25', 'MOLAR',  'gen',     true, '莫耳的', '與莫耳濃度相關的形容詞,如 molar mass。', 'Relating to molarity; e.g., molar mass.'),
  ('2026-05-26', 'POLAR',  'gen',     true, '極性的', '分子有偶極矩,如水。', 'Having a dipole moment, like water molecules.'),
  ('2026-05-27', 'STEAM',  'gen',     true, '蒸氣', '水的氣態。', 'The gaseous state of water.'),
  ('2026-05-28', 'OZONE',  'organic', true, '臭氧', 'O₃,大氣保護層成分,強氧化劑。', 'O₃, component of the atmospheric ozone layer; strong oxidizer.'),
  ('2026-05-29', 'ANODE',  'gen',     true, '陽極', '電解時正極(氧化反應發生處)。', 'The positive electrode in electrolysis (where oxidation occurs).'),
  ('2026-05-30', 'ALLOY',  'gen',     true, '合金', '兩種以上金屬熔合的混合物,如不銹鋼。', 'A mixture of two or more metals, e.g., stainless steel.'),
  ('2026-05-31', 'KETONE', 'organic', true, '酮', '含羰基 C=O 的官能基,兩側皆為碳。', 'Functional group with a C=O carbonyl flanked by two carbon groups.'),
  ('2026-06-01', 'ACIDIC', 'desc',    true, '酸的', '具酸性,pH < 7。', 'Having acidic properties; pH < 7.'),
  ('2026-06-02', 'MICRO',  'gen',     true, '微', '表示「百萬分之一」的字首,如 microliter (µL)。', 'Prefix meaning "one-millionth", as in microliter (µL).'),
  ('2026-06-03', 'BORON',  'element', true, '硼', '原子序 5 (B),類金屬,玻璃添加劑。', 'Atomic number 5 (B), metalloid; additive in glass.'),
  ('2026-06-04', 'LASER',  'physics', true, '雷射', '受激輻射光放大,常用於光譜實驗。', 'Light Amplification by Stimulated Emission of Radiation; common in spectroscopy.'),
  ('2026-06-05', 'PHOTON', 'phys-chem', true, '光子', '光的基本粒子,量子化的電磁輻射。', 'Quantum of light; the basic particle of electromagnetic radiation.'),
  ('2026-06-06', 'AMIDE',  'organic', true, '醯胺', 'R-CO-NH-R'' 官能基,蛋白質基本鍵結。', 'R-CO-NH-R'' functional group; the basic linkage in proteins.'),
  ('2026-06-07', 'GLYCOL', 'organic', true, '乙二醇', 'HOCH₂CH₂OH,主要為乙二醇,防凍液原料。', 'HOCH₂CH₂OH, mainly ethylene glycol; raw material for antifreeze.'),
  ('2026-06-08', 'PHENOL', 'organic', true, '苯酚', '芳香族醇類,具殺菌性,也是許多合成材料的原料。', 'An aromatic alcohol with antiseptic properties; raw material for many synthetics.'),
  ('2026-06-09', 'XENON',  'element', true, '氙', '原子序 54 (Xe),惰性氣體,氙氣燈。', 'Atomic number 54 (Xe), noble gas used in xenon arc lamps.'),
  ('2026-06-10', 'ALKYNE', 'organic', true, '炔烴', '含 C≡C 三鍵的烴類。', 'Hydrocarbons containing C≡C triple bonds.'),
  ('2026-06-11', 'ANIONS', 'inorg',   true, '陰離子(複)', '帶負電的離子(複數)。', 'Negatively charged ions (plural).'),
  ('2026-06-12', 'CATION', 'inorg',   true, '陽離子', '帶正電的離子。', 'Positively charged ion.'),
  ('2026-06-13', 'DIPOLE', 'phys-chem', true, '偶極', '分子中正負電荷中心不重合,產生偶極矩。', 'A separation of positive and negative charges in a molecule, creating a dipole moment.'),
  ('2026-06-14', 'IODIDE', 'inorg',   true, '碘化物', 'I⁻ 陰離子化合物,如碘化鉀 KI。', 'Compounds containing the I⁻ anion, e.g., potassium iodide (KI).'),
  ('2026-06-15', 'HALIDE', 'inorg',   true, '鹵化物', '鹵素陰離子化合物的通稱。', 'General term for compounds containing halogen anions.'),
  ('2026-06-16', 'ISOMER', 'organic', true, '異構物', '分子式相同但原子連接方式不同的化合物。', 'Compounds with the same molecular formula but different atomic arrangements.'),
  ('2026-06-17', 'PLASMA', 'phys-chem', true, '電漿', '物質第四態,離子化氣體;太陽即為電漿態。', 'The fourth state of matter; ionized gas, like the sun.'),
  ('2026-06-18', 'FUSION', 'phys-chem', true, '融合', '核融合(fusion)或熔化(melting)。', 'Nuclear fusion (combining nuclei) or melting (solid to liquid).'),
  ('2026-06-19', 'VACUUM', 'phys-chem', true, '真空', '接近無氣體的狀態,壓力遠低於大氣。', 'A near-absence of gas; pressure far below atmospheric.'),
  ('2026-06-20', 'QUARTZ', 'mat',     true, '石英', 'SiO₂ 結晶形式,用於光學與計時元件。', 'Crystalline form of SiO₂, used in optics and timing devices.'),
  ('2026-06-21', 'BUFFER', 'lab',     true, '緩衝液', '維持 pH 穩定的溶液,由弱酸與其共軛鹼構成。', 'A solution that resists pH change, made of a weak acid and its conjugate base.'),
  ('2026-06-22', 'SOLUTE', 'gen',     true, '溶質', '溶液中被溶解的物質。', 'The substance dissolved in a solution.'),
  ('2026-06-23', 'STERIC', 'desc',    true, '立體的', '立體阻礙效應,影響反應速率與選擇性。', 'Relating to spatial arrangement; steric hindrance affects reaction rates.'),
  ('2026-06-24', 'LIGAND', 'inorg',   true, '配基', '配位化學中,與中心金屬原子配位鍵結的原子團。', 'An atom or molecule that bonds to a central metal atom in coordination chemistry.'),
  ('2026-06-25', 'ETHYNE', 'organic', true, '乙炔', 'C₂H₂,又稱 acetylene,焊接用氣。', 'C₂H₂, also called acetylene; used in welding.');


-- ─── 3) 訪客池 21 題(無日期,is_guest_pool=true) ───
insert into public.daily_puzzles
  (puzzle_date, answer, category, is_active, is_guest_pool, zh_name, zh_description, en_description)
values
  -- 元素(11):基礎、常見
  (null, 'CARBON', 'element', true, true, '碳', '原子序 6,所有有機化合物的骨架元素。', 'Atomic number 6, the backbone element of all organic compounds.'),
  (null, 'OXYGEN', 'element', true, true, '氧', '原子序 8,大氣中第二豐富的氣體,支持燃燒與呼吸。', 'Atomic number 8, second most abundant atmospheric gas; supports combustion and respiration.'),
  (null, 'SILVER', 'element', true, true, '銀', '原子序 47 (Ag),貴金屬,導電性在金屬中居冠。', 'Atomic number 47 (Ag), precious metal with the highest electrical conductivity among metals.'),
  (null, 'COPPER', 'element', true, true, '銅', '原子序 29 (Cu),電線與管線的主要材料。', 'Atomic number 29 (Cu), primary material for electrical wiring and pipes.'),
  (null, 'NICKEL', 'element', true, true, '鎳', '原子序 28 (Ni),不銹鋼合金重要成分。', 'Atomic number 28 (Ni), key alloying element in stainless steel.'),
  (null, 'SODIUM', 'element', true, true, '鈉', '原子序 11 (Na),鹼金屬,常見於食鹽 NaCl。', 'Atomic number 11 (Na), alkali metal commonly found in table salt (NaCl).'),
  (null, 'IODINE', 'element', true, true, '碘', '原子序 53 (I),紫黑色固體,常用殺菌劑。', 'Atomic number 53 (I), purple-black solid, common antiseptic.'),
  (null, 'COBALT', 'element', true, true, '鈷', '原子序 27 (Co),鋰電池正極材料,磁性金屬。', 'Atomic number 27 (Co), cathode material in lithium-ion batteries.'),
  (null, 'SULFUR', 'element', true, true, '硫', '原子序 16 (S),黃色非金屬,火山氣體常見成分。', 'Atomic number 16 (S), yellow nonmetal common in volcanic emissions.'),
  (null, 'HELIUM', 'element', true, true, '氦', '原子序 2 (He),宇宙第二豐富元素,氣球與低溫實驗用氣。', 'Atomic number 2 (He), used in balloons and cryogenics.'),
  (null, 'METAL',  'element', true, true, '金屬', '金屬元素的單數通稱。', 'Singular term for metallic elements.'),

  -- 有機(5)
  (null, 'ETHANE', 'organic', true, true, '乙烷', 'C₂H₆,最簡單的烷烴之一,天然氣成分。', 'C₂H₆, simplest alkane after methane.'),
  (null, 'ALKENE', 'organic', true, true, '烯烴', '含 C=C 雙鍵的烴類。', 'Hydrocarbons containing C=C double bonds.'),
  (null, 'HEXANE', 'organic', true, true, '己烷', 'C₆H₁₄,常用非極性溶劑。', 'C₆H₁₄, common nonpolar solvent.'),
  (null, 'BUTANE', 'organic', true, true, '丁烷', 'C₄H₁₀,打火機燃料。', 'C₄H₁₀, fuel in cigarette lighters.'),
  (null, 'OZONE',  'organic', true, true, '臭氧', 'O₃,大氣保護層成分,強氧化劑。', 'O₃, component of the atmospheric ozone layer.'),

  -- 通用(5)
  (null, 'ENZYME', 'biochem', true, true, '酵素', '生物催化劑,加速反應但本身不被消耗。', 'Biological catalyst that speeds up reactions without being consumed.'),
  (null, 'PROTON', 'phys-chem', true, true, '質子', '氫原子核,帶正電基本粒子。', 'Hydrogen nucleus; positively charged particle.'),
  (null, 'ENERGY', 'phys-chem', true, true, '能量', '物理化學基本量,單位焦耳(J)。', 'Fundamental physical quantity in joules (J).'),
  (null, 'OXIDES', 'inorg',   true, true, '氧化物(複)', '含氧化合物通稱。', 'General term for oxygen-containing compounds.'),
  (null, 'LIQUID', 'gen',     true, true, '液體', '物質三態之一,有固定體積但無固定形狀。', 'One of the three states of matter.'),

  -- 額外好玩的(1)
  (null, 'WATER',  'gen',     true, true, '水', 'H₂O,生命之源,通用溶劑。', 'H₂O; the universal solvent and source of life.');


-- ─── 4) 驗證 ──────────────────────────
select
  count(*) filter (where is_guest_pool = false and puzzle_date is not null) as daily_count,
  count(*) filter (where is_guest_pool = true) as guest_pool_count,
  min(puzzle_date) filter (where is_guest_pool = false) as first_date,
  max(puzzle_date) filter (where is_guest_pool = false) as last_date
from public.daily_puzzles;
-- 預期:daily_count = 64 (含 4/23 的 CARBON), guest_pool_count = 21,
--       first_date = 2026-04-23, last_date = 2026-06-25
