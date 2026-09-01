## 1. Pipeline 的名單解析

- [x] 1.1 依設計「roster 解析只採納正式上線的資料」，讓 `design/pipeline/parse.py` 在比對 roster 樣板前先剝除 HTML 註解區段，滿足 `Roster parsing admits only released entries`：註解掉的列不再產出任何項目，未註解的列照常產出。驗證方式為單獨執行該步驟並與變更前的名單檔逐筆比對：mega、other、untransferable 三個區段完全相同，body 區段少掉一列且只少那一列 —— 上游第 216 行那筆被註解掉的 Pawmot（923），它同樣是被舊解析器吃進去的註解資料。產出的名單檔不含 `X.X.X` 版本值，也不含任何 Mega Z 列
- [x] 1.2 依設計「三個形態一律走 overlay，不從上游的註解列取得」，新增 `design/pipeline/overlay.json`，供應三個形態的 roster 列（含屬性 Dark／Ghost、Dragon、Fighting／Steel）與三組特性（Sharpness、Levitate、Aura Guard），並在檔案內對每一筆註明出處與「上游補齊後刪除」的條件，滿足 `A pipeline overlay supplies form data upstream does not carry`。驗證方式為內容審閱：確認 overlay 未供應任何上游已有的欄位（種族值與精靈圖路徑皆不得出現；英文形態名屬於 roster 列，由 overlay 供應是正確的）
- [x] 1.3 讓名單解析步驟將 overlay 的 roster 列併入 mega 列集合，使後續的形態比對步驟能為三個形態解析出 PokeAPI 變體。驗證方式為執行形態比對與精靈圖驗證兩個步驟，三個形態各自解析到 `10307.png`、`10309.png`、`10310.png` 且皆通過網路驗證，並且未被標記為近似圖

## 2. 中文形態名與特性

- [x] 2.1 依設計「MEGA 中文名推導規則擴充到 Z，並記錄它驗不到」，將 `design/pipeline/zh_forms.py` 的 MEGA 中文名推導由 X／Y 擴充為 X／Y／Z 並轉為全形，且在該處寫下「既有的上游比對斷言涵蓋不到 Z」這個驗證缺口。驗證方式為直接比對推導輸出：三個形態分別得到「超級阿勃梭魯Ｚ」「超級烈咬陸鯊Ｚ」「超級路卡利歐Ｚ」，且各自與同物種既有 MEGA 的中文名不相同
- [x] 2.2 依設計「特性表新增波導防護，並接受索引整體位移」，讓資料組裝步驟從 overlay 取得三個形態的特性，並將波導防護以英文名 `Aura Guard`、中文名「波導防護」、中文說明「受到接觸類物理招式的傷害減半」、英文說明 `Halves damage from physical contact moves` 加入特性表。驗證方式為組裝步驟的特性斷言不再對三個形態拋錯，且以特性名稱（非索引）確認三個形態各自對到鋒銳、飄浮、波導防護
- [x] 2.3 將資料組裝步驟中硬編碼的 MEGA 形態數期望值由 75 改為 78，並同步統計區塊的 MEGA 形態總數。驗證方式為組裝步驟執行完成且未於該斷言中止

## 3. 重新產生資料集

- [x] 3.1 重跑 pipeline 產生 `src/data/dex.json` 與 `design/champions-dex.json`、`design/champions-dex.html`，使三個形態出現在資料集中且其學習集指標皆為 0（與物種既有的唯一一段學習集共用）。驗證方式為讀取產出的資料檔，確認三個形態的欄位值與 design.md 的「資料形狀」表逐格相符，且三個物種的招式參照總數與變更前相同
- [x] 3.2 確認 pipeline 具備可重現性：連續重跑兩次，兩次產出的 `src/data/dex.json` 逐位元組相同，且 `design/champions-dex.json` 與其內容等價（一份緊湊、一份縮排）。驗證方式為兩次產出的檔案雜湊比對

## 4. 應用層與測試

- [x] 4.1 將 `src/data/dex.ts` 的載入期期望值更新為形態總數 363、MEGA 形態 78、特性表 201，滿足 `Dataset integrity is asserted at load time`：資料集符合六項不變式時模組正常匯出，任一項不符時拋出指明不變式與期望／實際值的錯誤。驗證方式為 `pnpm run typecheck` 通過且應用可載入
- [x] 4.2 確認資料集統計區塊的四個規模計數（物種 208、形態 363、MEGA 78、招式 496）與載入期斷言一致，滿足 `The data layer exposes the dataset's meta block`。驗證方式為 `tests/dex-data.test.ts` 中對應的斷言通過
- [x] 4.3 更新 `tests/dex-data.test.ts` 的不變式期望值，並補上一項針對本次三個形態的測試：三者的形態種類為 mega、學習集指標為 0、且與同物種一般 MEGA 取得相同的招式清單。驗證方式為 `pnpm test` 全數通過

## 5. 規格與文件

- [x] 5.1 確認 `dex-data` 的 delta 完整描述了正式規格要變成的樣子：`Dataset integrity is asserted at load time` 與 `The data layer exposes the dataset's meta block` 兩項既有需求的計數例子為 363／78／201，另有 `Roster parsing admits only released entries` 與 `A pipeline overlay supplies form data upstream does not carry` 兩項新需求。delta 由 `spectra archive` 套用，不在此手動同步正式規格（`CLAUDE.md` 記載該步驟多餘，且對 ADDED 有重複風險）。驗證方式為 `spectra validate add-mega-z-forms` 通過，且 delta 裡的三個計數與 `src/data/dex.ts` 的載入期期望值逐項相同
- [x] 5.2 確認 `dex-query` 的 delta 完整重述了 `Search matches across both languages at all times`：MEGA 形態總數由 75 改為 78，涵蓋 MEGA 的物種數維持 73，並補上「物種數不動而形態數上升」的說明與例子。同樣由 `spectra archive` 套用。驗證方式為 `pnpm test` 中查詢計數相關測試仍然通過（`mega` 命中數維持 73）
- [x] 5.3 於 `ROADMAP.md` 新增五筆待收上游資料（席多藍恩、轟擂金剛猩、戟脊龍三個物種，超級席多藍恩、超級戟脊龍兩個形態），寫明做不了的原因是 Bulbapedia 學習集分類仍為 208 篇、不含這三個物種，以及重新評估的條件。驗證方式為內容審閱：確認條目說明了原因與重評條件，避免下次對照時被當成新發現重提

## 6. 驗收

- [x] 6.1 執行 `pnpm run check`、`pnpm run typecheck`、`pnpm test` 三項，全部通過。驗證方式為 `pnpm run check` 每一項回報 ok 且印出總數，另兩項無錯誤結束
- [x] 6.2 實機驗收三個新形態畫得出來：切換到各自的 Z 形態後，精靈圖（`10307.png`／`10309.png`／`10310.png`）載入、屬性標記正確（阿勃梭魯Ｚ 為惡／幽靈，是該物種第一次帶兩個屬性）、種族值長條與特性說明可讀（波導防護的中文說明為本次新寫），且學習集表格內容與同物種一般 MEGA 相同。驗證方式為裝置上手動確認。**版面不列為風險**：兩顆 MEGA 按鈕噴火龍與雷丘早已在用，「超級阿勃梭魯Ｚ」7 字亦未超過既有最長形態名
