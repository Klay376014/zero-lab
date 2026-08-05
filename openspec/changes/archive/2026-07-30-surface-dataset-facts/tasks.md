## 1. 資料層

- [x] 1.1 讓資料層的 meta 區塊成為有契約的公開資料，滿足 `The data layer exposes the dataset's meta block`：四個規模計數、roster 標示與來源敘述可從匯出的資料集讀到，且四個計數各自對應一條既有的載入期不變式。落實 design 的「資料集的數字一律從 meta 讀，不接受字面值」。**驗證**：`npm exec tsc -- --noEmit -p src/tsconfig.json` 無錯；人工比對四個計數與 `assertCount` 的六條不變式，確認 species／form entries／mega forms／move table entries 四項都在其中。
- [x] 1.2 確認 roster 標示為空字串時載入不拋錯、值原樣曝露給呼叫端。**驗證**：暫時把記憶體中的 roster 值換成空字串跑一次，確認未拋錯且存取器照常回傳；驗畢還原。（範圍縮減後畫面已不消費 roster，此項只約束資料層。）

## 2. 字串表

- [x] 2.1 新增四個 tally 標籤鍵（種類／形態／MEGA／招式）到純字串介面，中英各一份，切換語言時四個標籤跟著換。**驗證**：`tsc` 無錯；介面新增的鍵在中英兩份表都存在，缺一邊會是屬性錯誤。
- [x] 2.2 新增結果計數的具名存取器，滿足 `The result count is a localised statement, not a bare ratio`：接受符合數與物種總數，回傳帶單位的本地化字串（中文「n / 208 種類」、英文「n / 208 species」）。不放進純字串介面，沿用 `formsOfLabel` 那類帶參數存取器的既有模式。**驗證**：`tsc` 無錯；以 (19, 208) 與 (208, 208) 兩組值在中英各呼叫一次，比對 spec 的 Example 表四列。
- [x] 2.3 新增 footer 的具名存取器，回傳「標題＋內文」元素的序列（目前一段：字型／版權），中英各一份。序列而非單一物件，日後增段時兩邊都不必改。落實 design 的「footer 只留字型／版權一段，五段來源說明不做」。**驗證**：`tsc` 無錯；呼叫一次確認中英各回傳一個元素、標題與內文皆非空、且不含任何插值佔位字。
- [x] 2.4 依 design 的「footer 的兩處敘述改寫為對移植版為真」改寫兩處，滿足 `Footer statements describe this implementation, not the design study`：字型面數量改為兩個、作品性質改為非商業作品。**驗證**：逐句比對 design 決策表兩列，確認新措辭在位且舊措辭已除。

## 3. masthead

- [x] 3.1 masthead 渲染四個計數，滿足 `The masthead states the dataset's scale as four counts`：依序為種類／形態／MEGA／招式，每個帶數字與標籤，順序寫死不隨 meta 欄位順序。**驗證**：畫面上四個區塊依序顯示 208／360／75／496 與對應標籤。
- [x] 3.2 結果計數改用 2.2 的存取器，分母取自 meta，並移除寫死的物種總數，滿足 `Dataset figures on screen are read from the dataset, never written as literals`。**驗證**：`grep -n '208' src/App.vue` 無輸出；畫面上的分母仍為 208。

## 4. footer 區塊

- [x] 4.1 渲染 footer，滿足 `The footer states the font licensing and the copyright notice`：一個標題與一段內文，內文含字型授權、著作權人與非商業聲明，且不宣稱任何資料來源。**驗證**：畫面上該段齊備；可讀到兩個字型家族名稱、其授權、三家著作權人與非商業字樣；畫面上找不到陣容／招式／種族值／中文名稱／圖像五段。
- [x] 4.2 把 footer 放進網格既有的捲動容器內、卡片之後，不新增任何捲動容器，滿足 `The footer scrolls with the cards and introduces no scrolling container`。落實 design 的「footer 放在網格的捲動容器內，不放在 masthead 之外的固定區」。**驗證**：捲到底可見 footer；footer 標記內無捲動容器元素；捲動時 masthead 四個計數不動。
- [x] 4.3 footer 標題走像素面、內文走散文面，落實 design 的「footer 的字型分工沿用既有規則，不新增規則」——不新增字型面，不改其他區域的分工。**驗證**：樣式表中 footer 相關規則只引用既有的字型家族名稱；`@font-face` 規則數量與改動前相同。

## 5. 驗收

- [x] 5.1 跑四項不變式檢查，重點在散文語料檢查是否接受 footer 內文的字元（`©`、`／`、`（）` 等）。⚠️ 該檢查只蒐集單引號與雙引號字面值，不吃反引號——footer 字串必須維持單引號，否則整段逃過檢查而檢查照樣顯示通過。**驗證**：`pnpm run check` 離開碼為 0，且以植入缺字的陽性對照確認檢查真的在讀這些字串。
- [x] 5.2 屬性檢查通過。**驗證**：`npm exec tsc -- --noEmit -p src/tsconfig.json` 離開碼為 0。
- [x] 5.3 雙語與雙模式手動驗收：中英各切一次，確認四個標籤、結果計數與 footer 全部換語言；POCKET／MODERN 各切一次，確認 footer 顏色隨模式。**驗證**：四項切換各觀察一次，全部跟隨。
- [x] 5.4 裝置驗收 footer 內文的換行：散文面在 web 預覽不載入，Latin 字寬不可信（見 design/HANDOFF.md §12）。**驗證**：在 LynxExplorer 或實機開啟，確認字型／版權段內文換行正常、無溢出、無截斷。
