## 1. 實機探針（gate —— 在任何元件改寫之前）

- [x] 1.1 依 "The scroll offset source is adjudicated on a physical device before any sequence is windowed" 與 design 的「捲動位移的來源由實機探針裁決，探針帶對照組」建三臂探針並在 iOS 實機跑：對照臂（同一個容器上綁一個必然會發生的事件）、位移臂（把捲動事件的 detail 逐欄印在畫面上）、頻率臂（從頂捲到底，記錄事件次數與最大位移間隔）。
  探針**不自行判定通過與否**，交付的是三組原始讀數。驗證：畫面上可讀出 detail 有沒有 `scrollTop`、對照事件有沒有觸發、以及最大位移間隔的數字。
- [x] 1.2 判讀 1.1 並決定是否繼續：捲動事件必須送達且帶可用位移，否則整個方案停在這裡不進第 2 節。
  交付的是 go/no-go 結論、位移是絕對值或只有 deltas 的裁決、以及由最大位移間隔定出的緩衝屏數。
  驗證：三項連同讀數寫進 design/HANDOFF.md 的捲動事件新節；no-go 時本 change 就此停止。
- [x] 1.3 一併驗巢狀情形：招式表與學習者清單都在詳情面板的捲動容器內，確認**內層**容器同樣收得到捲動事件。
  交付的行為是內層容器捲動時讀數會變。驗證：開一個招式數多的物種，捲動招式表本身，看內層讀數是否更新。

## 2. 區間推導（唯一能在 node 下驗的部分）

- [x] 2.1 依 "The range is derived by a pure function of scroll offset and sequence shape" 與 design 的「區間推導做成純函式，與平台與框架都無關」實作推導：輸入捲動位移、可視高度、單項高度、每列項目數、項目總數、緩衝屏數，輸出起訖索引與兩個佔位高度，且不讀全域狀態、不碰元素。
  驗證：`pnpm test` 以 spec 的兩張 Example 表格逐列驗（雙欄網格 208 筆與單欄清單 105 筆各四列）。
- [x] 2.2 依 "A sequence that changes length clamps the range without commanding the container" 與 design 的「序列改變時區間夾回合法範圍，但不主動捲動」，讓推導在序列變短時把起訖夾回新長度。
  交付的行為是篩選後不產生越界索引也不留空隙。驗證：`pnpm test` 斷言「捲到很下面時序列從 208 變 12」的區間只含存在的索引；並搜尋原始碼確認沒有任何捲動 API 呼叫、沒有儲存或還原捲動位置的程式。
- [x] 2.3 依 "Scroll height is preserved by spacers, not by altering the container" 與 design 的「佔位用兩個 view 撐住捲動高度，不改捲動容器本身」，讓推導輸出的兩個佔位高度使可捲動總高度與全部渲染時相同。
  驗證：`pnpm test` 對每個 Example 列斷言「前置佔位 + 渲染列數×單項高度 + 後置佔位」等於全序列的高度。

## 3. 高度不變式

- [x] 3.0 依 "Card height is stable when optional rows are empty" 與 design 的「卡片改為所有列等高，用保留行數而不是截斷」，在實機量出名稱列需要保留多少高度：四個最壞情形（Crabominable、赫拉克羅斯、Paldean Form (Combat Breed)、帕底亞的樣子（鬥戰種））在兩種語系下各佔幾行。
  交付的是保留高度的數值與它依據的量測。驗證：數值與量測的四個情形寫進 design/HANDOFF.md；**量測必須在實機**，web 預覽的文字寬度不算數（§12.17）。
- [x] 3.1 依 "Item height is declared once and asserted against the stylesheet" 與 design 的「單項高度以常數宣告，並由檢查腳本擋住漂移」，把三處的單項高度各宣告在一處，並新增一條 `pnpm run check` 的檢查比對常數與樣式表的宣告值。
  交付的行為是兩者不一致時非零退出並指名是哪一項。驗證：故意改動樣式表的高度後 `pnpm run check` 失敗且訊息指名該項，改回後通過。

## 4. 三處接線

- [x] 4.0 依 "Card height is stable when optional rows are empty" 以最小高度保證卡片列距一致，機制與 `.CardNameAlt`、`.CardForm` 既有的保留做法相同，不引入固定高度也不引入任何截斷。
  **3.0 的量測改變了這一項的形狀**：實機上四個最壞情形的名稱與形態名都只佔一行，所以要保留的不是「名稱列的行數」而是「儲格的列距」——宣告落在 `.DexCell` 而不是名稱列上。
  交付的行為是每一張卡片的外框高度都相同、且最長的名稱仍然完整可見。驗證：實機目視兩種語系下全網格無一列與其他列高度不同，且 Crabominable 的名稱沒有被裁切或加省略號。
- [x] 4.1 依 "The card area scrolls in a plain scrolling container, not the recycling list element" 讓網格只渲染區間內的卡片，目標可視卡約 10 張（雙欄約 5 列），前後加緩衝，並保留既有的物種編號加形態索引識別鍵。
  交付的行為是卡片內容、順序、篩選結果與可捲動範圍都不變。驗證：`pnpm run typecheck` 通過，既有 66 個測試全綠，實機篩選後不留舊卡。
- [x] 4.2 依 "The range updates on a change of first index, not on every scroll event" 與 design 的「區間只在起始索引改變時才更新」，讓推導出的起始索引未變時不觸發重新渲染，且不使用任何計時器。
  交付的行為是捲動不足一個項目高度時畫面不重繪。驗證：搜尋原始碼確認視窗化路徑上沒有計時器；實機快速捲動時畫面不閃動。
- [x] 4.3 依 "The learnset table renders one row per move in the displayed form's section" 讓招式表只渲染區間內的列，並以佔位撐住 105 列應有的捲動範圍。
  交付的行為是每一列仍可由捲動到達、排序與本系篩選結果不變。驗證：`pnpm test` 既有的 learnset 相關測試全綠；實機捲完 105 列無空白、無錯配。
- [x] 4.4 依 "The learner list states the move, the count, and two species per row" 讓學習者清單只渲染區間內的列（最大 225 筆、每列兩個物種），並保留標題的招式名與總數。
  交付的行為是總數仍顯示完整關係大小，而非渲染中的列數。驗證：實機開一個 225 筆的招式，標題數字為 225 且捲完無空白。
- [x] 4.5 依 "A long sequence materialises only the range that can be seen, plus a buffer" 確認視窗化只套用在三處長序列上，其餘十二處 `v-for`（屬性 1–2、排序鈕 3、種族值 6、特性 ≤3 等）維持全量渲染。
  交付的行為是短序列不付任何推導成本。驗證：搜尋 `src/` 列出所有 `v-for`，確認只有 DexGrid、LearnsetTable、MoveLearners 三處接上推導。
- [x] 4.6 依 design 的「揭示動畫的錯開改以區間內的序位計算」，確認開機揭示在視窗化後仍逐格出現，且旗標關閉後新掛載的卡片不套用任何延遲。
  交付的行為是開機時首屏卡片逐格出現、捲動時新卡片直接出現不帶延遲。驗證：實機開機目視首屏逐格出現，之後捲動時新卡片無延遲感。

## 5. 驗收與文件

- [x] 5.1 iOS 實機量詳情面板：開 #475 艾路雷朵，等待須從 **897ms** 降到 **400ms 以下**。
  交付的是新讀數。驗證：讀三次（單次讀數擺動可達 200ms，見 §12.24），三次連同 897ms 的基準記入 design/HANDOFF.md。
- [x] 5.2 iOS 實機量網格並捲完整份陣容：未篩選狀態從第一張捲到第 208 張。
  交付的行為是全程無空白卡、無錯配內容，且最慢 sprite 讀數顯著低於 2327ms。驗證：讀數記入 design/HANDOFF.md，捲動過程目視確認。
- [x] 5.3 iOS 實機捲完最長的學習者清單（225 筆）：全程無空白列、無錯配內容，且標題的總數仍是完整關係大小而非渲染中的列數。
  **這一項沒有可比的時間讀數**：該畫面不畫任何圖片，沒有可以掛完成事件的東西，而 mount 時間早已量到是弱代理（13ms 對 897ms 的實際等待，§12.24）。交付的是目視結果與渲染中的列數區間。驗證：目視確認，並把「無可比讀數」的理由記入 design/HANDOFF.md，不以弱代理值充數。
- [x] 5.4 更新 ROADMAP.md 的「效能與記憶體數字」一列與 `dex-grid` 在 design/HANDOFF.md 的相關段落，把可視範圍視窗從「保留的退路」改為「已啟用」，並附三處的前後數字。
  驗證：該列可讀出三處各自改動前後的數字與量測條件；§12.13 的 `<list>` 結論維持不變且被指向為視窗化必須自己寫的理由。
- [x] 5.5 移除量測用的臨時儀器（src/state/debugPerf.ts 與 App.vue、App.css、DexGrid.vue、SpeciesCard.vue、SpeciesDetail.vue、selection.ts 內標了 TEMPORARY 的呼叫端）。
  **這一項原本漏了**——5.1／5.2 的讀數需要它，所以它必須留到驗收之後才移除。交付的行為是畫面上不再有除錯讀數。驗證：搜尋 src/ 無 debugPerf 與 TEMPORARY 字樣，`pnpm run typecheck`、`pnpm test`、`pnpm run check` 全通過。
