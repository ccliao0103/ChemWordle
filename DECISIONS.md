# 決策日誌(append-only)

> 格式:每條一個段落,只增不改。推翻舊決策時新增一條並註明「取代 #N」。
> 欄位:**決策** / **原因** / **證據**(可選) / **影響範圍**

---

## #1 — 2026-09-21 — 從「競賽活動」轉為「常駐練習工具」

**決策**:5/1–6/30 的競賽期結束後,ChemWordle 轉型為無獎勵的長期每日練習工具。
拆除所有競賽機制(月排行獎、全勤獎、參加獎、禮券),改為累積式記錄。

**原因**:競賽有明確的活動期與預算;長期營運不可能持續發獎。但每天一題學化學英文
單字本身對學生有價值,值得留下來。

**影響範圍**:`get_monthly_leaderboard`、`get_my_monthly_rewards`、`/leaderboard`、
`/stats`、`home.js` 規則區塊、`update-modal.js` 全部 8 則競賽期公告。

---

## #2 — 2026-09-21 — 永久榜從「重新上線日」起算,不沿用 5/6 月資料

**決策**:新的累積排行榜與 streak 都從「重新上線日」起算。5/1–6/30 的 attempts
資料保留在資料庫,但不計入新榜。重新上線日等 Phase 1–3 全部完工後再定。

**原因**:5/6 月是有獎競賽,投入程度跟無獎練習不同,混在一起算不公平也沒意義。
從零開始讓新進同學不會一開始就落後 60 天。

**影響範圍**:所有 lifetime 查詢都要 `where puzzle_date >= <relaunch_date>`。
這個日期需要一個單一真相來源(建議存 DB 常數表或 config)。

---

## #3 — 2026-09-21 — streak 採「寬容 1 天」規則

**決策**:連續挑戰天數允許中間缺 1 天。缺 2 天(含)以上才歸零。
streak 數值顯示「實際有玩的天數」,不是日曆跨度。

**原因**:學生週末常不碰,嚴格版會讓大部分人的 streak 永遠停在 1–2,反而失去
激勵效果。Duolingo 早期也是寬容制。

**影響範圍**:`get_my_lifetime_stats` RPC。實作上:把有玩的日期排序後往回走,
相鄰兩天間隔 ≤ 2 天算同一段;最後一次遊玩需在 today − 2 之內 streak 才算「still active」。

---

## #4 — 2026-09-21 — 舊競賽榜保留為 /leaderboard 的「歷史」tab

**決策**:5 月、6 月的月排行榜保留,放在 /leaderboard 的次要 tab。主畫面是新永久榜。

**原因**:得獎同學回來還看得到自己的名字,有紀念價值,成本也低(RPC 已存在)。

**影響範圍**:`/leaderboard` 頁面改為雙 tab;`get_monthly_leaderboard` RPC 保留不刪。

---

## #5 — 2026-09-21 — 題庫大幅擴充,排除複數形

**決策**:題庫從 74 題擴充到 300–500 題,以有機化合物為主要新增方向。
**不收錄英文複數形**(如 OXIDES、ANIONS、ESTERS)。
產生方式:從 ENABLE 字典用化學前綴/字尾規則自動篩候選,由使用者人工複篩。

**原因**:長期營運需要足夠題目避免快速輪完。複數形對學生沒有額外資訊量
(ATOMS 跟 ATOM 是同一個概念),之前 OXIDES/ANIONS 已因此停用。

**影響範圍**:`daily_puzzles` 表;`valid_words` 由既有 trigger 自動同步;
訪客池(`is_guest_pool=true`)獨立擴充至 60–80 題。

---

## #6 — 2026-09-21 — 不綁 custom domain,維持 chemwordle-a5p.pages.dev

**決策**:雖然 `ccllab-tw.com` 的 DNS 已在 Cloudflare 管理、綁 `chemwordle.ccllab-tw.com`
技術上可行,但決定維持原網址不動。

**原因**:這站有 Magic Link 登入,換網域不是純 DNS 的事,要依序做四步(掛 domain →
建 CNAME → Supabase Redirect URLs 加新網址 → 改 Pages 環境變數 `SITE_URL` 觸發重建),
順序錯會讓所有人登不進去。而且 session 存在 localStorage 綁 origin,換網域後所有人
在新網址都要重新收一次 Magic Link。效益(網址好看一點)不值得這些風險與操作成本。

**影響範圍**:`SITE_URL` 環境變數、Supabase Auth URL Configuration 都維持現狀。
未來若要重啟這件事,照上述四步順序做,且不要跟其他變更同時進行。
