## Summary

把設計稿的散文面 Literata 以靜態實例 + Latin-1 subset 的形式內嵌（實測 35 KB），取代詳情面板切片留下的系統字型佔位，並加上一條防止豆腐字的字元覆蓋不變式。

## Motivation

詳情面板切片第一次讓長文出現在畫面上（特性說明、兩則警語、網格空結果），但當時刻意讓它落到系統字型。理由記在 `design/HANDOFF.md` §12.2：Literata 是 WOFF2，Android 不吃，而換成 TTF「體積約兩倍」，不值得讓一個字型體積的決定卡住平台驗證。

**那個體積估計是錯的，錯得很嚴重。** 實測上游 Google Fonts 只提供可變字型 `Literata[opsz,wght].ttf`，**933 KB** —— 不是設計稿內嵌 WOFF2（45 KB）的兩倍，是二十倍。直接內嵌會讓 lynx bundle 從 406 KB 變成約 1.34 MB。

但同樣的實測也顯示這個問題有出路：先取靜態實例再 subset，體積是 **35 KB**，與現有的 Silkscreen（30 KB / 32 KB）同級。所以真正的障礙不是體積而是缺一道處理步驟。

現在做的理由是它現在很便宜，而且它是一筆會擴散的債：`design/HANDOFF.md` §11 的「字型分工未跑偏」驗收項在佔位期間是紅的，招式表切片會再加一處散文（`mvNone`），拖下去只會讓「哪些長文該是散文面」變得更難盤點。

## Proposed Solution

在既有的字型抓取腳本裡多做兩步，產出一個committed 的資產：

1. **靜態實例**：`wght=400`、`opsz=13`。字重取 400 因為散文只有一個字重（設計稿裡需要粗體的地方用的是像素面）。光學尺寸取 13 是因為設計稿的散文就是 13px 配 `font-optical-sizing: auto`，瀏覽器在該尺寸選到的就是這個值 —— 把它烘進靜態實例，就不必賭 Lynx 是否支援可變字軸或 `font-optical-sizing`。
2. **subset 成 Latin-1 加常用標點**：Literata 沒有 CJK，中文本來就穿透到系統襯線體，所以只需要拉丁字。實測 221 個字形覆蓋資料集英文散文用到的 63 個字元且有餘裕。

subset 的風險是上游資料日後出現沒收錄的字元，畫面上會是豆腐字而不是報錯 —— 這正是這個專案用不變式擋的那種靜默失敗。所以加一條檢查：**散文語料的每個字元都必須在字型的 cmap 內**，違反就以非零退出。語料取自資料集的英文特性說明加上字串表的英文長句。

樣式層把三處長文從「不指名字族」改為指名新家族，並移除 `font-optical-sizing`（已烘進實例，宣告留著只會讓人以為它有作用）。

## Non-Goals

- **不處理 Android 的實機驗證**。這批讓字型格式對 Android 成立（TTF），但手上沒有 Android 裝置，驗證仍掛帳
- **不動招式表的 `mvNone`**。那處長文屬批次 B，屆時指名同一個家族即可
- **不引入粗體散文面**。設計稿的散文只有一個字重
- **不改中文的字型堆疊**。中文穿透到系統襯線體是設計稿本來的行為，不是缺口
- **不把 fonttools 加進 `design/pipeline/run.sh`**。字型抓取本來就在該流程之外，只在需要更新字型時手動跑

## Alternatives Considered

**直接內嵌 933 KB 可變字型**：bundle 增加 235%。也賭上 Lynx 對可變字軸的支援 —— 若不支援，拿到的是預設實例（`opsz=12`）而非設計稿的視覺，而且沒有任何錯誤訊息說明這件事。

**subset 成資料集當下用到的 63 個字元**（實測 9 KB）：更小，但把字型綁在當下的資料集上。任何上游新增的字元都會是豆腐字，而省下的 26 KB 換不到這個風險。

**維持系統襯線體，只把字族改成具名襯線堆疊**：0 KB，而且滿足「散文用閱讀面、與像素面對比」這個角色分工。否決的理由是它換不到設計稿指定的字型，而現在的成本只有 35 KB —— 若成本真是 933 KB，這會是正確答案。

## Impact

- Affected specs: `pixel-typography`（修改）
- Affected code:
  - New:
    - src/assets/fonts/Literata-Prose.ttf
  - Modified:
    - design/pipeline/fetch_fonts.sh
    - scripts/check-styles.mjs
    - src/App.css
    - src/assets/fonts/OFL.txt
    - design/HANDOFF.md
  - Removed: （無）
- bundle 體積：lynx 目標從 406 KB 增至 454 KB（+11.8%）。字型資產本身是 35.8 KB，但 `lynx.config.ts` 的 `dataUriLimit` 讓它以 base64 內嵌，所以 bundle 成本是檔案大小的 4/3
- 建置期新增一個**只在更新字型時**需要的相依：fonttools（含 brotli）。應用端建置不需要它，資產已進版控
- 不新增任何 npm 執行期相依
