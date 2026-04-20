import { defineConfig } from 'vite';

// Vite 5 設定:純靜態前端,hash routing,不需要 SPA fallback
// - dev server 用預設 port 5173(已在 Supabase Redirect URLs 中)
// - build 輸出 dist/(Cloudflare Pages 直接指向此資料夾)
// - public/ 會被原樣複製到 dist/(logo.png、favicon.ico 放這)
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020'
  }
});
