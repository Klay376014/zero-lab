## 1. 產出字型資產

- [x] 1.1 在 `design/pipeline/fetch_fonts.sh` 加上取得散文面的步驟，讓「The reading face is embedded as a static instance, not as a variable font」與「Deriving the reading face is a scripted step outside the application build」成立：抓上游可變字型 → 以 fonttools 取靜態實例 `wght=400 opsz=13`（依 design.md 的「內嵌靜態實例而非可變字型，實例參數取 wght=400 / opsz=13」）→ subset 成 Latin-1 加標點、只留 `kern`（依「subset 取 Latin-1 加常用標點，不取資料集當下用到的字元集」）→ 寫出 `src/assets/fonts/Literata-Prose.ttf`。缺 fonttools 時以非零退出並印出可直接複製的安裝指令；沿用既有的「下載回來不是 TrueType 就報錯」判斷。依「fonttools 只出現在字型抓取腳本，不進 pipeline 主流程」，不動 `design/pipeline/run.sh`。驗證：跑該腳本，產物大小落在 30–45 KB；用 fonttools 確認產物**無 `fvar` 表**；故意把上游 URL 改錯一次，腳本在衍生任何東西之前就非零退出。
- [x] 1.2 把字型資產與授權一併進版控：`src/assets/fonts/Literata-Prose.ttf` 加入 git，`src/assets/fonts/OFL.txt` 補上 Literata 的授權文字（目前只有 Silkscreen 的）。驗證：`git status` 顯示資產已追蹤；乾淨 checkout 不跑任何腳本執行 `pnpm run build` 成功（對應「Application builds without the toolchain」場景）。

## 2. 樣式層改用散文面

- [x] 2.1 讓「Font roles are assigned by content kind」的修改版成立：`src/App.css` 註冊家族名 `Lit`（依 design.md 的「家族名 `Lit`，與設計稿一致」），三處散文規則（網格空結果、詳情警語、特性說明）從「不指名字族」改為指名 `Lit` 開頭的完整堆疊（含 `PingFang TC` / `Songti TC` / `Noto Serif TC` / `serif`，每處寫完整堆疊不抽自訂屬性），並移除任何 `font-optical-sizing` 宣告。驗證：`grep` 確認三處都指名 `Lit`、樣式表零處 `font-optical-sizing`；`pnpm run check` 通過；`pnpm run build` 後 lynx bundle 約 454 KB（字型以 base64 內嵌，成本是檔案大小的 4/3，見 design.md）。

## 3. 不變式與文件

- [x] 3.1 讓「The reading face is subset to a declared range, and its coverage is asserted」成立：在 `scripts/check-styles.mjs` 加入第三條檢查 `prose face covers the prose corpus`（依 design.md 的「字元覆蓋不變式放在既有的樣式檢查腳本裡」）—— 以 Node 內建能力直接解析 TTF 的 `cmap`（format 4 與 format 12 兩種子表，不加 npm 相依），語料由 `src/data/dex.json` 的英文特性說明加上 `src/data/i18n.ts` 的字串字面值產生（不得有手寫字元清單），CJK 排除在語料之外。缺字元時非零退出並列出缺哪些；資產不存在時非零退出並指出要跑哪個腳本，不得靜默跳過。驗證：`pnpm run check` 通過；在語料來源塞一個 `Ω` 後檢查失敗並列出該字元，移除後恢復；把資產暫時改名後檢查失敗並提到抓取腳本。
- [x] 3.2 更正 `design/HANDOFF.md` §12.2 的體積記載並記下正確的處理步驟：把「Literata TTF 比 WOFF2 大約兩倍」改為實測的三個數字（上游可變 933 KB、靜態實例 264 KB、subset 後 35 KB）與對照的 Silkscreen 30/32 KB，說明為什麼取靜態實例與為什麼不用資料集驅動的 subset，並把散文面佔位那一列改為已解決、同時註明 §11 的字型分工驗收項恢復可驗。驗證：閱讀該節，確認沒有任何數字與 design.md 的實測表不一致，且不再出現「約兩倍」這個說法。

## 4. 裝置驗收

- [x] 4.1 在 iOS 實機確認散文面真的生效：特性說明與詳情警語的拉丁文字是襯線體、與同一畫面的像素面明顯有別，中文仍是系統襯線體而非預設無襯線；把結果補進 `design/HANDOFF.md` §12。驗證：HANDOFF 記載實測日期、裝置與結論；若拉丁文字仍落在系統面，改採 design.md 記載的退路（只實例化不 subset，264 KB）並同樣記錄。
