# ChemWordle 題庫擴充 — batch4 候選(126 題)

轉型「常駐練習工具」用的大批擴充。目標把題庫從 74 → 300+。
本批以**有機化學**為主,**已排除所有複數形**。
**已依使用者要求移除全部 ★★★ 難度題目(24 題)。**

## 篩法

- **不要的**:整列刪掉
- **要改的**:中文 / 描述直接改
- **訪客池**:想放訪客池的在「訪客」欄填 ✓(訪客池目前 26 題,想補到 60-80)
- 篩完跟我說「batch4 篩好了」,我產 SQL

## 狀態說明

- 全部 126 題都通過檢查:**無重複、長度合格(5-6)、無複數**
- ⚠️ 記號 = 不在 ENABLE 一般英文字典裡(正規化學詞,入庫後 trigger 自動加進可猜字典,不影響使用)

---

## 1. 烷 / 烯 / 炔 與烷基(14 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| OCTANE | 辛烷 | organic | ★ |   | C₈H₁₈,八碳烷烴;汽油辛烷值的基準物。 | C₈H₁₈; eight-carbon alkane, the reference for octane rating. |
| NONANE ⚠️ | 壬烷 | organic | ★★ |   | C₉H₂₀,九碳直鏈烷烴。 | C₉H₂₀; a nine-carbon straight-chain alkane. |
| DECANE | 癸烷 | organic | ★★ |   | C₁₀H₂₂,十碳烷烴,柴油成分之一。 | C₁₀H₂₂; ten-carbon alkane, a diesel component. |
| ALKANE | 烷烴 | organic | ★ |   | 只含 C–C 單鍵的飽和烴,通式 CₙH₂ₙ₊₂。 | Saturated hydrocarbons with only C–C single bonds (CₙH₂ₙ₊₂). |
| ALKYL | 烷基 | organic | ★ |   | 烷烴少一個氫的基團,如甲基 –CH₃。 | An alkane minus one hydrogen, e.g., methyl –CH₃. |
| PROPYL | 丙基 | organic | ★ |   | –C₃H₇,三碳烷基。 | –C₃H₇; a three-carbon alkyl group. |
| BUTYL | 丁基 | organic | ★ |   | –C₄H₉,四碳烷基,有正/異/二級/三級四種。 | –C₄H₉; four-carbon alkyl with n-, iso-, sec-, tert- forms. |
| PENTYL | 戊基 | organic | ★★ |   | –C₅H₁₁,五碳烷基(舊稱 amyl)。 | –C₅H₁₁; five-carbon alkyl (formerly "amyl"). |
| HEXYL | 己基 | organic | ★★ |   | –C₆H₁₃,六碳烷基。 | –C₆H₁₃; a six-carbon alkyl group. |
| OCTYL | 辛基 | organic | ★★ |   | –C₈H₁₇,八碳烷基,界面活性劑常見。 | –C₈H₁₇; eight-carbon alkyl, common in surfactants. |
| ALLYL | 烯丙基 | organic | ★★ |   | CH₂=CH–CH₂–,含雙鍵的三碳基團。 | CH₂=CH–CH₂–; three-carbon group containing a double bond. |
| VINYL | 乙烯基 | organic | ★ |   | CH₂=CH–,PVC(聚氯乙烯)的 V 就是它。 | CH₂=CH–; the "V" in PVC (polyvinyl chloride). |
| ETHYL | 乙基 | organic | ★ |   | –C₂H₅,兩碳烷基。 | –C₂H₅; a two-carbon alkyl group. |
| ARENE ⚠️ | 芳香烴 | organic | ★★ |   | 含苯環的芳香族碳氫化合物總稱。 | General term for aromatic hydrocarbons containing a benzene ring. |

## 2. 官能基(14 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| ALKOXY | 烷氧基 | organic | ★★ |   | –OR,醚類的組成基團。 | –OR; the group that makes up ethers. |
| ACETYL | 乙醯基 | organic | ★★ |   | CH₃CO–,阿斯匹靈、乙醯輔酶 A 都含此基。 | CH₃CO–; found in aspirin and acetyl-CoA. |
| FORMYL | 甲醯基 | organic | ★★ |   | HCO–,醛類的官能基。 | HCO–; the functional group of aldehydes. |
| BENZYL | 苄基 | organic | ★★ |   | C₆H₅CH₂–,苯環接一個亞甲基。 | C₆H₅CH₂–; a benzene ring attached to a methylene. |
| PHENYL | 苯基 | organic | ★ |   | C₆H₅–,苯少一個氫的基團。 | C₆H₅–; benzene minus one hydrogen. |
| NITRO | 硝基 | organic | ★ |   | –NO₂,TNT 炸藥的關鍵官能基。 | –NO₂; the key group in TNT explosives. |
| AMINO | 胺基 | organic | ★ |   | –NH₂,胺基酸的名字由來。 | –NH₂; the group that gives amino acids their name. |
| THIOL | 硫醇 | organic | ★★ |   | –SH,有臭味,瓦斯加臭劑的成分。 | –SH; smelly, used as the odorant added to natural gas. |
| AZIDE | 疊氮化物 | organic | ★★ |   | 含 –N₃;安全氣囊的疊氮化鈉分解產生氮氣。 | Contains –N₃; sodium azide in airbags decomposes to N₂. |
| IMINE | 亞胺 | organic | ★★ |   | 含 C=N 雙鍵,醛酮與胺反應的產物。 | Contains C=N; formed from aldehydes/ketones plus amines. |
| ACETAL | 縮醛 | organic | ★★ |   | 醛與兩分子醇的產物,醣類環化的關鍵。 | From an aldehyde plus two alcohols; key to sugar ring formation. |
| SILANE | 矽烷 | organic | ★★ |   | SiH₄ 及其衍生物;半導體 CVD 製程原料。 | SiH₄ and derivatives; a CVD feedstock in semiconductor fabs. |
| BORANE | 硼烷 | organic | ★★ |   | BH₃ 及其衍生物,硼氫化反應試劑。 | BH₃ and derivatives; reagent for hydroboration. |
| TRIOL | 三元醇 | organic | ★★ |   | 含三個 –OH 的醇,如甘油。 | An alcohol with three –OH groups, e.g., glycerol. |

## 3. 有機化合物 / 立體化學(6 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| XYLENE | 二甲苯 | organic | ★ |   | C₈H₁₀,苯環接兩個甲基,有鄰/間/對三種。 | C₈H₁₀; benzene with two methyls — ortho, meta, para. |
| CRESOL | 甲酚 | organic | ★★ |   | 甲基酚,消毒水的成分之一。 | Methylphenol; a component of disinfectants. |
| FURAN | 呋喃 | organic | ★★ |   | 含氧的五員芳香環。 | A five-membered aromatic ring containing oxygen. |
| PURINE | 嘌呤 | organic | ★★ |   | 腺嘌呤、鳥嘌呤的母核,DNA 鹼基。 | Parent ring of adenine and guanine, DNA bases. |
| DIMER | 二聚體 | organic | ★ |   | 兩個相同單體結合而成的分子。 | A molecule formed from two identical monomers. |
| TRIMER | 三聚體 | organic | ★★ |   | 三個單體結合而成的分子。 | A molecule formed from three monomers. |

## 4. 有機酸(5 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| ACETIC | 醋酸的 | organic | ★ |   | 乙酸 CH₃COOH,食用醋的酸味來源。 | Acetic acid CH₃COOH; what makes vinegar sour. |
| FORMIC | 蟻酸的 | organic | ★ |   | 甲酸 HCOOH,螞蟻分泌的最簡單羧酸。 | Formic acid HCOOH; the simplest carboxylic acid, from ants. |
| OXALIC | 草酸的 | organic | ★★ |   | (COOH)₂,菠菜含量高,會與鈣結合。 | (COOH)₂; abundant in spinach, binds calcium. |
| CITRIC | 檸檬酸的 | organic | ★ |   | 檸檬酸循環(TCA)的核心分子。 | Central molecule of the citric acid (TCA) cycle. |
| LACTIC | 乳酸的 | organic | ★ |   | 運動後肌肉痠痛與優酪乳的酸味來源。 | Behind post-exercise muscle ache and yogurt's tang. |

## 5. 醣類 / 生化(14 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| RIBOSE | 核糖 | bio | ★ |   | RNA 的五碳醣骨架。 | The five-carbon sugar backbone of RNA. |
| XYLOSE | 木糖 | bio | ★★ |   | 五碳醣,木糖醇的原料。 | A five-carbon sugar; the precursor of xylitol. |
| HEXOSE | 六碳醣 | bio | ★★ |   | 六個碳的單醣,如葡萄糖、果糖。 | A six-carbon monosaccharide, e.g., glucose, fructose. |
| STEROL | 固醇 | bio | ★★ |   | 含四環骨架的脂質,如膽固醇。 | A lipid with a four-ring core, e.g., cholesterol. |
| GLOBIN | 球蛋白 | bio | ★★ |   | 血紅素的蛋白質部分。 | The protein portion of hemoglobin. |
| PEPSIN | 胃蛋白酶 | bio | ★ |   | 胃液中分解蛋白質的酵素,最適 pH 約 2。 | Stomach enzyme that digests protein; optimal near pH 2. |
| LIPASE | 脂解酶 | bio | ★★ |   | 分解脂肪為脂肪酸與甘油的酵素。 | Enzyme that breaks fats into fatty acids and glycerol. |
| CODON | 密碼子 | bio | ★ |   | mRNA 上三個鹼基一組,對應一個胺基酸。 | Three mRNA bases coding for one amino acid. |
| STARCH | 澱粉 | bio | ★ |   | 葡萄糖聚合而成的儲存多醣。 | A storage polysaccharide made of glucose units. |
| PECTIN | 果膠 | bio | ★★ |   | 植物細胞壁的多醣,果醬凝固的關鍵。 | Plant cell-wall polysaccharide that sets jam. |
| CHITIN | 幾丁質 | bio | ★★ |   | 甲殼類外骨骼的含氮多醣。 | Nitrogen-containing polysaccharide in crustacean shells. |
| LYSINE | 離胺酸 | bio | ★★ |   | 必需胺基酸,側鏈帶正電。 | An essential amino acid with a positively charged side chain. |
| SERINE | 絲胺酸 | bio | ★★ |   | 側鏈含 –OH 的胺基酸,酵素活性中心常見。 | Amino acid with an –OH side chain; common in enzyme active sites. |
| VALINE | 纈胺酸 | bio | ★★ |   | 支鏈胺基酸(BCAA)之一。 | One of the branched-chain amino acids (BCAAs). |

## 6. 高分子 / 材料(10 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| NYLON | 尼龍 | mat | ★ |   | 聚醯胺纖維,第一個商業化的合成纖維。 | Polyamide fiber; the first commercial synthetic fiber. |
| RAYON | 嫘縈 | mat | ★★ |   | 再生纖維素纖維,又稱人造絲。 | Regenerated cellulose fiber, also called artificial silk. |
| RESIN | 樹脂 | mat | ★ |   | 天然或合成的黏稠高分子材料。 | A viscous natural or synthetic polymer material. |
| LATEX | 乳膠 | mat | ★ |   | 高分子微粒懸浮液,橡膠手套的原料。 | A suspension of polymer particles; used for rubber gloves. |
| FIBER | 纖維 | mat | ★ |   | 細長的絲狀材料。 | A long, thin thread-like material. |
| EPOXY | 環氧樹脂 | mat | ★ |   | 含環氧基的熱固性樹脂,強力膠與電路板基材。 | Thermoset resin with epoxide groups; glues and PCB substrates. |
| DOPANT | 摻雜物 | mat | ★★ |   | 加入半導體中改變導電性的微量雜質,如硼、磷。 | Trace impurity added to a semiconductor, e.g., boron, phosphorus. |
| WAFER | 晶圓 | mat | ★ |   | 半導體製程的矽單晶薄片。 | A thin slice of single-crystal silicon for chip fabrication. |
| SINTER | 燒結 | mat | ★★ |   | 粉末加熱至熔點以下使其結合成塊的製程。 | Bonding powder into a solid by heating below the melting point. |
| ANNEAL | 退火 | mat | ★★ |   | 加熱後緩慢冷卻以消除內應力的熱處理。 | Heat treatment: heat then cool slowly to relieve internal stress. |

## 7. 礦物 / 晶體(6 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| ZIRCON | 鋯石 | mat | ★★ |   | ZrSiO₄,耐高溫,也用於地質定年。 | ZrSiO₄; heat-resistant and used for geological dating. |
| RUTILE | 金紅石 | mat | ★★ |   | TiO₂ 的一種晶型,白色顏料與光催化劑。 | A TiO₂ polymorph; white pigment and photocatalyst. |
| GARNET | 石榴石 | mat | ★★ |   | 矽酸鹽礦物族,YAG 雷射晶體屬於此類。 | A silicate mineral family; YAG laser crystals belong here. |
| GYPSUM | 石膏 | mat | ★ |   | CaSO₄·2H₂O,建材與模型材料。 | CaSO₄·2H₂O; used in construction and casting. |
| HALITE | 岩鹽 | mat | ★★ |   | NaCl 的礦物形式,立方晶系。 | The mineral form of NaCl; cubic crystal system. |
| PYRITE | 黃鐵礦 | mat | ★ |   | FeS₂,金屬光澤似黃金,俗稱愚人金。 | FeS₂; metallic lustre resembling gold — "fool's gold". |

## 8. 元素(7 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| BARIUM | 鋇 | element | ★ |   | 第 2 族鹼土金屬,硫酸鋇是腸胃 X 光顯影劑。 | Group 2 alkaline earth metal; BaSO₄ is a GI X-ray contrast agent. |
| CERIUM | 鈰 | element | ★★ |   | 最豐富的稀土元素,用於拋光粉與觸媒轉換器。 | The most abundant rare earth; used in polishing and catalytic converters. |
| CESIUM | 銫 | element | ★★ |   | 最活潑的穩定鹼金屬,銫原子鐘定義「秒」。 | The most reactive stable alkali metal; caesium clocks define the second. |
| INDIUM | 銦 | element | ★★ |   | ITO 透明導電膜的主要成分。 | The main component of ITO transparent conductive films. |
| RADIUM | 鐳 | element | ★ |   | 居禮夫人發現的放射性元素。 | The radioactive element discovered by Marie Curie. |
| RADON | 氡 | element | ★★ |   | 放射性惰性氣體,室內輻射的主要來源。 | A radioactive noble gas; the main source of indoor radiation. |
| OSMIUM | 鋨 | element | ★★ |   | 密度最大的元素之一。 | One of the densest elements known. |

## 9. 物理化學(9 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| BOSON | 玻色子 | phys-chem | ★★ |   | 自旋為整數的粒子,可占據同一量子態。 | Integer-spin particles that can share the same quantum state. |
| QUARK | 夸克 | phys-chem | ★ |   | 組成質子與中子的基本粒子。 | Elementary particles that make up protons and neutrons. |
| SIGMA | σ | phys-chem | ★ |   | σ 鍵是沿鍵軸重疊形成的單鍵。 | A σ bond forms by head-on overlap along the bond axis. |
| DELTA | Δ | phys-chem | ★ |   | 化學上常表示「變化量」,如 ΔH 焓變。 | In chemistry, denotes a change, e.g., ΔH for enthalpy change. |
| ALPHA | α | phys-chem | ★ |   | α 粒子即氦核;α 衰變會放出氦核。 | An α particle is a helium nucleus, emitted in alpha decay. |
| GAMMA | γ | phys-chem | ★ |   | γ 射線是高能電磁波,穿透力最強。 | γ rays are high-energy photons with the greatest penetrating power. |
| LAMBDA | λ | phys-chem | ★ |   | 波長的符號,光譜學的核心變數。 | The symbol for wavelength, central to spectroscopy. |
| DECAY | 衰變 | phys-chem | ★ |   | 不穩定原子核自發放出輻射轉變為其他核種。 | Spontaneous transformation of an unstable nucleus with radiation emission. |
| HYBRID | 混成 | phys-chem | ★★ |   | 軌域混成(sp、sp²、sp³)決定分子幾何。 | Orbital hybridization (sp, sp², sp³) sets molecular geometry. |

## 10. 反應 / 操作(11 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| REDOX | 氧化還原 | reaction | ★ |   | 電子轉移反應的總稱。 | The umbrella term for electron-transfer reactions. |
| REFLUX | 迴流 | reaction | ★★ |   | 加熱使溶劑蒸發後冷凝回流,維持反應溫度。 | Boiling with condensate returning, holding the reaction at temperature. |
| QUENCH | 淬滅 | reaction | ★★ |   | 快速終止反應或急速冷卻。 | To stop a reaction abruptly, or to cool rapidly. |
| ELUTE | 沖提 | reaction | ★★ |   | 用溶劑把吸附在管柱上的物質洗出來。 | To wash a substance off a column with solvent. |
| DECANT | 傾析 | reaction | ★★ |   | 靜置後把上層澄清液倒出,分離沉澱。 | To pour off the clear upper liquid, leaving the precipitate. |
| FILTER | 過濾 | reaction | ★ |   | 用濾材分離固體與液體。 | To separate solid from liquid using a filter medium. |
| PURIFY | 純化 | reaction | ★ |   | 去除雜質以提高純度。 | To remove impurities and raise purity. |
| DIGEST | 消化 | reaction | ★★ |   | 用酸或酵素分解樣品使其溶解。 | To break down a sample with acid or enzymes until dissolved. |
| DISTIL | 蒸餾 | reaction | ★ |   | 利用沸點差分離液體混合物(英式拼法)。 | To separate liquids by boiling point (UK spelling of distill). |
| CRACK | 裂解 | reaction | ★★ |   | 石化業把長鏈烴打斷成短鏈的製程。 | The petrochemical process of breaking long hydrocarbons into short ones. |
| REFORM | 重組 | reaction | ★★ |   | 催化重組,把直鏈烴轉成芳香烴提高辛烷值。 | Catalytic reforming: converting straight chains to aromatics to boost octane. |

## 11. 溶液(5 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| SALINE | 生理食鹽水 | gen | ★ |   | 0.9% NaCl 水溶液,與體液等滲。 | 0.9% NaCl solution, isotonic with body fluids. |
| BRINE | 鹵水 | gen | ★ |   | 高濃度鹽水。 | Highly concentrated salt water. |
| SLURRY | 漿液 | gen | ★★ |   | 固體顆粒懸浮在液體中的混合物。 | A mixture of solid particles suspended in a liquid. |
| ALKALI | 鹼 | gen | ★ |   | 可溶於水的鹼性物質,如 NaOH、KOH。 | A water-soluble base, e.g., NaOH, KOH. |
| BORATE | 硼酸鹽 | gen | ★★ |   | 含 BO₃ 或 BO₄ 的鹽類,硼砂是常見例子。 | Salts containing BO₃ or BO₄; borax is a common example. |

## 12. 狀態 / 性質(11 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| MOLTEN | 熔融的 | gen | ★ |   | 固體加熱至熔點以上的液態。 | Liquid state of a solid heated above its melting point. |
| FROZEN | 凍結的 | gen | ★ |   | 液體降溫至凝固點以下的固態。 | Solid state reached by cooling below the freezing point. |
| DENSE | 緻密的 | gen | ★ |   | 單位體積的質量大。 | Having large mass per unit volume. |
| INERT | 惰性的 | gen | ★ |   | 不易參與化學反應,如氬、氦。 | Reluctant to react chemically, e.g., argon, helium. |
| BASIC | 鹼性的 | gen | ★ |   | pH 大於 7。 | Having a pH greater than 7. |
| TOXIC | 有毒的 | gen | ★ |   | 對生物有害。 | Harmful to living organisms. |
| STABLE | 穩定的 | gen | ★ |   | 不易分解或反應。 | Not readily decomposed or reacted. |
| PLANAR | 平面的 | gen | ★★ |   | 所有原子在同一平面上,如苯環。 | All atoms lying in one plane, e.g., the benzene ring. |
| LINEAR | 線形的 | gen | ★ |   | 鍵角 180° 的分子幾何,如 CO₂。 | Molecular geometry with a 180° bond angle, e.g., CO₂. |
| PHASE | 相 | gen | ★ |   | 物質中物理性質均勻的部分,如固/液/氣三相。 | A physically uniform portion of matter, e.g., solid, liquid, gas. |
| TRANS | 反式 | gen | ★★ |   | 兩個取代基在雙鍵或環的異側。 | Substituents on opposite sides of a double bond or ring. |

## 13. 分析 / 定量(6 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| ASSAY | 分析測定 | analytical | ★★ |   | 測定樣品中某成分含量的實驗。 | An experiment measuring how much of a component a sample contains. |
| BLANK | 空白樣 | analytical | ★★ |   | 不含待測物的對照樣品,用來扣除背景。 | A control sample without analyte, used to subtract background. |
| PURITY | 純度 | analytical | ★ |   | 目標物佔總量的比例。 | The fraction of the total that is the target substance. |
| NORMAL | 當量濃度的 | analytical | ★★ |   | 每公升溶液的當量數(N)。 | Equivalents of solute per litre of solution (N). |
| PROBE | 探針 | analytical | ★ |   | 用來偵測特定訊號的元件或分子。 | A device or molecule used to detect a specific signal. |
| SENSOR | 感測器 | analytical | ★ |   | 把化學或物理量轉成電訊號的裝置。 | A device converting a chemical or physical quantity into an electrical signal. |

## 14. 實驗器材(8 題)

| 英文 | 中文 | 類別 | 難 | 訪客 | zh_description | en_description |
|---|---|---|---|---|---|---|
| BEAKER | 燒杯 | lab | ★ |   | 圓柱形平底玻璃容器,最常見的實驗器皿。 | A flat-bottomed cylindrical glass vessel; the classic lab container. |
| FLASK | 燒瓶 | lab | ★ |   | 圓底或錐形的玻璃容器。 | A round-bottom or conical glass vessel. |
| BURNER | 本生燈 | lab | ★ |   | 實驗室加熱用的燃氣燈。 | The gas burner used for heating in the lab. |
| MORTAR | 研缽 | lab | ★★ |   | 研磨固體樣品的陶瓷或瑪瑙容器。 | A ceramic or agate bowl for grinding solid samples. |
| PESTLE | 研杵 | lab | ★★ |   | 搭配研缽使用的研磨棒。 | The grinding rod used together with a mortar. |
| FUNNEL | 漏斗 | lab | ★ |   | 導引液體或搭配濾紙過濾的器材。 | For guiding liquids or holding filter paper. |
| PIPET | 吸量管 | lab | ★★ |   | 精確量取液體體積的細管(美式拼法)。 | A narrow tube for measuring liquid volume precisely (US spelling). |
| BURET | 滴定管 | lab | ★★ |   | 滴定時逐滴加入標準液的刻度管。 | The graduated tube for delivering titrant drop by drop. |

---

## 統計

| 分類 | 題數 |
|---|---:|
| 1. 烷 / 烯 / 炔 與烷基 | 14 |
| 2. 官能基 | 14 |
| 3. 有機化合物 / 立體化學 | 6 |
| 4. 有機酸 | 5 |
| 5. 醣類 / 生化 | 14 |
| 6. 高分子 / 材料 | 10 |
| 7. 礦物 / 晶體 | 6 |
| 8. 元素 | 7 |
| 9. 物理化學 | 9 |
| 10. 反應 / 操作 | 11 |
| 11. 溶液 | 5 |
| 12. 狀態 / 性質 | 11 |
| 13. 分析 / 定量 | 6 |
| 14. 實驗器材 | 8 |
| **合計** | **126** |

字長分布:5 字 48 題 / 6 字 78 題

## 下一步

1. 你篩這份(刪不要的、改中文描述、標訪客池)
2. 跟我說「batch4 篩好了」
3. 我產 SQL 入庫(trigger 會自動把答案同步進可猜字典)
4. 之後再出 batch5(目標再 +150,湊到 300+)

**batch5 我打算補的方向**(先讓你有個底):
無機鹽類與配位化學、電化學、光譜學、熱力學、儀器分析、石化工業、綠色化學、環境化學
