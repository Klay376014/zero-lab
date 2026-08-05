## 1. 資料層推導

- [x] 1.1 在 src/data/dex.ts 新增招式反查存取器，交付 "A move resolves to the species that learn it" 與 "The learner relation is memoised, not recomputed"：輸入招式索引，輸出會該招式的物種唯讀陣列，涵蓋所有形態的區段而非只有基本形態，順序為資料集自身的物種順序，越界索引沿用 moveOf 既有的診斷訊息；依「反向索引以惰性 memo 建在資料層」以 Map 惰性記憶，與 allTypes 同模式。這兩個新成員同時納入 dex-data 的 "Derived value accessors" 語彙，形狀依 design 的「介面與資料形狀」。驗證：以 node 對 src/data/dex.json 直接比對三個量測值 —— 496 個招式全部至少一個學習者、單一招式最多 207 隻、配對總數 12939；並確認 module 載入後未請求任何招式時 Map 為空。
- [x] 1.2 在 src/data/dex.ts 新增形態挑選存取器，交付 "The form opened for a learner is the one that actually knows the move"：依「形態挑選以基本形態優先，缺該招式時退到第一個含它的形態」，基本形態區段含該招式時回傳基本形態索引，否則回傳第一個含它的形態索引；找不到時依 design 的「失敗模式」回傳基本形態索引而不擲出。驗證：以 node 斷言九尾配暴風雪回傳地區形態索引、九尾配火系招式回傳基本形態索引，並重算「只能經由非基本形態抵達的配對數為 174」。
- [x] 1.3 在 src/data/i18n.ts 補齊學習者清單的標題、學習者數量標籤與關閉控制項標籤，交付 "The string table carries the learner list's strings in both languages"：中英兩份鍵集完全相同，任一側缺鍵視為缺陷而非退路。驗證：以 node 比對兩份 entry set 的鍵集差集為空，並在兩種語系下開啟清單確認畫面上沒有任何鍵名外露。

## 2. 狀態與呈現

- [x] 2.1 新增 src/state/moveLearners.ts，交付 "The state holding the open move is separate from the selection"：持有目前檢視學習者的招式索引，並提供具名的開啟與關閉函式；該模組不由 selection.ts 擁有。驗證：關閉清單後斷言 selection 的 selected 未變動且詳情面板仍在元素樹中，關閉後模組不持有招式。
- [x] 2.2 新增 src/components/MoveLearners.vue 的內容呈現，交付 "The learner list states the move, the count, and two species per row"：標示招式在當前語系的名稱與學習者總數，物種以每列兩隻的精簡列列出物種名、編號與型別標記；依「清單以兩隻一列的精簡列呈現，不重用種族卡」不得引用 SpeciesCard，且不得有搜尋、篩選或排序控制項。驗證：開啟學習者數 207 的招式，確認列數為 104 且元素樹中沒有查詢控制項；以最長的中文與英文物種名確認兩欄不溢出。
- [x] 2.3 將 MoveLearners 掛在 src/App.vue 中作為詳情 overlay 的兄弟層並補 src/App.css 的定位與捲動規則，交付 "The learner list is presented above the detail panel as its own layer" 與 "The learner list is layered above the panel without changing how the panel is positioned"，同時維持 "The panel's scrolling containers are limited to the panel body and the learnset table"：依「學習者清單是詳情面板的兄弟層，不是面板內的區段」，清單自帶捲動容器且不是面板的後代，面板既有的定位宣告不得變動，不得使用 viewport-fixed 定位。驗證：pnpm run check 通過；檢視元素樹確認清單的 scroll-view 不是面板的後代；實機開啟 207 筆的清單捲到底，確認下層面板不隨之捲動。
- [x] 2.4 接上清單的選取行為，交付 "Choosing a learner replaces the selection and does not stack"：選中物種時以 1.2 的形態索引呼叫 openDetail 取代選取並關閉清單，不保留造訪歷史，關閉詳情一律回到網格。驗證：A 開招式選 B 後關閉詳情，斷言回到網格而非 A；並確認排序為威力且屬修篩選開啟時，切換後的招式表維持同樣設定。

## 3. 招式列與面板接線

- [x] 3.1 將 src/components/LearnsetTable.vue 的招式列改為控制項，交付 "A move row is a control that opens that move's learners"：依「招式列成為控制項並加入按壓標記集合」，tap 綁在列元素本身而非元件邊界，三個 main-thread 觸控屬性成套綁定（start／end／cancel），欄位表頭列不得成為控制項，且不得加入依賴 hover 的提示。驗證：實機在招式數超過 12 的物種上按住一列並滑動使其變成捲動，放開後該列不得停留在位移狀態；按壓表頭列確認無位移且不開啟清單。
- [x] 3.2 確保列所攜帶的招式來自該列的招式參照而非位置，交付 "The row a tap opens is the row's move, not the row's position"。驗證：切換為威力排序後點第一列、以及開啟屬修篩選後點同一位置，兩次開啟的清單分別對應當下該列渲染的招式。
- [x] 3.3 更新 press-feedback 的控制項集合，交付 "Press feedback covers the control set and excludes the card sequence and the veil"：招式列與清單的關閉鈕加入帶標記的集合，清單的物種項目與清單遮罩明確排除。驗證：實機逐一按壓招式列、清單關閉鈕、清單物種項目與清單遮罩，確認前兩者有一像素位移、後兩者無位移且各自的行為仍然發生。
- [x] 3.4 為 src/components/SpeciesDetail.vue 的掛載加上以物種為值的 reconciliation key，交付 "The panel is mounted on open and unmounted on close" 修訂後的取代語意：依「選取語意為取代，並以物種為面板的 reconciliation key」，物種切換等同一次卸載與掛載，捲動位置回到頂端，且不得新增任何讀寫捲動位置的程式；取代為同一物種時不得重新掛載。驗證：面板捲到招式表後切換物種，斷言新面板從頂端開始且揭示動畫重播；grep 確認 src/ 內無捲動位置的讀寫。

## 4. 詞彙、檢查與實機驗收

- [x] 4.1 建立 openspec/LANGUAGE.md，依「本次引進的用語登錄到 openspec/LANGUAGE.md」登錄學習者清單此一概念的正規用語與應避免的同義詞（UI 端的「會該招式的寶可夢」、實作端的「反向索引」），並一併登錄 CLAUDE.md 已指出的第一筆「本系加成／★ 屬修」。驗證：內容審閱 —— 每筆具備 definition、avoid 與 why 三欄，且本 change 的 proposal 與 design 用語與其一致。
- [x] 4.2 執行 design 的「驗收條件」中的靜態項目：pnpm run check 四項不變式通過且對比檢查涵蓋範圍不縮小（不新增 GlyphSurface 成員），npm exec tsc -- --noEmit -p src/tsconfig.json 無錯誤，且新增樣式不含 inset 陰影、grid 版面或 font-variant-numeric。驗證：兩道指令均以 0 結束；以 grep 確認三個禁用宣告在新增規則中零出現。
- [x] 4.3 完成 design 的「驗收條件」中的實機項目並依「範圍邊界」確認未溢出：九尾招式表點暴風雪、清單選回九尾，確認開啟的是阿羅拉的樣子且其招式表含暴風雪；A 至 B 切換後面板從頂端開始；207 筆清單捲動不牽動下層面板；招式列按壓轉捲動後不留位移。驗證：四項逐一在實機執行並記錄結果，牽涉手勢分派的兩項若靜態截圖無法呈現則錄影留證。
