## Context

招式分頁目前把 `dex.moves` 的 496 筆整批映射成列、交給自管的可視範圍視窗渲染，沒有任何查詢控制項。`move-index` spec 有一條刻意寫下的 requirement 禁止這件事，理由是每個條件都要付自己的狀態、結果計數敘述與與視窗的互動成本。

四項既有資產讓這次的成本比當初評估的低：

- **OR 語義已經是規範。** `dex-query` 已明文「a second selection widens the result, not narrows it」，屬性晶片的多選行為不需要重新決定。
- **序列變短時夾住範圍已經是規範。** `visible-range-window` 的 requirement「A sequence that changes length clamps the range without commanding the container」，其 scenario 正是「篩選把 200 筆減為 12 筆而容器捲在很下面」，並明文禁止呼叫任何捲動 API。招式分頁的視窗本來就 watch 序列並重算，不需要新機制。
- **空狀態與計數的形狀已經有前例。** `learnset-table` 的「An empty filtered result is stated in words in the reading face」與「The section heading states the learnset size and the filtered size」。
- **傷害類別的三個中英全名已經在字串表裡**（`damageClassName`：物理／特殊／變化），是招式詳情在用的，不必新增。

一項與原始討論不同的發現：**招式分頁的 masthead 副標已經在顯示招式數**（資料集常數 496），而該處註解明寫「the dex tab's result count is a statement about the query and would be a wrong answer to a tab that has no query」。招式分頁一有查詢，這句理由就反轉 —— 計數的位置早就存在。

## Goals / Non-Goals

**Goals:**

- 招式分頁能以名稱、屬性、傷害類別三個條件收斂 496 列。
- 三個條件的組合規則明確且可機器驗證（Example 表直接驅動 `src/state/moveQuery.ts`）。
- 篩選後的計數與空狀態在畫面上說得出來，讀者能區分「篩到很少」與「壞了」。
- 不引入新的樣式基元、不新增 `GlyphSurface` 成員，讓四項既有檢查維持有效。

**Non-Goals:**

- **排序不在範圍內。** 名稱／威力／屬性三種排序留待下一批，連同 ROADMAP A6 的排序控制項改造（單顆循環晶片在三元集合上會難用）一起評估。本次不動 `move-index` 那條「順序 SHALL 是資料集自己的」requirement。
- **性質（[[簡稱]]）不做篩選。** 21 個識別字裡 protect 340 筆、mirror 339 筆近乎全集，六個少於 10 筆；17 顆控制項換到大約 3 顆有用的切分。
- **威力區間不做。** 「有無威力」與傷害類別的變化招高度重疊，是它的劣化版；區間控制項是這個平台的新基元。
- **[[本系加成]]不做。** 判定依顯示中的形態，招式分頁沒有形態脈絡。
- **說明文字不進搜尋語料。** 與 §12.18 記的裸羅馬數字同形狀：命中發散到與「搜尋壞了」無法區分。
- 不重用 `DexFooter`，不在招式分頁新增 footer。
- 不觸碰圖鑑分頁的查詢列與 `src/state/query.ts` 的行為。

## Decisions

### 新開 src/state/moveQuery.ts 而非擴充 query.ts

`src/state/query.ts` 整個模組是物種形狀的：它的 `Result` 是物種加形態索引，`matchingFormIndex`、`bestBst`、`hasMega` 都在回答「哪一個形態符合」這個招式沒有的問題。把招式條件塞進去會讓兩個分頁共用一個 reset 與一個結果序列，切分頁互相污染。

前例是 `src/state/learnset.ts`：另一個序列有自己的 state 模組，模組層 ref 讓狀態比畫面活得久。

**介面深度**：這個模組裝三個條件的狀態**加上**推導出的序列與述詞，不是轉手；刪掉它招式分頁的篩選就沒了。不是 pass-through。

替代方案：把條件當 props 從 `src/App.vue` 傳下去。否決 —— 與既有三個 state 模組的安排不一致，且 `MoveIndex` 已經直接讀 `lang` 這類共用狀態。

### 搜尋語料只收中英名稱並逐筆記憶化

語料是招式的英文名與中文名兩個欄位串接後轉小寫，**不含屬性名、不含傷害類別、不含說明文字**。圖鑑分頁的語料收了屬性中英名，那裡合理 —— 沒有屬性晶片的話搜不到；這裡屬性晶片就在同一塊控制項裡，收進去等於讓搜尋框做一件晶片做得更好的事，還會製造發散命中。

記憶化比照 `searchHaystack` 的 per-species `Map`，鍵是招式物件，496 筆。

**連帶**：placeholder 不得沿用 `searchPlaceholder`（`名稱 / 編號 / 屬性 / 形態`）—— 那會承諾這裡不成立的範圍，正是 §12.18 記載的失效形狀（字串跑在實作前面）。需要招式分頁自己的鍵。

### 多值為 OR，三個條件之間為 AND

屬性多選之間 OR、傷害類別多選之間 OR、三個條件之間 AND。屬性的 OR 與圖鑑分頁一致，是 `dex-query` 已規範的行為；傷害類別採同一規則，讓同一種控制項在這個應用裡只有一種語義。

述詞形狀比照 `results` computed：對來源序列逐筆連續判斷，任一條不符就跳過。

### 列的招式身分取自來源序列，不是篩選後的位置

列必須先在 `dex.moves` 上帶著原始索引建立、再篩選，不能篩完才編號。`move-index` 已有 requirement 規定「The row's position SHALL NOT be used to identify the move」，理由是視窗在同一個位置渲染不同的列；篩選讓同一個位置在不同條件下也是不同的招式，把那條理由再加一層。

### 結果計數回到 masthead 副標，不在篩選列另放

招式分頁的副標從資料集常數（496 個招式）改為結果計數（相符數 / 總數 個招式），形狀與圖鑑分頁的 `resultCountLabel`（208 / 208 種類）相同。

理由有三：位置已經存在；masthead 高度是有人在搶的（查詢列為了讓出它被壓縮過，分頁鍵也需要常駐位置），在篩選列另放一個計數要再付一次垂直空間；而副標處的註解說「無查詢的分頁不該有結果計數」，這個前提正被本次改變。

**代價**：`moveCountLabel` 失去唯一呼叫點。移除它而不是留成死碼 —— 但必須在 spec 裡記下它是被取代的，否則下一批會照 ROADMAP 的「字串表少了某個鍵是功能沒做的最快指標」把缺鍵讀成未交付的功能（masthead 四個規模計數已經踩過這個坑）。

替代方案：計數放在篩選列內。否決 —— 會出現兩個計數（副標的常數與篩選列的結果數）互相矛盾，或要把副標改空。

### 篩選列是三列，樣式與字符表面全部沿用

版面：第一列搜尋框與清除鈕；第二列屬性標籤與 18 顆屬性晶片（九顆一行、兩行）；第三列傷害類別標籤與三顆晶片。

樣式沿用 `.Chip`／`.ChipOn`、`.TypeChips`／`.TypeCell`／`.TypeChip`／`.TypeChipOn`、`.QueryInput`、`.Label`，`TypeGlyph` 的 `surface` 沿用 typechip 與 accent 兩個既有成員。**不新增 `GlyphSurface` 成員**，所以對比檢查不需要教新東西；選中狀態沿用既有的 `…On` 規則，所以樣式檢查那條「選中規則必須緊接在被它覆蓋的基礎規則下方」不會有新的違反面。

搜尋框的三個顏色必須以 inline style 寫在元素上並以模式當 key，比照 `QueryBar` —— 原生文字欄位在建立後不重繪自訂屬性的變化。

### 可視範圍視窗的高度常數評估後不改

`MOVE_INDEX_VIEWPORT` 是 640，文件明寫它是刻意高估的：高估只是多渲染幾列（每個元素約 1.3ms），低估會讓捲動跑贏視窗而讓邊緣空白，**只有後者是靜默的**。篩選列讓容器變矮，於是 640 變成**更大的**高估，方向上嚴格更安全。以 34px 列高、0.5 螢幕緩衝估算，多渲染約四列。

所以本次不動這個常數，把這段理由寫進原始碼註解。真正會抓到它過期的是實機捲完整個序列，那本來就是驗收步驟。

替代方案：估一個新數字寫進去。否決 —— 那會是憑空的數字，而 `src/state/rowMetrics.ts` 的整份文件就在講「這些是量出來的，不是推出來的」。

### 篩選狀態比畫面活得久

三個條件放在模組層 ref，切換分頁、開關層都不重設，只有清除鈕重設。前例是 `learnset-table` 的「Sort order and the bonus filter are shared reactive state that outlives the panel」。

## Implementation Contract

**行為**：招式分頁在列之上出現三列篩選控制項。輸入名稱、點選屬性晶片或傷害類別晶片會即時收斂列；masthead 副標同步說出相符數與總數；沒有任何招式相符時列區改為一句話而不是空白。清除鈕把三個條件回到初始值。點一列仍然開啟該列招式的詳情，與篩選狀態無關。

**資料形狀**：`src/state/moveQuery.ts` 匯出三個條件的反應式狀態（搜尋字串、屬性選集、傷害類別選集）、切換與判斷選中的函式、清除函式，以及一個推導序列，其每個元素同時帶著招式與該招式在共用招式表中的索引。招式搜尋語料函式接受一個招式、回傳兩語言名稱串接後的小寫字串，並逐筆記憶化。

**字串表**：新增招式分頁自己的三個鍵 —— 搜尋框佔位字、傷害類別列的標籤、無相符招式的句子；沿用既有的屬性標籤與清除鈕文字。新增一個兩數字的招式結果計數函式；移除 `moveCountLabel`。無相符句子與學習集表格的 `mvNone` 文字可能相同但**必須是不同的鍵** —— `src/data/i18n.ts` 已明文「A separate set from the `mv*` keys even where the text coincides」。

**失敗模式**：零結果是正常結果，以句子敘述，**不得寫入 console**（`learnset-table` 已規範）。搜尋字串全為空白時視為沒有條件。篩選不呼叫任何捲動 API、不儲存也不還原捲動位置。

**驗收**：
- `pnpm test` —— 新增 `tests/move-query.test.ts` 直接驅動 `src/state/moveQuery.ts`（比照 `tests/` 既有做法，測真模組而非重寫述詞），跑 spec 的 Example 表：未篩選 496；Water 27；Water 與 Dark 兩選 59；該兩選再加物理 31；Water 加物理 12；搜「牙」7 筆且含惡屬性的以牙還牙／Payback；搜 fang 6；「牙」加 Water 加物理 0；Ice 加變化 4。
- `pnpm run check` —— 四項樣式與對比不變式必須仍然通過（本次不新增 `GlyphSurface` 成員、不新增選中狀態規則對）。
- `pnpm run typecheck` —— `vue-tsc`。**Lynx 元素屬性不受檢查**，篩選列的 `input` 與 `view` 屬性只能靠實機。
- 實機驗收兩項：（一）捲到序列深處後篩到少數列，邊緣不空白、不錯配；（二）從第一列捲到最後一列（篩選與未篩選各一次），無空白列、無名稱與數字錯配。

**範圍邊界**：
- 在範圍內：招式分頁的篩選列與其狀態、招式搜尋語料、招式分頁的 masthead 副標、招式分頁的空狀態、三個新字串鍵與一個新計數函式、`move-index` 那條 requirement 的改寫、`dataset-statements` 結果計數 requirement 的推廣、`openspec/LANGUAGE.md` 的詞彙一筆、ROADMAP 的對照更新。
- 不在範圍內：排序、性質篩選、威力區間、本系加成、說明文字進語料、圖鑑分頁的任何行為、`src/state/query.ts` 的行為、`src/data/dex.json` 與 `design/pipeline/` 的任何改動（本次不需要新資料欄位）、`MOVE_INDEX_VIEWPORT` 的數值。

## Risks / Trade-offs

- **[篩選列吃掉可見列數]** → 三列控制項讓一屏少看到大約四列。接受：找得到一個招式比一次多看四列有用，而這正是本次的動機。
- **[高估的視窗常數多花元素]** → 多渲染約四列，約 5ms。接受，且方向上比低估安全（低估是靜默失效）。
- **[深處捲動後篩到少數列]** → 夾住範圍的推導已涵蓋，且明文禁止呼叫捲動 API；容器自身的 scrollTop 由平台回彈。列為實機驗收第一項，因為 node 到不了捲動與版面。
- **[搜尋框在模式切換後留在舊配色]** → 原生欄位建立後不重繪，以模式當 key 強制重建，比照 `QueryBar` 的既有處置。
- **[兩個空狀態字串同文不同鍵，日後被合併]** → 在 spec 記下它們刻意分開，理由是兩個畫面各自演化；`src/data/i18n.ts` 對 `mv*` 與 `md*` 已有同樣的註記可引用。
- **[移除 `moveCountLabel` 被讀成功能漏失]** → 在 `dataset-statements` 的 delta 明寫它是被兩數字形式取代，並更新 ROADMAP 那條「缺鍵是最快指標」的例外清單。
