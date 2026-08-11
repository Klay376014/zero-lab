## 1. 資料管線：新增來源與三個招式欄位

- [x] 1.1 新增取得步驟，以瀏覽器 User-Agent 標頭抓取 52poke 招式列表並快取於 design/pipeline/，實作決策「中文說明改以 52poke 為來源，英文說明取自 PokeAPI」的取得端，並在 Dataset provenance 要求的冪等性下運作（已快取則略過）。驗證：連續執行兩次取得腳本，第二次對該來源輸出 skip 且不發出請求；快取檔解析出的資料列數為 920
- [x] 1.2 在聚合步驟以 move id join 52poke，為 496 個 Champions 招式取出中文名與中文說明，英文說明取 PokeAPI move_flavor_text 英文側 version group 最大的一筆並把換行正規化為單一空白；同時落實決策「外部來源只供文字，不供機制數值」，斷言寫出的威力／命中／PP 與 Champions 解析結果相同。驗證：執行聚合步驟，輸出報告 zh 說明 496/496、en 說明 496/496，且刻意把 52poke 數值注入後該斷言以非零狀態失敗
- [x] 1.3 落實 A move missing a description fails the pipeline：任一招式解析不到中文或英文說明時，聚合步驟以非零狀態結束並列出缺漏招式名，不寫出帶空字串的資料集。驗證：暫時移除快取中一列後重跑，步驟非零退出且訊息含該招式名
- [x] 1.4 依決策「資料形狀」與「flag 只進資料層，這一批不顯示」，把 flag 編號以升冪陣列寫入招式記錄，零 flag 的招式省略該鍵，並確認資料集不含任何 flag 標籤文字，滿足 Move records carry a bilingual description and flag identifiers。驗證：資料集中帶 flag 鍵的招式為 425 筆、無該鍵者 71 筆、單一招式最多 6 個 flag，且全域搜尋不到 flag 標籤字串
- [x] 1.5 依決策「管線行為」重跑整條管線，使設計文件資料集與應用資料集內容一致，並確認 8 筆簡體中文招式名（憤怒之拳、蟲撲、大憤慨、鎧農炮、冰山風、雙光束、晶光轉轉、噴射拳）已改為正體、兩筆原本無中文名者（Syrup Bomb、Matcha Gotcha）已補上，且管線重跑不再像 commit e634af9 的手編那樣被倒回簡體。驗證：應用資料集約 297 KB；資料集 496 筆招式的中文名皆非空，且以快取 PokeAPI 名稱會產生的 33 筆簡體字元在新資料集中一個都不存在；再次重跑管線後兩份資料集皆無位元變動

## 2. 資料層型別與字串表

- [x] 2.1 於 src/data/dex.ts 的 Move 型別新增中文說明、英文說明與唯讀 flag 編號陣列（可選）三個欄位，使消費端透過具名型別讀到它們。驗證：pnpm run typecheck 通過；一段讀取招式說明的程式在缺少該欄位時無法通過編譯
- [x] 2.2 落實 The string table carries the tab, move index and move detail strings in both languages：於 src/data/i18n.ts 補上兩個分頁標籤、招式清單欄位標籤、招式詳情欄位標籤與學習者數量陳述的中英兩語鍵，且元件不得出現這些字串的字面值。驗證：pnpm test 的字串表測試涵蓋新鍵；全域搜尋元件原始碼無這些字面值

## 3. 分頁與層堆疊的狀態模組

- [x] 3.1 新增 src/state/tabs.ts，實作 The application presents exactly two tabs 與 The active tab is shared reactive state：持有作用中分頁（圖鑑或招式，初始為圖鑑）與一個具名的切換函式，依決策「分頁與層堆疊由自有 state 模組承載，不引入 vue-router」不新增路由相依。驗證：新增的 tests 直接驅動該模組，斷言初始為圖鑑、切換後為招式；package.json 未新增相依
- [x] 3.2 新增 src/state/layerStack.ts，實作 A layer type holds at most one instance, and re-entry unwinds，落實決策「每種層最多一個實例，重入即回捲」：開啟不在堆疊中的層則推入，已在堆疊中則捨棄其上所有層並取代其內容。驗證：tests/layer-stack.test.ts 覆蓋 layer-stack spec 的兩張 Example 表，斷言十次循環後深度為 1 且任何時刻深度不超過 3
- [x] 3.3 於同一模組實作 Closing removes only the topmost layer 與 The stack is held separately from the active tab and from the selection：關閉只移除最上層，被回捲捨棄的層不得被還原；層以其內容而非位置識別。驗證：tests/layer-stack.test.ts 斷言關閉後下層內容不變、已捨棄的層不再出現，且切換分頁後堆疊成員與內容不變
- [x] 3.4 依決策「層堆疊行為」與「分頁行為」，讓 src/App.vue 依作用中分頁與層堆疊渲染內容，並移除 src/state/moveLearners.ts 這個獨立模組。驗證：pnpm run typecheck 通過；全域搜尋無殘留的 openMove 匯入

## 4. 機殼上的分頁控制項

- [x] 4.1 新增 src/components/TabDeck.vue 並掛在 Shell 之內、Screen 之外，實作 The tab control is drawn on the shell, outside the screen 與決策「分頁控制項畫在機殼上」：兩顆控制項恆常可見、作用中者以填色而非邊框表示、各自套用 start／end／cancel 三個主線程觸控綁定與按壓位移。驗證：pnpm run check 的對比檢查通過且未新增受測配對；實機於 POCKET 模式確認兩態可辨、按壓有位移、放開與取消皆會復位
- [x] 4.2 實作 Switching tabs preserves the other tab's state：切換分頁不重設查詢列的搜尋字串、屬性篩選、MEGA 與多形態篩選、排序，亦不清空層堆疊或改變任何層的內容。驗證：實機於圖鑑分頁設定搜尋與屬性篩選後切到招式分頁再切回，條件與結果序列不變；tests 斷言切換分頁後層堆疊成員不變

## 5. 招式清單

- [x] 5.1 新增 src/components/MoveIndex.vue，實作 The moves tab lists every move in the shared move table 與 A move row states the move's name, type, damage class and three figures，依決策「招式清單行為」：依資料集自身順序渲染 496 列，每列陳述名稱、屬性標記、傷害類別與三個數值，無固定傷害與必中者以破折號呈現，數值欄固定寬度右對齊。驗證：實機確認首列與末列對應資料集的第一與最後一個招式
- [x] 5.2 實作 Only the visible range of rows is materialised：套用既有可視範圍視窗能力，只具現可視範圍加緩衝的列，其餘以間隔物維持捲動範圍，並把列高加入 scripts/check-row-heights.mjs。驗證：pnpm run check 的列高檢查涵蓋招式清單且在故意改動樣式表列高時失敗；實機自首列捲到末列無空白列、無名稱與數值錯配
- [x] 5.3 實作 A move row is a control that opens that move's detail 與 The move index carries no query controls：tap 綁在列元素本身而非元件邊界，攜帶的是該列建構所依據的招式參照而非位置，三個觸控綁定齊備；招式分頁不渲染查詢列。驗證：實機捲動至不同範圍後點列，開啟的是該列招式；招式分頁元素樹無搜尋框、篩選鈕或排序鈕

## 6. 招式詳情

- [x] 6.1 新增 src/components/MoveDetail.vue，實作 Move detail states the move's mechanics and its description 與 Every move carries a description in both languages，依決策「招式詳情行為」：陳述雙語名稱、屬性、傷害類別、威力、命中、PP 與作用中語言的說明，缺值以破折號呈現，語系切換時說明改用另一語言。驗證：實機以 move-detail spec 的三個 Example（Stone Edge、Aurora Veil、Ice Spinner）逐項比對；切換語系後說明文字改變
- [x] 6.2 實作 Move flags are carried by the data layer and are not displayed：招式詳情不讀取也不呈現任何 flag。驗證：元件原始碼不引用 flag 欄位；實機確認帶 flag 的招式頁面上無 flag 標記
- [x] 6.3 實作 Move detail is the sole entry to the learner list 與 Move detail declares its own scrolling container only if its description overflows：提供開啟學習者清單的控制項並陳述學習者數量，控制項三個觸控綁定齊備；招式詳情至多宣告一個捲動容器。驗證：實機以最長說明（46 字）確認無需巢狀捲動即可讀完；元素樹確認捲動容器數不超過一

## 7. 既有畫面的接線

- [x] 7.1 依決策「招式列改為開啟招式詳情」，改寫詳情面板招式列的 tap 目標，實作 A move row is a control that opens that move's learners 的新行為與 The row a tap opens is the row's move, not the row's position：點列開啟招式詳情而非學習者清單，攜帶的仍是該列的招式參照，表頭仍非控制項。驗證：實機在依威力排序且開啟本系加成篩選的情況下點第一列，開啟的招式詳情對應該列；表頭按壓無位移且不開任何層
- [x] 7.2 改寫 src/components/MoveLearners.vue 使其成為層堆疊的一員，實作 The learner list is presented above the detail panel as its own layer、Choosing a learner replaces the selection and does not stack 與 The state holding the open move is separate from the selection：清單畫在其下層之上而非嵌入任一層，開啟的招式由層本身承載，選擇學習者依回捲規則處理。驗證：tests 斷言 move-learners spec 的四個情境；實機確認自招式分頁選擇學習者後可再由該物種開啟招式詳情而堆疊深度回到 1

## 8. 移除 masthead 的四個規模計數

- [x] 8.1 依決策「移除 masthead 的四個規模計數」與「masthead 移除的驗收」，移除 The masthead states the dataset's scale as four counts 所要求的呈現：刪除 src/App.vue 中未被使用的計數 computed、src/App.css 中四條對應的死樣式規則，以及 src/data/i18n.ts 中四個規模計數鍵。驗證：全域搜尋 Tally 於 src 下無命中；pnpm run check、pnpm run typecheck、pnpm test 全數通過
- [x] 8.2 確認 Dataset figures on screen are read from the dataset, never written as literals 在移除後仍成立：結果數仍讀自 meta block、招式詳情的學習者數量為關係推導而非整體規模數字；並於 ROADMAP.md 的「已確認不做」節新增一列載明移除理由與其記錄位置。驗證：內容審閱確認該列存在且指出字串表缺鍵不應被讀為功能漏失；pnpm test 通過

## 9. 整體驗收

- [x] 9.1 執行四項檢查、型別檢查與測試，確認本 change 未破壞既有不變式。驗證：pnpm run check、pnpm run typecheck、pnpm test 三者皆通過，且測試數相對變更前的增減可逐項對應到本 change 新增或修改的 Example 表
- [x] 9.2 於實機完成本 change 的裝置驗收，涵蓋分頁切換、招式清單全程捲動、招式詳情雙語、學習者清單兩個入口與層堆疊回捲。驗證：逐項對照 design.md 的 Implementation Contract 各節驗收條件，並就分頁控制項與招式清單各補一張截圖至 shots/
