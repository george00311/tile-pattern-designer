# 方寸｜地磚花紋拼貼設計器

供家人使用的繁體中文 React + TypeScript + Vite 網頁。純前端，不需要 API、資料庫或會員。17 張素材取自使用者提供的實拍照片，經逐張裁切與透視校正，保留原始配色及方向。

## 本機執行

安裝 Node.js 22.12 以上（建議 Node.js 22 LTS），在專案目錄執行：

```sh
npm ci
npm run dev
```

開啟終端機顯示的本機網址。正式建置：

```sh
npm run build
npm run preview
```

輸出位於 `dist/`，不要直接雙擊 `index.html`，請透過 HTTP 伺服器開啟。

## 操作

- 預設 8 × 6，長度為橫向格數、寬度為縱向格數，每方向 1～100。
- 選取地磚後點按或拖曳鋪設；空白選項為橡皮擦。一次拖曳是一筆歷史，最多保留 100 筆。
- 尺寸變更保留左上角重疊範圍，若刪除已鋪設內容會先確認；可復原。
- 切換「移動畫布」後拖曳平移；滾輪、縮放按鈕或雙指可縮放；「符合畫面」重新置中。
- 手機底部素材列可橫向捲動，雙指操作畫布時取消尚未完成的筆畫，避免誤畫。
- 鍵盤：畫布取得焦點後用方向鍵移動、空白鍵／Enter 鋪設、Delete 清除；Ctrl/Cmd+Z 復原、Ctrl/Cmd+Shift+Z 重做。
- 匯出 PNG 預設每格 128 px，可選格線；未鋪設格保留透明。
- 儲存／分享提供字串、分享連結、QR Code 與 JSON 檔。載入支援這些格式及 QR Code 照片。
- 手機「拍攝 QR Code」使用瀏覽器的檔案拍照功能，實際相機介面依裝置而異；也可直接用手機相機掃描分享連結。
- 編輯後 450 ms debounce 自動暫存至 localStorage；關閉／離開頁面時嘗試補存。此備援只屬於本瀏覽器與網域，並非跨裝置同步。
- 「重設並清除本機存檔」刪除本機暫存並回到空白 8 × 6；下次編輯才重新暫存。

## 素材替換

固定 ID 為 `0`～`16`，空白為 `-1`。`src/model.ts` 的 `TILE_FILES` 固定對應：

```text
0 → public/tiles/tile-00.png
1 → public/tiles/tile-01.png
…
16 → public/tiles/tile-16.png
```

編號依原照片由上到下、每排由左到右：上排 0～4、中排 5～10、下排 11～16。每張輸出 256 × 256 PNG；原照每款約 200 像素，放大匯出不會增加原始細節。花紋未經 AI 重繪、旋轉或自動補線。照片的光影與印刷紋理會保留。

日後替換更清晰的正方形圖片時，保留同一 ID 與檔名即可，請勿重排。舊存檔只記 ID，會自動使用對應的新圖片。裁切流程記錄於 `scripts/extract_tiles.py`，需要 Pillow 與 numpy，原照由使用者自行保存，不發布至網站。

## 存檔規格 v1

內部 JSON：`{ "v": 1, "width": 8, "height": 6, "tiles": [...] }`。tiles 依左到右、上到下排列，數量必須等於 width × height。

分享字串前綴為 `TP1.`。二進位內容如下，再進行無 padding Base64URL：

| 位元組 | 用途 |
| --- | --- |
| 0 | 格式版本 1 |
| 1、2 | width、height，均 1～100 |
| 3 | 編碼模式：0 為 5-bit，1 為 RLE |
| 4 起 | 地磚資料，ID 先加 1，空白變 0 |
| 最後 4 bytes | CRC32，big-endian，覆蓋先前所有 bytes |

模式 0 以低位元優先逐一寫入 5 bits；模式 1 每組兩 bytes 為「ID+1、連續次數-1」，單組最多 256 格。編碼時自動選較短的模式。CRC32 用於偵測毀損，並非加密或身分驗證。解碼檢查版本、尺寸、長度、地磚 ID 與校驗碼；也接受 JSON 存檔。

分享連結採 `https://你的網站/#design=TP1.…`。資料放 URL fragment，不送到網站伺服器；網站不使用短網址、外部 QR 服務或分析追蹤。

## 容量與效能

- 最多 10,000 格。畫布只繪製可見區域，使用 Canvas 避免 10,000 個 DOM 元素。
- PNG 最大 16,777,216 像素、單邊 8192 px；100 × 100 格建議每格 32 px。記憶體少的裝置仍可能需要降低解析度。
- QR Code 採 M 級容錯，限制完整連結 1800 UTF-8 bytes，以保留實際掃描餘裕。內容複雜的大型設計可能超限，請改用字串或 JSON 檔；不保證任意地板都能存成單張 QR Code。
- QR 照片最大 20 MB，辨識畫布最長邊縮至 2200 px。請保留完整白邊與清晰對焦。
- 載入字串與 JSON 最多 50,000 字元／檔案 bytes；100 × 100 的正常 v1 存檔可容納。
- 本機預覽 URL 不可供其他裝置直接使用；跨裝置分享請從正式 HTTPS 網站產生。

## 模組

| 檔案 | 責任 |
| --- | --- |
| `src/model.ts` | 型別、ID、尺寸與驗證 |
| `src/codec.ts` | 版本化編碼、解碼、CRC32 |
| `src/history.ts` | 提交、復原、重做 |
| `src/storage.ts` | 初始還原與本機備援 |
| `src/qr.ts` | 本機 QR 產生與照片辨識 |
| `src/export.ts` | PNG 渲染、容量限制與下載 |
| `src/TileBoard.tsx` | Canvas 繪圖與指標互動 |
| `src/App.tsx` | 工具列、素材列與操作視窗 |

## 測試

```sh
npm test
npm run build
```

瀏覽器驗收使用 Playwright，預設本機 Microsoft Edge；另開終端機執行 `npm run dev`，確認 port 5173 後執行：

```sh
npx playwright test
```

其他作業系統可在 `playwright.config.ts` 移除 `channel: 'msedge'`，並先執行 `npx playwright install chromium`。

已驗證：10 項單元測試、6 項瀏覽器測試與 TypeScript／Vite 正式建置通過。涵蓋尺寸與保留座標、17 種 ID、字串／JSON 往返、損壞輸入、歷史、拖曳／橡皮擦、重新整理暫存、分享連結自動還原、QR 圖片上傳、PNG 透明像素與排列、100 × 100 容量、手機模擬觸控及版面。手機實機相機與 Safari 尚未測試，需部署後實機驗收。

## GitHub → Render 免費 Static Site

1. 在 GitHub 建立空白 repository，例如 `tile-pattern-designer`。不要將 API key 放入檔案或 Git。
2. 使用 GitHub Desktop 的 Add local repository / Publish repository，或終端機：

   ```sh
   git init -b main
   git add .
   git commit -m "Build tile pattern designer"
   git remote add origin https://github.com/YOUR_ACCOUNT/tile-pattern-designer.git
   git push -u origin main
   ```

3. Render 選 **New → Static Site**，連接該 GitHub repository。切勿選 Web Service 或資料庫。
4. Branch：`main`；Build Command：`npm ci && npm run build`；Publish Directory：`dist`；不需要環境變數或金鑰。
5. 在 Redirects/Rewrites 新增 Source `/*`、Destination `/index.html`、Action `Rewrite`。
6. 建立後等部署顯示 Live，使用 `https://...onrender.com` 正式網址。
7. 也可以使用 **New → Blueprint** 讀取本專案 `render.yaml`；它只宣告一個 static site 及 SPA rewrite。
8. 部署後測試重新整理、子路徑、分享連結、手機相機掃描及 PNG 下載。若 GitHub 已連接 Render，之後 push 可觸發自動部署；只使用公開 repo URL 時可能需手動部署。

Render Static Site 免費部署，但頻寬與建置分鐘仍有方案配額。保持免費工作區，不加購額度、不啟用付費服務；本專案不需要信用卡付費功能。

官方文件：[Render Static Sites](https://render.com/docs/static-sites)、[SPA Rewrite](https://render.com/docs/redirects-rewrites)、[Vite 部署](https://vite.dev/guide/static-deploy)、[Blueprint 規格](https://render.com/docs/blueprint-spec)。

## 部署狀態

GitHub：https://github.com/george00311/tile-pattern-designer

Render 網址：https://tile-pattern-designer.onrender.com

GitHub 原始碼目前位於 `tile-pattern-designer-source/`，Render Root Directory 設為該資料夾。建置指令為 `npm ci && npm run build`，發布目錄 `dist`（相對於 Root Directory）。SPA rewrite 已透過 Render API 設定。自動部署關閉，更新原始碼後請在 Render 選 Manual Deploy → Deploy latest commit。倉庫根目錄的 ZIP 為舊的上傳備份，不參與正式建置。

本專案原始碼與正式前端均不包含 Render 或 GitHub Token。

