# public/ 資料夾

此資料夾的檔案會被 Vite 原樣複製到 build 輸出 (`dist/`),路徑對應到網站根目錄。

## 檔案清單

### `favicon.svg`(已提供 placeholder)

簡易 placeholder:綠色圓角方塊 + 白色 "C"。之後換成正式 favicon 即可。

- 若想換成傳統 `.ico`:放一個 `favicon.ico`,並把 `index.html` 的 `<link rel="icon">` 改成:
  ```html
  <link rel="icon" href="/favicon.ico" />
  ```
- 若想繼續用 SVG:直接覆蓋 `favicon.svg` 內容即可。

### `logo.png`(尚未提供,由使用者自備)

系 logo 圖檔,Header 元件(批次 4 會加入)會嘗試載入 `/logo.png`。

- 若檔案**不存在**或載入失敗,Header 會自動退回顯示文字 "ChemWordle"(SPEC 指定行為)
- 建議尺寸:高度 32–40px 可顯示清楚,寬高比不限
- 格式:`.png` 優先;若想用 `.svg`,請改 Header 程式碼中的路徑

> 目前尚未建立這個檔案,故瀏覽時 Console 會看到一次 `GET /logo.png 404`,屬預期行為。
