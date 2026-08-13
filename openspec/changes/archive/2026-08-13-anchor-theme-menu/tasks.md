## 1. 選單結構

- [x] 1.1 依 design 的「觸發鈕外包一層不綁按壓事件的 wrapper 當 containing block」，在 `src/components/ThemeMenu.vue` 把觸發鈕包進一層新的 wrapper 節點，wrapper 不綁任何 `main-thread-bind` 事件，三個按壓綁定全部留在觸發鈕上。完成時 requirement "The container that positions the menu carries no press feedback" 成立：wrapper 不含任何觸控綁定。驗證：搜尋 `src/` 確認 `main-thread-bindtouchstart`、`main-thread-bindtouchend`、`main-thread-bindtouchcancel` 三者出現次數仍然相等且總數不變（§12.22 結尾記的那條搜尋判準）。

- [x] 1.2 讓選單面板改由 `src/components/ThemeMenu.vue` 在 wrapper 內渲染，並從 `src/App.vue` 移除選單面板的渲染與 `ThemeMenuList` 的匯入；攔截層仍留在 root 的 overlay band，因為它必須蓋住整個螢幕。完成時 requirement "The menu is anchored beneath its trigger by layout alone" 的結構前提成立：面板是包住觸發鈕那個容器的後代。驗證：pnpm run typecheck 通過，且 `src/App.vue` 不再出現 `ThemeMenuList`。

## 2. 定位與疊層

- [x] 2.1 依 design 的「選單以 top 100% 對齊觸發鈕左緣，不做水平夾制」，在 `src/App.css` 給 wrapper 加上定位規則，並把選單面板的規則從固定位移（`left: 21px`／`top: 21px`）改為 `position: absolute`、`left: 0`、`top: 100%` 加一個 stacking 值。完成時 requirement "The menu is drawn in the root's overlay band at declared offsets" 所描述的兩個字面位移已從樣式表消失，選單位置改由版面關係決定。驗證：搜尋 `src/App.css` 確認 `21px` 不再出現在選單規則中；pnpm run check 通過。

- [x] 2.2 依 design 的「攔截層以宣告的 z-index 排在選單之下，並保留移除攔截層的退路」，給 `.ThemeMenuCatcher` 宣告一個低於選單面板的 stacking 值，並在該規則的註解裡寫明退路（若實機上攔截層仍吃掉選單列的按壓，就移除攔截層，只留觸發鈕關閉）。完成時 requirement "The menu closes without a translucent layer" 新增的疊層條款有對應的宣告。驗證：pnpm run check 通過，且攔截層仍不宣告任何 `background-color`。

- [x] 2.3 依 design 的「錨定形狀以類別組合表達，不抽成獨立元件」，wrapper 與面板的定位規則使用不帶主題語意的類別名稱，並在 `src/App.css` 的註解寫明這組類別是給日後其他控制項沿用的，以及已量測範圍僅限本次的排列（跨 `<scroll-view>` 邊界與更深巢狀未量）。驗證：內容審閱 —— 註解明確指出已量與未量的邊界，不得寫成一般性的保證。

## 3. 說明與既有文件對齊

- [x] 3.1 改寫 `src/components/ThemeMenu.vue` 與 `src/components/ThemeMenuList.vue` 的檔頭說明：兩者目前都在描述 overlay band 的排列與「無物可將選單抬起」的理由，那個理由已被 §12.29 推翻。新說明要保留仍然成立的部分（`fields` 不回 callback，所以位置不由量測決定）。驗證：內容審閱 —— 檔頭不得再宣稱本專案沒有 stacking index，也不得把 §12.28 的結論寫成涵蓋觸控座標。

- [x] 3.2 在 `design/theme-menu-variants.html` 的變體 C 區塊補上結論文字：該變體所押的 `z-index` 已於 2026-08-13 實機量到成立（§12.29），且是最後採用的做法；頁面開頭「橘框是我的建議」指向變體 A 的敘述要一併更正。不重拍任何截圖。驗證：內容審閱 —— 頁面不再有任何一處把變體 C 描述成未量測的賭注。

## 4. 驗收

- [x] 4.1 三項自動檢查全過：pnpm run check、pnpm run typecheck（vue-tsc，不是 tsc）、pnpm test。測項總數必須仍為 253 —— 本次不改任何 Example 表，選單位置在 Node 裡量不到。驗證：三個指令各跑一次，test 輸出的測項數與變更前相同。

- [x] 4.2 iOS 實機驗收四項，逐項記錄結果：選單開在觸發鈕正下方且完整可讀；按住觸發鈕時鈕下移而選單不動；按選單列會換模式而不是只把選單關掉；把篩選結果縮到個位數後再開一次，選單仍在鈕的正下方。驗證：實機逐項操作。web 預覽不作為判準（§12.22／§12.29 都記過理由）。

- [x] 4.3 若 4.2 第三項失敗（按列只關閉選單、模式沒變），依 design 的退路移除攔截層，只保留觸發鈕再按一次關閉，並把這個結果寫進 `design/HANDOFF.md` §12.29 第二條的已量範圍。完成時 requirement "The menu closes without a translucent layer" 的移除條款被執行而不是被忽略。驗證：實機重測「按選單列會換模式」與「按觸發鈕會關閉」兩項。若 4.2 第三項通過，此任務標記為不需執行並註明。

  > **不需執行** — 4.2 第三項通過：實機上按選單列會換模式，攔截層沒有吃掉按壓。

- [x] 4.4 若 4.2 第一項失敗，先分辨是被蓋還是被裁（判法：被蓋的話面板邊框還在只是被字壓住，被裁的話連邊框一起在同一條水平線上消失），再依 design 的 Failure modes 回退到 overlay band 排列，並在 `design/HANDOFF.md` §12.29 第二條記下與探針矛盾的實測結果。驗證：實機重測；回退後選單仍能開啟與選取。若 4.2 第一項通過，此任務標記為不需執行並註明。

  > **不需執行** — 4.2 第一項通過：選單開在觸發鈕正下方且完整可讀，既沒有被蓋也沒有被裁。

## 5. 驗收後補做（選單寬度回歸）

- [x] 5.1 讓選單在任何模式下都把最長的模式名畫成一行：給選單面板宣告自己的寬度，不再由觸發鈕的寬度決定。完成時 requirement "The menu holds its widest row independently of the trigger's width" 的第一段成立。宣告值要在註解裡寫出推導（最寬模式名在 SilkBold 13px 加 1px 字距下的寬度，加上列的左右內距、面板內距與邊框），並註明量法是讀字型檔而不是網頁預覽（§12 開頭記過預覽量不準）。驗證：pnpm run check 通過；在 POCKET 模式下開選單，EMERALD 那一列為單行。

- [x] 5.2 讓「新增一個名字過長的模式」變成檢查失敗而不是無聲換行：在 `scripts/check-styles.mjs` 加一項檢查，從 `src/theme/modes.ts` 讀出模式集合、從 `src/assets/fonts/Silkscreen-Bold.ttf` 量出每個名字的寬度，與 `src/App.css` 宣告的選單寬度相比，放不下就失敗並指出是哪個模式、需要多寬。完成時 requirement "The menu holds its widest row independently of the trigger's width" 的第二段成立。驗證：pnpm run check 通過並列出這項；暫時把某個模式名改長可讓該項失敗，確認後改回。

- [x] 5.3 把 4.2 第三項量到的結果補進 `design/HANDOFF.md` §12.29 第二條的已量範圍：攔截層位在 root 層級、以宣告的 z-index 排在選單之下，實機上選單列確實收得到按壓。這比 §12.29 原本記的高一階，design 也把它列為本次唯一未經事前量測的賭注，結果要留下來而不是只留在對話裡。驗證：內容審閱 —— §12.29 第二條說明已量範圍的那段要涵蓋這一層，且不得寫成涵蓋更深的巢狀或跨 `<scroll-view>` 邊界。
