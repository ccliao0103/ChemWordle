# ChemWordle 題庫擴充 — batch5 候選(147 題)

接續 batch4。方向:**無機鹽類、電化學、光譜、熱力學、儀器分析、石化、環境、綠色化學**。

**依 batch4 的回饋,本批只收 ★ 與 ★★,不出 ★★★。** 一樣排除所有複數形。

## 篩法

- **不要的**:整列刪掉
- **要改的**:中文 / 描述直接改
- **訪客池**:想放的在「訪客」欄填 ✓
- 篩完跟我說「**batch4+5 篩好了**」,我一次產 SQL 全部入庫

## 狀態說明

- 147 題全部通過檢查:**無重複(含跨 batch4)、長度合格(5-6)、無複數**
- ⚠️ = 不在 ENABLE 一般英文字典(正規化學詞,入庫後 trigger 自動加進可猜字典)
- 👤 = **人名衍生詞**,你可能會想拿掉(LEWIS / FERMI / RAMAN / GIBBS)。
  單位類的(JOULE / KELVIN / PASCAL / NEWTON / HERTZ / TESLA / DEBYE / GAUSS / FARAD / AMPERE)
  已經是普通名詞,我沒標記。

---

## 1. 原子結構 / 週期表(9 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| ANION | 陰離子 | gen | ★ |   | 帶負電的離子,原子得到電子後形成。 | A negatively charged ion, formed by gaining electrons. |
| OCTET | 八隅體 | gen | ★ |   | 八隅體規則:原子傾向讓最外層有 8 個電子。 | The octet rule: atoms tend to reach eight outer-shell electrons. |
| NOBLE | 惰性的 | gen | ★ |   | 惰性氣體最外層電子已填滿,極不反應。 | Noble gases have full outer shells and barely react. |
| GROUP | 族 | gen | ★ |   | 週期表的直行,同族元素價電子數相同。 | A column of the periodic table; same-group elements share valence count. |
| PERIOD | 週期 | gen | ★ |   | 週期表的橫列,同週期元素電子層數相同。 | A row of the periodic table; same-period elements share shell count. |
| SHELL | 電子層 | gen | ★ |   | 電子繞核運行的能階分層。 | An energy level in which electrons orbit the nucleus. |
| ORBIT | 軌道 | gen | ★ |   | 電子環繞原子核的路徑(波耳模型)。 | The path of an electron around the nucleus (Bohr model). |
| MATTER | 物質 | gen | ★ |   | 具有質量並佔據空間的東西。 | Anything that has mass and occupies space. |
| LEVEL | 能階 | phys-chem | ★ |   | 電子可占據的離散能量狀態。 | A discrete energy state an electron can occupy. |

## 2. 化學鍵(6 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| LEWIS 👤 | 路易斯 | gen | ★★ |   | 路易斯結構用點表示價電子;路易斯酸接受電子對。 | Lewis structures show valence electrons as dots; a Lewis acid accepts an electron pair. |
| ANGLE | 鍵角 | gen | ★ |   | 兩個化學鍵之間的夾角,如水的 104.5°。 | The angle between two bonds, e.g., 104.5° in water. |
| LENGTH | 鍵長 | gen | ★ |   | 兩個成鍵原子核之間的距離。 | The distance between the nuclei of two bonded atoms. |
| MOMENT | 矩 | phys-chem | ★★ |   | 偶極矩衡量分子電荷分布的不對稱程度。 | Dipole moment measures how unevenly charge is distributed. |
| FERMI 👤 | 費米 | phys-chem | ★★ |   | 費米能階是電子填滿的最高能階。 | The Fermi level is the highest energy level filled by electrons. |
| FORMAL | 形式的 | gen | ★★ |   | 形式電荷用來判斷哪個路易斯結構較合理。 | Formal charge helps decide which Lewis structure is more reasonable. |

## 3. 無機物 / 合金(8 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| BORIDE | 硼化物 | gen | ★★ |   | 硼與金屬形成的化合物,硬度極高。 | Compounds of boron with metals; extremely hard. |
| BORAX | 硼砂 | gen | ★ |   | Na₂B₄O₇·10H₂O,清潔劑與玻璃原料。 | Na₂B₄O₇·10H₂O; used in cleaners and glassmaking. |
| POTASH | 碳酸鉀 | gen | ★★ |   | 含鉀化合物的統稱,主要用作肥料。 | A general term for potassium compounds, mainly used as fertilizer. |
| CHALK | 白堊 | mat | ★ |   | 主成分為碳酸鈣的軟質沉積岩。 | A soft sedimentary rock made mostly of calcium carbonate. |
| BRASS | 黃銅 | mat | ★ |   | 銅與鋅的合金。 | An alloy of copper and zinc. |
| BRONZE | 青銅 | mat | ★ |   | 銅與錫的合金,人類最早的合金之一。 | An alloy of copper and tin; one of humanity's earliest alloys. |
| SOLDER | 焊錫 | mat | ★ |   | 低熔點合金,用於接合金屬。 | A low-melting alloy used to join metals. |
| LITMUS | 石蕊 | analytical | ★ |   | 石蕊試紙:遇酸變紅、遇鹼變藍。 | Litmus paper turns red in acid and blue in base. |

## 4. 酸鹼與化學計量(7 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| DONOR | 予體 | gen | ★★ |   | 提供電子對或質子的物種。 | A species that supplies an electron pair or a proton. |
| STRONG | 強的 | gen | ★ |   | 強酸強鹼在水中完全解離。 | Strong acids and bases dissociate completely in water. |
| EXCESS | 過量 | gen | ★ |   | 反應中沒被完全消耗的試劑。 | The reagent not fully consumed in a reaction. |
| LIMIT | 限量 | gen | ★ |   | 限量試劑決定反應產物的最大量。 | The limiting reagent caps how much product can form. |
| ORDER | 級數 | phys-chem | ★★ |   | 反應級數描述速率與濃度的關係。 | Reaction order describes how rate depends on concentration. |
| CHAIN | 鏈 | organic | ★ |   | 連續相接的原子,如碳鏈;也指連鎖反應。 | A run of connected atoms (carbon chain); also a chain reaction. |
| AGENT | 試劑 | reaction | ★ |   | 引起特定反應的物質,如氧化劑。 | A substance causing a specific reaction, e.g., an oxidizing agent. |

## 5. 單位與常數(11 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| JOULE | 焦耳 | phys-chem | ★ |   | 能量的 SI 單位(J)。 | The SI unit of energy (J). |
| KELVIN | 凱氏溫標 | phys-chem | ★ |   | 絕對溫度的 SI 單位(K),0 K 是絕對零度。 | The SI unit of absolute temperature (K); 0 K is absolute zero. |
| PASCAL | 帕斯卡 | phys-chem | ★ |   | 壓力的 SI 單位(Pa)。 | The SI unit of pressure (Pa). |
| NEWTON | 牛頓 | phys-chem | ★ |   | 力的 SI 單位(N)。 | The SI unit of force (N). |
| HERTZ | 赫茲 | phys-chem | ★ |   | 頻率的 SI 單位(Hz),每秒振動次數。 | The SI unit of frequency (Hz), cycles per second. |
| TESLA | 特斯拉 | phys-chem | ★★ |   | 磁場強度單位(T);NMR 儀器常以此標示規格。 | The unit of magnetic field strength (T); used to rate NMR magnets. |
| DEBYE | 德拜 | phys-chem | ★★ |   | 偶極矩的單位(D)。 | The unit of dipole moment (D). |
| GAUSS | 高斯 | phys-chem | ★★ |   | 磁場強度的 CGS 單位,1 T = 10⁴ G。 | The CGS unit of magnetic field; 1 T = 10⁴ G. |
| FARAD | 法拉 | phys-chem | ★★ |   | 電容的 SI 單位(F)。 | The SI unit of capacitance (F). |
| AMPERE | 安培 | phys-chem | ★ |   | 電流的 SI 單位(A)。 | The SI unit of electric current (A). |
| DEGREE | 度 | gen | ★ |   | 溫度或角度的度量單位。 | A unit of temperature or of angle. |

## 6. 光譜學(8 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| RAMAN 👤 | 拉曼 | analytical | ★★ |   | 拉曼光譜量測分子振動造成的散射頻移。 | Raman spectroscopy measures scattering shifts from molecular vibrations. |
| ABSORB | 吸收 | phys-chem | ★ |   | 物質吸收特定波長的光,是吸收光譜的基礎。 | Matter taking in light at specific wavelengths — the basis of absorption spectroscopy. |
| EXCITE | 激發 | phys-chem | ★ |   | 讓電子從低能階躍遷到高能階。 | To promote an electron from a lower to a higher energy level. |
| GROUND | 基態 | phys-chem | ★ |   | 基態是能量最低、最穩定的狀態。 | The ground state is the lowest-energy, most stable state. |
| SHIFT | 位移 | analytical | ★★ |   | 化學位移(δ)是 NMR 判別官能基的關鍵。 | Chemical shift (δ) is how NMR distinguishes functional groups. |
| FIELD | 場 | phys-chem | ★ |   | 磁場或電場;NMR 的磁場強度決定解析度。 | A magnetic or electric field; NMR field strength sets resolution. |
| SIGNAL | 訊號 | analytical | ★ |   | 儀器偵測到的輸出,通常與濃度成正比。 | The instrument output, usually proportional to concentration. |
| NOISE | 雜訊 | analytical | ★ |   | 訊號中的隨機干擾,決定偵測極限。 | Random interference in a signal; sets the detection limit. |

## 7. 儀器分析(19 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| COLUMN | 管柱 | analytical | ★ |   | 層析用的填充管,分離混合物的核心元件。 | The packed tube in chromatography where separation happens. |
| MATRIX | 基質 | analytical | ★★ |   | 樣品中除了待測物以外的所有成分。 | Everything in a sample other than the analyte. |
| TORCH | 炬管 | analytical | ★★ |   | ICP 的石英炬管,產生高溫電漿。 | The quartz torch in ICP that generates the hot plasma. |
| SAMPLE | 樣品 | analytical | ★ |   | 拿來分析的那一份物質。 | The portion of material taken for analysis. |
| INJECT | 注射 | analytical | ★ |   | 把樣品導入儀器的動作。 | Introducing the sample into the instrument. |
| DETECT | 偵測 | analytical | ★ |   | 找出並量測目標物的存在。 | To find and measure the presence of a target substance. |
| TRACE | 微量 | analytical | ★ |   | 極低濃度的成分,常以 ppm 或 ppb 表示。 | A component at very low concentration, often ppm or ppb. |
| DILUTE | 稀釋 | gen | ★ |   | 加入溶劑降低濃度。 | To lower concentration by adding solvent. |
| STOCK | 儲備液 | analytical | ★ |   | 高濃度的母液,使用時再稀釋。 | A concentrated solution diluted before use. |
| WEIGH | 秤重 | lab | ★ |   | 用天平測定質量。 | To measure mass with a balance. |
| PLATE | 板 | analytical | ★ |   | 薄層層析的板;理論板數也用來衡量管柱效率。 | A TLC plate; "plates" also measure column efficiency. |
| CHARGE | 電荷 | gen | ★ |   | 離子或粒子所帶的電量。 | The amount of electricity carried by an ion or particle. |
| PURGE | 吹淨 | lab | ★★ |   | 通入惰性氣體趕走空氣或揮發物。 | Sweeping out air or volatiles with an inert gas. |
| RINSE | 潤洗 | lab | ★ |   | 用溶劑沖洗器皿或管柱。 | Washing glassware or a column with solvent. |
| SEPTUM | 隔膜 | lab | ★★ |   | 可被針頭刺穿又能自封的橡膠墊片。 | A rubber disc a needle can pierce that reseals itself. |
| SPIKE | 加標 | analytical | ★★ |   | 刻意加入已知量的標準品以驗證回收率。 | Adding a known amount of standard to check recovery. |
| CURVE | 曲線 | analytical | ★ |   | 檢量線:濃度對訊號的關係圖。 | A calibration curve plots signal against concentration. |
| SLOPE | 斜率 | analytical | ★ |   | 檢量線的斜率代表方法的靈敏度。 | The calibration slope represents method sensitivity. |
| RANGE | 範圍 | analytical | ★ |   | 方法可準確定量的濃度區間。 | The concentration span over which a method is accurate. |

## 8. 熱力學(8 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| GIBBS 👤 ⚠️ | 吉布斯 | phys-chem | ★★ |   | 吉布斯自由能 ΔG 判斷反應是否自發。 | Gibbs free energy ΔG tells whether a reaction is spontaneous. |
| SYSTEM | 系統 | phys-chem | ★ |   | 熱力學中被研究的那一部分,其餘稱為環境。 | The part under study in thermodynamics; the rest is the surroundings. |
| STATE | 狀態 | phys-chem | ★ |   | 由溫度、壓力等決定的系統條件;狀態函數與路徑無關。 | A system's condition set by T, P, etc.; state functions are path-independent. |
| CYCLE | 循環 | phys-chem | ★ |   | 回到初始狀態的一連串過程,如卡諾循環。 | A series of processes returning to the starting state, e.g., the Carnot cycle. |
| FREEZE | 凝固 | gen | ★ |   | 液體降溫轉為固體。 | A liquid turning solid on cooling. |
| TEMPER | 回火 | mat | ★★ |   | 淬火後再加熱至較低溫,降低脆性。 | Reheating after quenching to reduce brittleness. |
| IDEAL | 理想的 | phys-chem | ★ |   | 理想氣體假設分子無體積、無交互作用。 | An ideal gas has no molecular volume and no interactions. |
| FLUID | 流體 | gen | ★ |   | 可流動的物質,包含液體與氣體。 | A substance that flows — liquids and gases. |

## 9. 動力學與催化(6 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| ACTIVE | 活性的 | reaction | ★ |   | 活性位點是催化劑上真正發生反應的地方。 | The active site is where the reaction actually occurs on a catalyst. |
| ADSORB | 吸附 | phys-chem | ★★ |   | 分子附著在固體表面(不是進入內部)。 | Molecules sticking to a solid surface (not entering the bulk). |
| DESORB | 脫附 | phys-chem | ★★ |   | 吸附的分子離開表面。 | Adsorbed molecules leaving the surface. |
| UPTAKE | 吸收量 | phys-chem | ★★ |   | 材料所能吸附或儲存的量。 | How much a material can adsorb or store. |
| POISON | 毒化 | reaction | ★★ |   | 雜質吸附在催化劑活性位點使其失效。 | An impurity that blocks a catalyst's active sites. |
| BUBBLE | 氣泡 | gen | ★ |   | 液體中的氣體球;通氣常用於反應或除氧。 | A gas sphere in liquid; bubbling is used to react or deoxygenate. |

## 10. 晶體 / 固態(8 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| CUBIC | 立方的 | mat | ★ |   | 立方晶系,如 NaCl 的面心立方結構。 | The cubic crystal system, e.g., NaCl's face-centred cubic lattice. |
| PLANE | 晶面 | mat | ★ |   | 晶體中由米勒指數描述的原子平面。 | An atomic plane in a crystal, described by Miller indices. |
| FACET | 晶面 | mat | ★★ |   | 晶體外露的平整表面,不同晶面催化活性不同。 | An exposed flat crystal face; different facets differ in catalytic activity. |
| GRAIN | 晶粒 | mat | ★ |   | 多晶材料中方向一致的小晶區。 | A small region of uniform orientation in a polycrystal. |
| DOMAIN | 疇區 | mat | ★★ |   | 性質一致的微小區域,如磁疇。 | A microscopic region of uniform property, e.g., a magnetic domain. |
| DEFECT | 缺陷 | mat | ★ |   | 晶格中的不完美處,如空位、雜質。 | An imperfection in a lattice, e.g., a vacancy or impurity. |
| ORTHO | 鄰位 | organic | ★★ |   | 苯環上相鄰兩個取代基的相對位置。 | The relative position of two adjacent substituents on a benzene ring. |
| GLASSY | 玻璃態的 | mat | ★★ |   | 原子排列無長程秩序的非晶態。 | An amorphous state with no long-range atomic order. |

## 11. 高分子性質(7 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| BLEND | 摻合 | mat | ★ |   | 把兩種以上高分子混合以調整性質。 | Mixing two or more polymers to tune properties. |
| CURING | 固化 | mat | ★★ |   | 高分子交聯硬化的過程,如環氧樹脂。 | The crosslinking process that hardens a polymer, e.g., epoxy. |
| MOULD | 模具 | mat | ★★ |   | 成型高分子用的模子(英式拼法)。 | The form used to shape a polymer (UK spelling of mold). |
| TOUGH | 韌的 | mat | ★ |   | 能吸收大量能量而不斷裂。 | Able to absorb a lot of energy before fracturing. |
| RIGID | 剛硬的 | mat | ★ |   | 不易形變。 | Not easily deformed. |
| CREEP | 潛變 | mat | ★★ |   | 材料在長期定負荷下緩慢變形。 | Slow deformation under a constant long-term load. |
| POLYOL ⚠️ | 多元醇 | organic | ★★ |   | 含多個 –OH 的化合物,聚氨酯的原料。 | A compound with many –OH groups; a feedstock for polyurethane. |

## 12. 材料(9 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| GLASS | 玻璃 | mat | ★ |   | 主成分為二氧化矽的非晶質固體。 | An amorphous solid made mainly of silica. |
| STEEL | 鋼 | mat | ★ |   | 鐵碳合金,含碳量低於 2%。 | An iron–carbon alloy containing less than 2% carbon. |
| CEMENT | 水泥 | mat | ★ |   | 加水後硬化的膠結材料,混凝土的黏著劑。 | A binder that hardens with water; the glue in concrete. |
| ENAMEL | 琺瑯 | mat | ★★ |   | 燒附在金屬表面的玻璃質塗層。 | A glassy coating fused onto metal. |
| LAYER | 層 | mat | ★ |   | 材料中的一個厚度區段,如石墨的層狀結構。 | A thickness section of material, e.g., graphite's layered structure. |
| PELLET | 顆粒 | mat | ★ |   | 壓製成型的小圓粒,催化劑常做成此形。 | A small compressed granule; a common catalyst form. |
| POWDER | 粉末 | mat | ★ |   | 細碎的固體顆粒。 | Finely divided solid particles. |
| FLAKE | 薄片 | mat | ★ |   | 片狀的固體,如石墨片。 | A thin plate-like solid, e.g., a graphite flake. |
| SHEET | 片 | mat | ★ |   | 平整的薄層材料,如石墨烯單層。 | A flat thin layer of material, e.g., a graphene sheet. |

## 13. 石化工業(5 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| CRUDE | 原油 | mat | ★ |   | 未經精煉的石油。 | Unrefined petroleum. |
| DIESEL | 柴油 | mat | ★ |   | 沸點比汽油高的燃料餾分。 | A fuel fraction boiling higher than gasoline. |
| PETROL | 汽油 | mat | ★ |   | 汽油的英式說法,美式為 gasoline。 | Gasoline (UK term). |
| REFINE | 精煉 | reaction | ★ |   | 把原油分餾並純化成各種產品。 | Fractionating and purifying crude oil into products. |
| OLEFIN | 烯烴 | organic | ★★ |   | 烯烴的工業用語,即 alkene。 | The industrial term for an alkene. |

## 14. 生化補充(11 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| URACIL | 尿嘧啶 | bio | ★★ |   | RNA 特有的鹼基,DNA 中由胸腺嘧啶取代。 | The RNA-specific base, replaced by thymine in DNA. |
| HELIX | 螺旋 | bio | ★ |   | DNA 雙股螺旋、蛋白質 α 螺旋的結構。 | The DNA double helix and the protein α-helix. |
| STRAND | 股 | bio | ★ |   | 雙股 DNA 的其中一條。 | One of the two chains in double-stranded DNA. |
| GENOME | 基因體 | bio | ★ |   | 一個生物全部的遺傳訊息。 | The complete genetic information of an organism. |
| ACTIN | 肌動蛋白 | bio | ★★ |   | 構成細胞骨架與肌肉的球狀蛋白。 | A globular protein forming the cytoskeleton and muscle. |
| MYOSIN | 肌凝蛋白 | bio | ★★ |   | 與肌動蛋白一起產生肌肉收縮的馬達蛋白。 | A motor protein that works with actin to contract muscle. |
| LIGASE | 連接酶 | bio | ★★ |   | 把兩段 DNA 接起來的酵素。 | The enzyme that joins two DNA fragments. |
| KINASE | 激酶 | bio | ★★ |   | 把磷酸基轉移到其他分子的酵素。 | An enzyme that transfers a phosphate group to another molecule. |
| OLEIC | 油酸的 | organic | ★★ |   | 油酸是橄欖油的主要單元不飽和脂肪酸。 | Oleic acid is the main monounsaturated fat in olive oil. |
| OLEATE | 油酸鹽 | organic | ★★ |   | 油酸的鹽或酯,肥皂的成分之一。 | A salt or ester of oleic acid; a soap component. |
| MOIETY | 基團 | organic | ★★ |   | 分子中具有特定性質的一部分。 | A distinct portion of a molecule with characteristic behaviour. |

## 15. 有機 / 一般補充(7 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| BRANCH | 支鏈 | organic | ★ |   | 從主鏈分出去的碳鏈。 | A carbon chain splitting off the main chain. |
| CYCLIC | 環狀的 | organic | ★ |   | 原子接成環的結構,如環己烷。 | A structure whose atoms form a ring, e.g., cyclohexane. |
| MIXING | 混合 | reaction | ★ |   | 把不同物質攪拌均勻。 | Stirring different substances until uniform. |
| AGING | 熟成 | mat | ★★ |   | 材料隨時間改變性質的過程。 | A material's properties changing over time. |
| SETTLE | 沉降 | reaction | ★ |   | 固體顆粒因重力沉到底部。 | Solid particles sinking under gravity. |
| IMPURE | 不純的 | gen | ★ |   | 含有雜質。 | Containing impurities. |
| DIODE | 二極體 | mat | ★ |   | 只讓電流單向通過的半導體元件。 | A semiconductor device that passes current one way only. |

## 16. 環境 / 綠色化學(18 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| WASTE | 廢棄物 | gen | ★ |   | 製程中產生、不需要的物質。 | Unwanted material generated by a process. |
| BIOGAS | 沼氣 | gen | ★★ |   | 有機物厭氧分解產生的甲烷混合氣。 | Methane-rich gas from anaerobic decomposition of organic matter. |
| SOLAR | 太陽能的 | gen | ★ |   | 來自太陽的能量,綠色化學的重要能源。 | Energy from the sun; a key green-chemistry energy source. |
| SLUDGE | 污泥 | gen | ★★ |   | 廢水處理沉澱下來的半固體。 | The semi-solid settled out in wastewater treatment. |
| SEWAGE | 污水 | gen | ★★ |   | 生活或工業排放的廢水。 | Wastewater discharged from homes or industry. |
| LEACH | 淋溶 | gen | ★★ |   | 用液體把固體中的成分溶出來。 | Dissolving components out of a solid with a liquid. |
| RUNOFF | 逕流 | gen | ★★ |   | 沖刷地表流入水體的水,常帶著污染物。 | Surface water flowing into waterways, often carrying pollutants. |
| BENIGN | 良性的 | gen | ★★ |   | 綠色化學強調「設計上就無害」。 | Green chemistry aims for substances that are benign by design. |
| RENEW | 更新 | gen | ★ |   | 可再生資源能夠自然補充。 | Renewable resources replenish naturally. |
| REUSE | 再利用 | gen | ★ |   | 重複使用而不丟棄。 | Using again rather than discarding. |
| TOXIN | 毒素 | gen | ★ |   | 生物產生的有毒物質。 | A poisonous substance produced by a living organism. |
| HAZARD | 危害 | gen | ★ |   | 可能造成傷害的來源。 | A source of potential harm. |
| SAFETY | 安全 | lab | ★ |   | 實驗室操作的首要原則。 | The first principle of laboratory work. |
| EXPOSE | 暴露 | gen | ★ |   | 接觸到有害物質或輻射。 | Coming into contact with a harmful substance or radiation. |
| DOSAGE | 劑量 | gen | ★ |   | 接觸或服用的量,決定毒性大小。 | The amount received; it determines toxicity. |
| INTAKE | 攝入量 | gen | ★★ |   | 進入體內的物質總量。 | The total amount of a substance taken into the body. |
| SMOKE | 煙 | gen | ★ |   | 燃燒產生的固體微粒懸浮於氣體中。 | Solid particles from combustion suspended in gas. |
| DRYING | 乾燥 | lab | ★ |   | 去除樣品中的水分。 | Removing moisture from a sample. |

---

## 統計

| 分類 | 題數 |
|---|---:|
| 1. 原子結構 / 週期表 | 9 |
| 2. 化學鍵 | 6 |
| 3. 無機物 / 合金 | 8 |
| 4. 酸鹼與化學計量 | 7 |
| 5. 單位與常數 | 11 |
| 6. 光譜學 | 8 |
| 7. 儀器分析 | 19 |
| 8. 熱力學 | 8 |
| 9. 動力學與催化 | 6 |
| 10. 晶體 / 固態 | 8 |
| 11. 高分子性質 | 7 |
| 12. 材料 | 9 |
| 13. 石化工業 | 5 |
| 14. 生化補充 | 11 |
| 15. 有機 / 一般補充 | 7 |
| 16. 環境 / 綠色化學 | 18 |
| **合計** | **147** |

難度分布:★ 82 題 / ★★ 65 題(**無 ★★★**)

## 入庫後的總量

| 來源 | 題數 |
|---|---:|
| 現有題庫(扣掉 2 題停用的複數) | 76 |
| batch4 | 126 |
| batch5 | 147 |
| **合計** | **349** |

以每天 1 題計算,**約 1 年不會重複**。
