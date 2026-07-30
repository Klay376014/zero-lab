## 1. 探針：先確認機制成立，再寫任何實作

- [x] 1.1 依 design 的〈先跑探針，再寫任何實作〉，做出一個無條件的主線程探針：任選一顆現有控制項，綁 `main-thread-bindtouchstart` 到一個標了 `'main thread'` 指示詞的函式，按下必定改變一個一眼可辨的東西（例如把該元素整個推開 20px）。**交付的是一個答案而不是一段程式碼**：主線程事件綁定在本專案的建置設定下到底會不會生效。驗證方式：iOS 實機按下去有反應即為成立；沒反應則依序排除屬性名拼法（`main-thread-bindtouchstart`，`bind` 與事件名之間無分隔符）、`'main thread'` 指示詞是否為函式的第一個敘述。**探針未通過前不得進行第 2 節以後的任何工作。**
- [x] 1.2 用同一支探針回答 design 的〈主線程函式放哪裡，由探針決定〉：把探針函式移到 `src/interaction/press.ts` 並由元件匯入，確認建置期的 worklet 轉換是否涵蓋元件以外的獨立模組。驗證方式：iOS 實機上行為與 1.1 相同即為涵蓋，採用集中模組；若失效則採 design 記載的退路（函式定義在各元件的 `<script setup>` 內），並在本任務下記錄實際採用哪一條，供後續任務依循。
  - **答案（iOS 實機量的）**：綁定成立，且 worklet 轉換**涵蓋**元件以外的獨立模組 —— 探針函式從 `App.vue` 移到 `src/interaction/press.ts` 後行為不變，bundle 裡的 `_wkltId` handle 仍在。**採用集中模組**，design 記的退路（各元件各寫一份）不啟用。後續任務一律從 `src/interaction/press.ts` 匯入 `onPressStart` / `onPressEnd`。

## 2. 按壓層本體

- [x] 2.1 交付 spec 的「The press mark is a positional shift, never a colour or transparency change」需求：定義按壓位移的單一數值來源（`transform: translateY(1px)`），依 design 的〈按壓態是位移一個像素，不是換色也不是改不透明度〉不得改動任何顏色、不透明度或陰影。驗證方式：`node scripts/check-styles.mjs` 通過，且 `node scripts/check-contrast.mjs` 回報的組合數與本次改動前一致（目前為 9 組）—— 數字改變表示有人動了顏色，該退回。
  - **⚠️ 交付的位置與原本寫的不同，理由是實機量到的**：原定在 `src/App.css` 以 `--press-shift` 宣告、主線程函式以 `var()` 消費。實測**不成立** —— 主線程的 `__AddInlineStyle` 不對值做自訂屬性代換，四臂差異探針的結果是「字面值 `translateY(20px)` 會動、`margin-top` 會動、樣式表宣告的 `var()` 不動、行內宣告的 `var()` 也不動」。所以位移量改為 `src/interaction/press.ts` 裡的字面值（全專案唯一一處），`App.css` 只留一段說明為什麼樣式表裡沒有規則。spec 那句「只寫在樣式表」已改為「全專案只出現一次」，design 與 §12.22 同步。
- [x] 2.2 交付 spec 的「A control's press mark is drawn on the main thread without a thread crossing」需求：實作上按壓與清除兩個主線程函式，只讀 `event.currentTarget` 並呼叫其 `setStyleProperty`，不改動任何應用狀態、不呼叫 `runOnBackground`、不使用 `useMainThreadRef`。位置依 1.2 的答案。驗證方式：`npm exec tsc -- --noEmit -p src/tsconfig.json` 通過，且程式碼審查確認兩支函式沒有匯入任何 `src/state/` 模組。
- [x] 2.3 交付 spec 的「The press mark is cleared on release and on cancellation」需求：依 design 的〈三個觸控事件都綁，不是兩個〉，確立每個控制項一律綁 `main-thread-bindtouchstart`、`main-thread-bindtouchend`、`main-thread-bindtouchcancel` 三個屬性的固定寫法。驗證方式：在第 3 節每個元件改完後，以搜尋確認 `touchstart` 的出現次數等於 `touchend` 等於 `touchcancel`，三者不相等即為漏綁。

## 3. 綁上控制項

- [x] 3.1 外殼的模式鈕與語系鈕、查詢列的重置鈕、18 顆型別鈕、9 顆世代鈕、2 顆排序鈕按下去都出現位移，且原本的切換、篩選、排序、重置行為完全不變。位置在 `src/App.vue` 與 `src/components/QueryBar.vue`。驗證方式：iOS 實機逐類按過一遍，位移出現且既有行為未變。
- [x] 3.2 形態鈕、招式表的 3 顆排序鈕與屬修鈕、詳情面板的關閉鈕按下去都出現位移，且原本的切換形態、排序、篩選、關閉面板行為完全不變。位置在 `src/components/FormSwitcher.vue`、`src/components/LearnsetTable.vue`、`src/components/SpeciesDetail.vue`。驗證方式：iOS 實機開 #475 艾路雷朵逐顆按過一遍。
- [x] 3.3 交付 spec 的「Press feedback covers the control set and excludes the card sequence and the veil」需求：依 design 的〈範圍以「已經有 `@tap` 的控制項」為界〉，確認 208 張卡與詳情面板的遮罩**沒有**被綁上任何主線程事件。驗證方式：以搜尋確認 `src/components/DexGrid.vue` 與 `src/components/SpeciesCard.vue` 零個 `main-thread-` 屬性，且 `SpeciesDetail.vue` 的遮罩節點上沒有；iOS 實機按卡片與遮罩確認無位移、而開啟與關閉面板照常。
  - **搜尋部分已驗**：`DexGrid.vue` 與 `SpeciesCard.vue` 各 0 個 `main-thread-` 屬性；`SpeciesDetail.vue` 的 `DetailVeil` 節點只有 `@tap`，並加了註解說明刻意不綁。剩實機那半。

## 4. 與背景線程重繪的互動

- [x] 4.1 交付 spec 的「A background-thread style update ends the press mark, and this is accepted rather than corrected」需求：依 design 的〈主線程寫的樣式會被背景線程的重繪整份抹掉〉，確認型別鈕（唯一帶行內樣式綁定的控制項）按下後不會停留在位移狀態，且**不為此改寫型別鈕背景色的上法**、不讓兩個線程協調同一份樣式物件。驗證方式：iOS 實機連續按同一顆型別鈕開關數次，每次放開後該鈕都回到未位移狀態；程式碼審查確認 `chipBackground()` 的形式未被改動。
  - **程式碼審查已過**：`QueryBar.vue` 的 diff 只增加三個綁定屬性，`chipBackground()` 與 `:style` 的上法一字未動。剩實機那半。

## 5. 驗收與平台事實留檔

- [x] 5.1 兩項既有檢查在改動後全數通過，沒有任何一項因這次改動而需要放寬。驗證方式：`pnpm run check` 與 `npm exec tsc -- --noEmit -p src/tsconfig.json` 皆回傳 0。
- [x] 5.2 取消路徑在實機上成立：手指按在招式表的排序鈕上不放開、直接往上滑去捲動面板，放開後該鈕不停留在位移狀態，且排序未被改變。驗證方式：iOS 實機，開 #24 阿柏怪（70 列，招式表有界可捲）。**web 預覽不接受作為這一項的證據** —— 它跑的是瀏覽器的捲動與手勢實作而不是 native 的手勢鏈。
- [x] 5.3 位移量在實機上確實看得出來。驗證方式：iOS 實機目視；若 1px 過於細微，調整 `src/interaction/press.ts` 裡 `translateY()` 的那一個字面值 —— 全專案唯一一處。（原本寫「只調 `App.css`、不動主線程程式碼」，那條路平台不給走，見 2.1 下的註記。）
- [x] 5.4 `design/HANDOFF.md` §12 新增一節，記下本次量到的四件事：主線程事件綁定在本平台成立、正確的屬性拼法、獨立模組的 worklet 轉換是否涵蓋（1.2 的答案）、以及背景線程的樣式更新是整份取代而非逐屬性合併這條通則。每一項照該節體例寫明「若日後為假該怎麼辦」。驗證方式：內容審查 —— 四項齊備，且整份取代那一項寫成通則而不是只描述型別鈕。
  - **交付了五項而不是四項**：實機驗收過程中量到第五件事 —— 主線程寫的行內樣式不做 `var()` 代換（§12.22 第四項）。它也寫成通則，並附四臂探針的完整結果，因為它推翻了原本的設計、spec 有一句因此改寫。
