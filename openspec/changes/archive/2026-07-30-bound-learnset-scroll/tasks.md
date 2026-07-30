## 1. 招式表的內層捲動

- [x] 1.1 依「招式表的捲動區只在真的需要時才有界」的決定，把資料列與空結果訊息移入 `LearnsetTable.vue` 的 `<scroll-view scroll-orientation="vertical">`，確定高度以 class 切換。行為契約：當前顯示列數大於 12 時容器有確定高度並自己捲，12 或更少時不套高度、沒有內層捲動。驗證：web 預覽開 #475 艾路雷朵（105 列）表內可捲且面板不再被拉長，開 #132 變隱怪（1 列）沒有空白框；`npm exec tsc -- --noEmit -p src/tsconfig.json` 通過。滿足 "The move table bounds its own height once it is long enough to need it"
- [x] 1.2 依「高度用視窗比例而非設計稿的 400px」在 `App.css` 新增有界規則，值為 `36vh`，並把 12 列門檻常數與這個高度寫在一起、在註解裡寫明彼此的關係（36vh ÷ 約 22px 的列高，在 667px 視窗下約 10 列、812px 下約 13 列，門檻取 12 使「有界但無可捲」不出現）。行為契約：改動門檻或高度其中一個時，另一個的關係在原地可讀。驗證：`pnpm run check` 通過（不得引入 inset 陰影），且註解含上述推導
- [x] 1.3 依「欄位表頭移到內層捲動容器之外」把 `MoveHead` 移出捲動容器，沿用既有的六個欄位 class。行為契約：捲動資料列時表頭留在原地，且表頭與資料列六欄左緣一致。驗證：web 量 DOM，表頭與任一資料列的六欄左緣相同；若捲軸佔寬導致不齊，關閉內層 `scroll-bar-enable` 後重量。滿足 "The column header sits outside the table's scrolling container"
- [x] 1.4 門檻看的是當前顯示列數而非該物種的招式總數，所以本系篩選把列數壓到 12 以下時界線消失。行為契約：篩選開關會讓界線出現或消失。驗證：先用一次性 node 腳本讀 `src/data/dex.json` 算出「篩選前大於 12 列、篩選後 12 列或更少」的物種清單，取其中一個在 web 上確認界線消失；另以 #006 噴火龍確認篩選前 63 列、篩選後 16 列兩種狀態都仍有界

## 2. spec 與文件同步

- [x] 2.1 `openspec/specs/learnset-table/spec.md` 的 Purpose 目前是 archive 留下的 `TBD - created by archiving change 'port-champions-dex-learnset'` 字串，補正為描述這份 capability 實際涵蓋範圍的英文段落（六欄、三種排序、本系篩選與標記、單列截斷、以及本變更新增的高度界線與表頭）。驗證：該檔 grep 不到 `TBD`，且 Purpose 段落與 `species-detail` 的寫法同一風格
- [x] 2.2 `design/HANDOFF.md` §12.16 提到巢狀捲動的兩列改寫為「例外只給招式表」而非刪除，並新增一節記下平台事實：`<scroll-view>` 的屬性表沒有 `enable-nested-scroll`（那是 `<list>` 的屬性，預設 `true`、內層先捲），以及三項實機結果的欄位。行為契約：讀 §12.16 的人看得出禁令仍對其他區段有效。驗證：內容審閱 —— 兩列的理由仍在，且新節有待填的實機結果欄位而非空白承諾
- [x] 2.3 `ROADMAP.md` 的 C 節移除「招式表自帶捲動區」該列（該決定已被推翻），並修正其餘各列引用 spec 位置的措辭 —— 面板內的禁令出自 `species-detail` 而非 `dex-grid`。行為契約：C 節不再包含已被推翻的項目。驗證：內容審閱，C 節無該列且無 `dex-grid` 的錯誤歸屬
- [x] 2.4 實作後面板的元素樹恰好兩個捲動容器（面板本體與招式表），其餘區段一個都沒有。驗證：`grep -rn 'scroll-view' src/components` 恰好三處 —— `DexGrid.vue` 一、`SpeciesDetail.vue` 一、`LearnsetTable.vue` 一。這同時是 "The panel's scrolling containers are limited to the panel body and the learnset table" 取代 "The panel has exactly one scrolling container and its header sits outside it" 之後的可檢查形式
- [x] 2.5 依 design 的「不為「面板內的捲動容器數量」加機械檢查」這個決定，在 `LearnsetTable.vue` 的註解裡寫明為什麼這件事不進 `pnpm run check`（兩支腳本讀樣式表與主題原始碼，看不到模板；而這件事壞掉的症狀是捲不動，屬於可見而非靜默失效）。驗證：註解存在，且 `scripts/` 未新增檢查

- [x] 2.6 既有需求 "The table declares no scrolling container and does not use the platform list binding" 的前半被本變更推翻、後半不受影響，已在 delta spec 拆成 REMOVED 加上新的 "The table does not use the platform list binding"。行為契約：加了內層捲動之後，排序與篩選仍然不會留下舊列或錯配內容 —— 因為那條禁令的理由（`<list>` 只支援尾端追加）與捲動容器無關，`<scroll-view>` 有 `enable-nested-scroll` 這件事也不構成改用 `<list>` 的理由。驗證：`grep -rn '<list' src/components` 無命中；web 上對 #475 依序切三種排序與本系篩選，列數與首末列名稱每次都與資料層算出的期望值相同

## 3. 實機驗收

- [x] 3.1 執行 design 的「巢狀同向捲動的手勢仲裁必須實機驗收，並預先寫下退路」，也就是 spec 的 "Nested scrolling is verified on a physical device and carries a recorded fallback"，在 iOS 實機驗三項：手指落在招式表上時捲的是招式表、落在招式表之外時捲的是面板、表頭在捲動時不動。行為契約：三項各有一行明確結果（含「招式表捲到底後是否接手外層」，接手最好、不接手可接受、不阻擋驗收）。驗證：三行結果寫回 2.2 在 `design/HANDOFF.md` §12 新增的那一節，條件記明（iOS 實機、開 #475 艾路雷朵）
- [x] 3.2 **條件未成立，無需執行。** 3.1 的實機結果是內層依落點拿到手勢、外層未被搶走，所以退路不啟用；退路本身仍完整記在 §12.19 以備平台行為改變。以下為原本的條件式任務：若 3.1 顯示外層吃掉手勢導致招式表捲不動，切換到已記錄的退路：招式表預設收合、標題列既有的列數當提示、點一下展開，並把「巢狀同向捲動已實測不成立」寫進 §12。行為契約：退路生效後 #475 的面板高度仍然不由招式表的列數決定。驗證：iOS 實機確認收合狀態下面板可一屏內看完，且展開後可讀完 105 列
