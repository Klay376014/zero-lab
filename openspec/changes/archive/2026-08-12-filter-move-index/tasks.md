## 1. 查詢狀態與述詞

- [x] 1.1 在 src/state/moveQuery.ts 交付 "Move query state is shared, independently settable, and outlives the tab"：三個條件（搜尋字串、屬性選集、傷害類別選集）為模組層 ref，各自可獨立設定，唯有清除操作把三者回到初始值，切換分頁與開關層都不重設，且圖鑑分頁的清除不影響三者。依 design 的「新開 src/state/moveQuery.ts 而非擴充 query.ts」與「篩選狀態比畫面活得久」兩項決策，不得改動 src/state/query.ts 的行為。驗證：新增 tests/move-query.test.ts 直接驅動該模組，斷言該 requirement 的四個 scenario；pnpm test 通過。
- [x] 1.2 交付 "Move search matches names in both languages and matches nothing else"：招式語料為英文名與中文名串接後小寫、不含屬性名、不含傷害類別、不含說明文字，兩語言恆在語料中，字串以空白切 token 且每個 token 都要命中，全空白視為無條件，語料逐筆記憶化（比照 searchHaystack 的 per-entry Map）。依 design 的「搜尋語料只收中英名稱並逐筆記憶化」。驗證：tests/move-query.test.ts 跑該 requirement 的八列 Example 表（空 496、兩個空白 496、牙 7、fang 6、火焰 7、ice 9、fire fang 1、FIRE FANG 1）。
- [x] 1.3 交付 "Selections within a condition combine disjunctively and the three conditions combine conjunctively"：屬性多值之間 OR、傷害類別多值之間 OR、三個條件之間 AND，空選集不施加任何限制。依 design 的「多值為 OR，三個條件之間為 AND」。驗證：tests/move-query.test.ts 跑該 requirement 的十二列真值表（含 Water 27、Water 與 Dark 59、Water 加物理 12、Water 與 Dark 加物理 31、Water 加物理與變化 16、Ice 加變化 4、牙 加 Water 加物理 0）與兩個具名 Example。
- [x] 1.4 交付 "The derived sequence names each move together with its index in the shared move table"：推導序列的每個元素帶著招式在共用招式表中的索引，索引在條件套用**之前**自來源表取得，篩選不得重新編號。依 design 的「列的招式身分取自來源序列，不是篩選後的位置」。驗證：tests/move-query.test.ts 斷言未篩選時索引等於位置、篩選後索引不連續且第一個元素仍帶 極光幕 / Aurora Veil 在共用招式表中的索引。

## 2. 字串表與結果計數

- [x] 2.1 交付 "The result count is a localised statement, not a bare ratio" 推廣到兩個分頁：招式分頁的 masthead 副標由資料集常數改為「相符數 / 總數 個招式」，總數讀自資料集 meta block；新增招式分頁自己的三個字串鍵（搜尋框佔位字、傷害類別列標籤、無相符招式的句子），佔位字不得沿用 searchPlaceholder，無相符句子不得沿用 mvNone；移除失去唯一呼叫點的 moveCountLabel。依 design 的「結果計數回到 masthead 副標，不在篩選列另放」。驗證：tests/i18n.test.ts 新增該 requirement 的十列雙語 Example（含 0 / 496）；pnpm run typecheck 通過，證明沒有殘留的 moveCountLabel 呼叫點。

## 3. 篩選列與招式分頁

- [x] 3.1 新增 src/components/MoveFilterBar.vue 交付 "The moves tab carries its own filter row and does not render the dex tab's query bar"：三列控制項（搜尋框與清除鈕／屬性標籤與 18 顆屬性晶片／傷害類別標籤與三顆晶片），沿用 .Chip 與 .ChipOn、.TypeChips 與 .TypeCell 與 .TypeChip 與 .TypeChipOn、.QueryInput、.Label 既有規則，TypeGlyph 只用 typechip 與 accent 兩個既有表面，搜尋框三個顏色以 inline style 寫在元素上並以顯示模式當 key。依 design 的「篩選列是三列，樣式與字符表面全部沿用」。驗證：pnpm run check 通過（不得新增 GlyphSurface 成員、不得產生新的選中規則對違反）；實機手動確認切換顯示模式後搜尋框配色跟著換。
- [x] 3.2 招式分頁改讀 move-query 的推導序列，交付 "The moves tab lists every move in the shared move table" 的修改後行為：無條件時 496 列全在，有條件時只留符合者，且留下的列維持共用招式表的相對順序（篩選不重排）。點一列仍開啟該列招式的詳情、與篩選狀態無關。驗證：pnpm test 的順序斷言；實機手動在有條件與無條件下各點一列，確認開啟的是該列的招式。
- [x] 3.3 交付 "A result with no matching moves is stated in words"：條件篩到零筆時列區改為招式分頁自己的句子而非空白，句子的字體堆疊以閱讀字面領頭，且不得寫入 console。驗證：實機以搜尋「牙」加 Water 加物理 重現零結果，確認句子出現、無列渲染、console 無輸出。
- [x] 3.4 交付 "Only the visible range of rows is materialised" 的修改後行為與 "The declared viewport height is not reduced for the filter row"：可捲動範圍隨當前序列長度而非固定 496 列，序列變短時範圍被夾住且不呼叫任何捲動 API、不儲存也不還原捲動位置；MOVE_INDEX_VIEWPORT 維持原值，並把「高估方向嚴格更安全、要改必須實機量測」的理由寫進 src/state/rowMetrics.ts 的註解。依 design 的「可視範圍視窗的高度常數評估後不改」。驗證：pnpm run check 的列高檢查仍通過；實機兩項 —— 捲到序列深處後設條件篩到少數列（每列都命名存在的招式、無空白列），以及在有條件與無條件下各從第一列捲到最後一列（無空白、無名稱與數字錯配）。

## 4. 文件與收尾

- [x] 4.1 改寫 src/components/MoveIndex.vue 的檔頭註解，使其不再宣稱 "The move index carries no query controls"：該 requirement 已移除，註解目前明寫「No query controls: no search field, no type filter, no sort」，其中排序仍然不做的理由要保留並指向 ROADMAP A6，其餘改為描述篩選列的實際行為。驗證：內容審閱 —— 註解與 openspec 的 move-index spec 逐句不衝突。
- [x] 4.2 在 openspec/LANGUAGE.md 新增一筆詞彙，收斂「篩選／過濾／查詢」三種說法：定「篩選」為條件與動作、「查詢列」專指圖鑑分頁那一塊、招式分頁那塊用不同名稱，並寫出 why（兩個分頁各有一組控制項後，混用會讓句子讀不出在講哪一個分頁）。驗證：內容審閱 —— 該筆有 definition、avoid、why 三欄且 why 寫得出具體誤讀情境。
- [x] 4.3 更新 ROADMAP.md：記下招式分頁篩選是移植版自己新增的範圍（非設計稿差距），把排序留在 A6 並註明本次刻意不做的四項（性質、威力區間、本系加成、說明文字進語料）與理由，並在「字串表少了某個鍵是功能沒做的最快指標」那條加上 moveCountLabel 的例外。驗證：內容審閱 —— 四項不做的理由各有指向的位置，且缺鍵例外清單同時列出 masthead 四個規模計數與 moveCountLabel。
- [x] 4.4 跑完三項檢查並記錄驗收結果：pnpm run check、pnpm run typecheck、pnpm test 全綠；3.1、3.3、3.4 列出的手動項逐條回報。驗證：三個指令的輸出貼在對話中，各手動項逐條回報通過或失敗；任何一項失敗要停下來而不是繼續。

  **2026-08-12 實際結果**：三項自動化檢查全綠（check 四項不變式 0 violation、typecheck exit 0、test 221 passed）。手動項**以網頁預覽驗收，未上實機** —— 使用者確認三個篩選條件皆有效。**因此下列四項仍未被實機驗證**，已記入 ROADMAP B 節的驗收證據欄：（一）切換顯示模式後原生搜尋框是否重繪配色（3.1）；（二）零結果句子與 console 無輸出（3.3）；（三）深處捲動後篩到少數列的邊緣（3.4）；（四）有／無條件下各捲完整段的錯配（3.4）。第（一）與第（三）(四)項是預覽結構上到不了的：原生文字欄位的重繪行為與捲動容器的回報都不存在於 web 環境（design/HANDOFF.md §12.5、§12.9）。第（三）(四)項也是 `MOVE_INDEX_VIEWPORT` 維持 640 這個決定唯一的實測驗證。
