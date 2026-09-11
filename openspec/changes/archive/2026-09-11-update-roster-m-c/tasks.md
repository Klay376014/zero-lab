## 1. Pipeline 的解析與抓取

- [x] 1.1 解析步驟在「其他形態」之後接任何第二層標題時都取得完整區段內容，不再依賴已被上游刪除的 `==Untransferable Pokémon==` 標題（design 決策一）。驗證：以 M-C 名單頁為輸入執行 `python3 design/pipeline/parse.py`，輸出的 other-form rows 為 87、mega rows 為 81、untransferable rows 為 0；把結束樣式改回具名標題會讓 other-form rows 掉到 0，可用來確認這條路徑真的被測到。
- [x] 1.2 抓取步驟對學習表分類成員數的斷言為 231，且同一段的提示文字所述期望值與斷言一致（目前文字寫 208）。驗證：執行 `design/pipeline/fetch_sources.sh`，印出 `category members: 231` 且不中止；把上游回傳數改成其他值時該步驟以非零結束碼停下。
- [x] 1.3 抓取步驟取得每一份學習表頁面的上游最後修訂時間並快取成單一檔案，可重複執行且已存在即略過，與學習表本身的快取行為一致。驗證：執行兩次，第二次對該檔案印出 skip；檔案內含 231 個標題各自的 ISO 時間戳，且 Pawmot、Arboliva、Indeedee 三者的時間戳晚於 Clefable 與 Vaporeon。

## 2. Pipeline 的聚合與組裝

- [x] 2.1 聚合步驟在同一招式於不同頁面上機制不一致時，採修訂時間最新的頁面之值，並印出勝出頁、落敗頁與雙方時間戳；時間戳相同而值不同時以非零結束碼中止（design 決策六）。驗證：執行 `python3 design/pipeline/aggregate.py`，恰好回報 Wish 與 Strength Sap 兩筆裁決，兩者 PP 皆為 8；以原 208 份學習表執行同一步驟時回報零筆衝突。
- [x] 2.2 overlay 不再供應任何 roster 列（三筆 `megas` 的刪除條件已成立），並供應超級具甲武者與超級戟脊龍的特性（design 決策三與決策四），每筆記錄其 Bulbapedia infobox `abilitym` 來源與刪除條件。驗證：`python3 design/pipeline/parse.py` 不再因 overlay 列已被上游收錄而中止；組裝步驟不再回報任何形態缺特性；資料集中超級阿勃梭魯Ｚ為惡／幽靈、超級烈咬陸鯊Ｚ為單一龍、超級路卡利歐Ｚ為格鬥／鋼，與刪除前相同。
- [x] 2.3 組裝步驟的三項規模斷言為種類 231、MEGA 形態 81、地區形態 17，違反時仍以非零結束碼停下。驗證：執行 `python3 design/pipeline/build_data3.py` 通過並印出 `species 231 | forms 396 | moves 511 | move refs 15472 | abilities 215`。
- [x] 2.4 meta 的每一項規模計數都由組裝出的資料算出，不再有任何寫死的字面值（design 決策二）；`roster` 指明 Regular Roster M-C 與其結束日期 2026-12-02。驗證：`megas` 為 81、`regional` 為 17（改動前這兩項是字面值 78／16，與實際資料不符）；在原始碼中搜尋 meta 區塊內的數字字面值應一無所獲。

## 3. 產出資料集

- [x] 3.1 完整跑完 pipeline 並產出三份檔案，且產出可重現。驗證：執行 `design/pipeline/run.sh` 無非零結束碼；緊接著再執行一次，`design/champions-dex.json` 與 `src/data/dex.json` 皆逐位元不變（以 `git status` 確認第二次沒有新的改動）。
- [x] 3.2 `src/data/dex.json` 與 `design/champions-dex.json` 承載同一份資料集，前者為精簡序列化、後者為縮排序列化。驗證：兩者以 JSON 解析後結構相等，且前者的位元組數小於後者；不要引用任何寫在文件裡的檔案大小，以 `wc -c` 為準。

## 4. 應用層

- [x] 4.1 資料層的六項載入期不變式與新資料集一致（種類 231、形態筆數 396、MEGA 81、地區形態 17、招式 511、特性 215），任一不符時仍拋出具名錯誤並同時報出期望值與實際值。驗證：`pnpm test` 中 `tests/dex-data.test.ts` 的不變式案例通過；暫時把任一期望值改錯會讓模組初始化拋錯而非通過。
- [x] 4.2 原始碼註解中敘述資料集規模的數字與新資料集一致（`src/data/i18n.ts` 的旗標說明、`src/state/rowMetrics.ts` 的列數說明、`src/components/MoveIndex.vue` 與 `src/App.css` 的序列長度說明）。驗證：全專案搜尋 `208`、`496`、`401`、`340` 這四個舊值，剩餘命中都能說明為什麼不屬於資料集規模（例如純粹的像素值）。

## 5. 規格與測試

- [x] 5.1 測試檔隨其規格的 Example 表更新，且仍然匯入受測模組而非重新實作其述詞。驗證：`pnpm test` 全綠；測試中出現的每一個新數字都能在對應的 delta spec 中找到同一個值。
- [x] 5.2 `dex-data` 的五項既有要求與新資料集一致，新增的裁決要求落到程式碼：Dataset provenance（招式表 511、與本傳不同 415）、Dataset integrity is asserted at load time（六項期望值）、The data layer exposes the dataset's meta block（四項規模計數與「每一項計數皆為算出」）、Move records carry a bilingual description and flag identifiers（511、無旗標 74、至少一個旗標 437）、A pipeline overlay supplies form data upstream does not carry（收斂為只供應特性）、Conflicting move mechanics across source pages are resolved by upstream revision time。驗證：`tests/dex-data.test.ts` 全綠，且其中每一個數字與 spec 的 Example 表逐格相同。
- [x] 5.3 查詢面的四項要求與新資料集一致：`dex-query` 的 Search matches across both languages at all times、The type filter is evaluated across all of a species' forms、The Mega-only and multi-form-only filters narrow the result sequence，以及 `move-query` 的 Move search matches names in both languages and matches nothing else 與 Selections within a condition combine disjunctively and the three conditions combine conjunctively。驗證：`tests/dex-query.test.ts` 與 `tests/move-query.test.ts` 全綠；特別確認 `alola` 一列已由兩個物種變成三個（新增 Persian），說明欄同步改寫。
- [x] 5.4 呈現面的五項要求與新資料集一致：`dataset-statements` 的 Dataset figures on screen are read from the dataset, never written as literals 與 The result count is a localised statement, not a bare ratio、`move-index` 的 Only the visible range of rows is materialised、`move-learners` 的 A move resolves to the species that learn it、`learnset-table` 的 Move names occupy one line and truncate rather than wrap 與 A move with no Chinese name falls back to its English name、`move-detail` 的 Every move carries a description in both languages、Move detail states the move's flags as short labels 與 Move detail states no flag section when no flag can be stated。驗證：內容審閱逐列對照，**說明欄對不上時停下來回報**——那代表語意變了而不只是數字變了（design 決策五）；另確認 `move-detail` 的 Attract 一列補上原本漏列的 `mirror` 識別碼（該遺漏在 M-B 就存在，不是本次造成）。

## 6. 文件

- [x] 6.1 `ROADMAP.md` D 節只剩重新評估條件尚未成立的項目：移除轟擂金剛猩（812）、戟脊龍（998）與超級戟脊龍三筆，保留席多藍恩（485）與超級席多藍恩，並說明 812 與 998 是在哪一次名單輪替下解除的。驗證：內容審閱；D 節不再提及任何已收錄進資料集的物種。
- [x] 6.2 `design/HANDOFF.md` 中敘述資料集規模與來源驗證的數字與新資料集一致（§5 的檔案說明、§6 的學習表分類成員數與可操作種類數、§7 的 Mega 命名規則驗證實例數由 41 改為 42）。同時移除 Pawmot「存在於遊戲資料中但不可操作」的說明 —— 上游已將它轉為正式可用，無法轉移區段整節消失。驗證：內容審閱；§6 的不變式表格與 `src/data/dex.ts` 的六項期望值一致。

## 7. 驗收

- [x] 7.1 三道自動檢查全部通過。驗證：`pnpm run check` 每一項印出 ok 且違規數為 0；`pnpm run typecheck` 通過（必須是 `vue-tsc`，不可代以 `tsc`）；`pnpm test` 全綠。
- [x] 7.2 裝置驗收：在實機上確認新物種與新招式可達且版面未壞。驗證：招式分頁自第一列捲到最末列無空白列、無名稱與數值錯配；開啟轟擂金剛猩與戟脊龍的詳情並切換到超級戟脊龍，形態切換器顯示該形態且屬性正確；任一招式名維持單行不折行，特別確認新增的 Revival Blessing。網頁預覽量到的拉丁文字寬度不可採信，依 `design/HANDOFF.md` §12 的作法量測。
