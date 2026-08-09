## 1. 查詢狀態改形

交付 spec 需求 **Query state is shared and independently settable**，並執行 design 的**決定一：屬性篩選存成唯讀陣列並整份取代，不用響應式 `Set`** 與**決定二：兩顆布林篩選鈕各自一個 `ref(false)`**。

- [x] 在 `src/state/query.ts` 把 `typeFilter` 改為 `typeFilters`，型別 `readonly TypeName[]`，初始值空陣列。**改名是刻意的** —— 留著單數名字承載集合正是讓下一個人誤讀成單選的原因，且改名會讓 `tsc` 把每一處引用都指出來
- [x] 在同一檔案新增 `megaOnly` 與 `multiOnly` 兩個 `ref(false)`，照 `src/state/learnset.ts` 的 `bonusOnly` 前例。兩者互相獨立，不合併成旗標物件
- [x] 把五項狀態都加入模組的 export，並更新 `resetQuery()` 使其把五項全部回到初始值。這一條連同上面兩條共同交付需求 `Query state is shared and independently settable` —— 對應其 scenario「Reset returns every control to its initial value」與「Each control is independent」
- [x] 切換屬性的函式要**產生新陣列再整份指派**，不得在原地增刪。依 design 的決定一：這個平台沒有驗證過響應式集合，失敗形狀是點了沒反應且不報錯

## 2. 篩選與形態選擇

交付 spec 需求 **The type filter is evaluated across all of a species' forms**、**The Mega-only and multi-form-only filters narrow the result sequence** 與 **A filtered card displays the form that matched the filter**，並執行 design 的**決定三：篩選之間 AND，屬性內部 OR** 與**決定四：形態選擇規則從四條變五條，Mega 分支排在屬性之後**。

- [x] 改寫屬性比對函式，交付需求 `The type filter is evaluated across all of a species' forms`：空選集合比對成功；非空時，物種的任一形態帶有選集中的**任一**屬性即成立（OR）。沿用資料層既有的跨形態屬性存取器，不自己展開形態
- [x] 新增兩個布林條件的比對，交付需求 `The Mega-only and multi-form-only filters narrow the result sequence`：Mega 條件在 `megaOnly` 為真時要求物種至少有一個 Mega 形態；多形態條件在 `multiOnly` 為真時要求形態數大於一
- [x] 在結果計算裡把四個條件以 AND 串接（搜尋、屬性、Mega、多形態），依 design 的決定三。**只有屬性內部是 OR**
- [x] 在形態選擇函式把規則從四條擴為五條，交付需求 `A filtered card displays the form that matched the filter`：第三條改為「第一個帶有任一選中屬性的形態」，第四條新增「`megaOnly` 為真時取第一個 Mega 形態」，基本形態退為第五條。**Mega 分支必須排在屬性之後**，依 design 的決定四 —— 對應 scenario「A type selection outranks the Mega-only flag」

## 3. 介面與字串

交付 spec 需求 **The query bar occupies three rows and states the sort order as its current value**，並執行 design 的**決定五：第三列是獨立的 `QueryRow`，不塞進第二列**。

- [x] 在 `src/data/i18n.ts` 的字串表型別與兩個語系各補 `megaOnly` 與 `multiOnly` 兩個鍵。中文用 `★ 僅 MEGA` 與 `僅多形態`，英文用 `★ Mega only` 與 `Multi-form`，與設計稿一致
- [x] 在 `src/components/QueryBar.vue` 新增第三個 `QueryRow`，交付需求 `The query bar occupies three rows and states the sort order as its current value`：內含兩顆 `Chip`，各自綁三個觸控事件（`touchstart`／`touchend`／`touchcancel` 一律都綁，少綁 `touchcancel` 會留下永遠凹著的鈕）與各自的切換函式
- [x] 兩顆鈕的選中態沿用既有的 `ChipOn` 樣式，**不自創第三種選中表現**。POCKET 模式的 accent 與 line 同色，邊框分不出兩態，這是屬性格已經解決過的問題
- [x] 更新 `QueryBar.vue` 中屬性格的選中判斷與配色函式，從等值比較改為「該屬性是否在選集內」。三處要一起改：選中判斷、`chipBackground`、`chipSurface`

## 4. 驗證

- [x] 執行 `npm exec tsc -- --noEmit -p src/tsconfig.json`，確認 exit 0。改名 `typeFilter` → `typeFilters` 之後這一步會抓出所有遺漏的引用
- [x] 執行 `pnpm run check`，確認 exit 0 且四項不變式無違規
- [x] 用資料層直接驗篩選數字，逐條核對 spec 的 Example 表：火 26、水 29、火＋水 52（交集 3）、未選 208；Mega-only 73、多形態 99、兩者同開 73
- [x] **特別確認兩者同開等於 73 這件事不是 bug** —— 有 Mega 的物種必然多形態，所以多形態鈕疊在 Mega 鈕上不會改變筆數。spec 的 Example 已寫明這是正確行為
- [x] 在 web 預覽核對形態選擇：未選任何篩選時噴火龍顯示基本形態；只開 `★ 僅 MEGA` 顯示 Mega Charizard X；開 `★ 僅 MEGA` 且選火屬性顯示基本形態（規則 3 勝過規則 4）；開 `★ 僅 MEGA` 且選龍屬性顯示 Mega Charizard X
- [x] 在 web 預覽確認回歸：只選一個屬性時的結果與改動前的單選完全相同；再次點擊已選屬性會取消它；清除篩選把五項狀態全部歸零且結果回到 208 筆
- [x] 在 web 預覽確認第二列的 18 個屬性格仍是 9+9 斷行，未因第三列而改變
- [x] **iOS 實機驗收**：三列都完整可見不被裁切，兩顆新鈕的選中態在 POCKET 與 MODERN 兩個模式下都分辨得出來。**這一項 web 預覽答不了** —— 像素字型在預覽不載入，鈕的寬度會量錯（HANDOFF §12）
- [x] 若實機上三列過於壓迫卡片網格，退路是把兩顆鈕改到第一列與排序晶片同列（會壓縮搜尋框），**不要刪掉功能**。design 的 Risks 已記此退路。**條件未發生**（2026-08-09，iOS 實機）：三列可接受，退路未啟用，兩顆鈕留在第三列

## 5. 收尾

- [x] **archive 之後立刻核對兩件事**（兩者都是已知會靜默失敗的後處理）。其一：archive 輸出的 `renamed:` 計數 —— 本次刻意不用 RENAMED 而改用 REMOVED＋ADDED，所以主 spec 裡應該找不到需求 `The query bar occupies two rows and states the sort order as its current value`，只留三列版。若舊標題還在，手動刪掉。其二：`openspec/specs/dex-query/spec.md` 的 Purpose 段 —— archive 不會更新它，本次新增的兩個布林篩選與屬性多選要手動補進那段列舉。**兩項都已於 2026-08-09 核對**：REMOVED＋ADDED 的迂迴成功，舊的兩列版標題未殘留；Purpose 段確實沒被 archive 更新，已手動補上屬性多選、兩個布林篩選與三列查詢列
- [x] 從 `ROADMAP.md` 的 A 節移除 A4 與 A5 兩項，並把開頭「A 節現為四項」改為兩項、列舉改為 A6、A10。**編號不重編**，移走後保留缺號
- [x] 更新 `ROADMAP.md` 開頭的「最後對照」行與 commit 雜湊
- [x] 確認 ROADMAP 開頭「`i18n.ts` 仍無 `megaOnly`／`multiOnly`／`sortName`」那句 —— 前兩個鍵本次已補，該句要改為只剩 `sortName`，否則它會變成過時的自查指標
