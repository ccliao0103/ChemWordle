# 給 Claude Code 的開場 Prompt

把下面這段**完整複製貼到 Claude Code 的對話框**:

---

```
我要開發一個叫 ChemWordle 的化學英文 Wordle 網頁遊戲。

請先讀以下兩份規格文件:
1. SPEC.md — 完整的產品規格、UI 設計、頁面需求
2. SUPABASE_API.md — 後端 API 文件(已建好的所有 RPC)

讀完後請:
1. 確認理解整個專案架構
2. 列出你的開發計畫(分批次)
3. 等我確認後再開始產出檔案

重要約束:
- 純 HTML/CSS/JavaScript,不用 React 等框架
- 使用 Vite 作為 dev server 和 build 工具
- 後端已建好,前端只能透過 Supabase RPC 呼叫,不可直接 SELECT/INSERT
- Service role key 絕對不能出現在前端
- 所有規格決策都已在 SPEC.md 中,如有疑問先問我

開始吧。
```

---

## 接下來的工作流程

1. Claude Code 會先回你「我已讀完文件,以下是開發計畫…」
2. 你確認沒問題就回:「開始第 1 批次」
3. Claude Code 產出第 1 批次檔案後會問:「OK 繼續嗎?」
4. 你檢查檔案、回:「OK」/「我想調整 X」
5. 重複直到完工

## 中途有疑問就回來問我

如果 Claude Code 問你某個設計決策、或你不確定某個東西要不要做,**回來這邊問我**。我有完整的脈絡。

## 完工後我們會做的事

1. 在 Supabase Dashboard 設定 Authentication → URL Configuration(加你的 dev 和 prod 網址到 Redirect URLs)
2. 本機 `npm run dev`,測試完整流程
3. 第一次自己用 magic link 註冊 + 登入
4. 把自己的 role 改成 `admin`(SQL 一行)
5. Pilot 測試 5-10 人
6. 部署到 Cloudflare Pages

不急,一步一步來。
