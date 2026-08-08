## 1. 查詢狀態層

- [x] 1.1 依設計決策「移除世代篩選，搜尋語料的 gen 世代 token 保留」，讓查詢狀態只對外提供搜尋字串、屬性篩選、排序順序三項，滿足 `Query state is shared and independently settable`：`src/state/query.ts` 不再有 `genFilter` ref、不再匯出它，`resetQuery` 只重設三項。驗證：執行 npm exec tsc -- --noEmit -p src/tsconfig.json 零錯誤 —— 任何殘留引用都會在這裡現形。
- [x] 1.2 讓結果序列的篩選只由屬性與搜尋做連言，滿足 `Type and generation filters are evaluated across all of a species' forms`，並依 RENAMED 將該需求更名為 `The type filter is evaluated across all of a species' forms`：`src/state/query.ts` 移除 `matchesGen`，`results` 的迴圈不再有世代判定。驗證：在畫面上選任一屬性並確認結果筆數與改動前選同屬性且世代未選時相同（例如 Dragon 為 19 筆）。
- [x] 1.3 依設計決策「排序改為單顆循環晶片並併入搜尋列」，提供一個推進排序順序的操作：呼叫一次由 `number` 變為 `stats`，再呼叫一次變回 `number`。驗證：npm exec tsc -- --noEmit -p src/tsconfig.json 零錯誤，並在畫面上連按排序控制項兩次確認網格順序回到編號序。

## 2. 查詢列版面

- [x] 2.1 讓查詢列只有兩列且第一列依序為排序控制項、搜尋輸入框、清除鈕，第二列為屬性標籤與十八顆屬性晶片，滿足 `The query bar occupies two rows and states the sort order as its current value`：`src/components/QueryBar.vue` 移除世代整列與 `pickGen`，排序改為單顆晶片並移入第一列。驗證：畫面上數得出兩列控制項，且不存在任何選擇世代的控制項。
- [x] 2.2 依設計決策「移除搜尋標籤而非縮短清除鈕」，讓搜尋輸入框在畫面上不再有引導它的文字標籤，輸入框寬度增加約 32px。驗證：畫面上第一列只有三個元素；placeholder 是否截斷留待任務 5.2 在實機判定。
- [x] 2.3 依設計決策「屬性晶片以百分比寬強制九顆一排」，讓十八顆屬性晶片排成兩排各九顆且第二排第 n 顆左緣對齊第一排第 n 顆：`src/App.css` 的 `.TypeChip` 改為 `width: 11.111%` 加 `flex-shrink: 0`，移除 `margin-right`，間隙改由 padding 提供；晶片包在一個 `flex: 1` 且換行的容器內，標籤在容器之外。驗證：畫面上第一排數得出九顆，且屬性列不橫向溢出。
- [x] 2.4 依設計決策「屬性晶片的觸控目標放大」，讓屬性晶片由 22×22 變為約 32×28：`src/App.css` 的 `.TypeChip` 垂直 padding 由 2px 提至 5px，字符維持 16px 不縮放。驗證：畫面上晶片明顯高於改動前，且屬性列總高不超過約 62px。
- [x] 2.5 依設計決策「press-feedback 控制項清單同步」，讓排序循環晶片按下時有一像素向下位移、放開或取消時消失，滿足 `Press feedback covers the control set and excludes the card sequence and the veil`：新晶片綁齊 `main-thread-bindtouchstart`、`main-thread-bindtouchend`、`main-thread-bindtouchcancel` 三個屬性。驗證：按住排序晶片看到位移，滑開手指（觸發 cancel）後位移消失。

## 3. 字串與搜尋語料

- [x] 3.1 讓語系字串表不再提供世代篩選的標籤：`src/data/i18n.ts` 移除 `gen` 鍵與其介面欄位，兩個語系皆然；`GEN_ROMAN` 與 `genOfLabel` 保持不動，因為卡片與詳情面板在用。驗證：npm exec tsc -- --noEmit -p src/tsconfig.json 零錯誤，且詳情面板仍正確顯示世代。
- [x] 3.2 確認搜尋語料未受本次變更影響，滿足 `Search matches across both languages at all times`：`src/data/dex.ts` 的 haystack 不做任何修改，`gen` 加數字的 token 保留。驗證：在搜尋框輸入 gen5 得到 29 筆，輸入 gen5 dragon 得到 1 筆（Hydreigon）。

## 4. 文件同步

- [x] 4.1 讓 `openspec/specs/dex-query/spec.md` 的 Purpose 段不再宣稱查詢涵蓋世代篩選 —— delta spec 不攜帶 Purpose，所以這一段要直接改。驗證：該檔 Purpose 段讀不到 generation filter 字樣，且 `spectra validate optimize-query-bar` 通過。
- [x] 4.2 讓 `ROADMAP.md` 不再留下指向已移除元件的待辦：刪除 A9（世代鈕該用羅馬數字），A4 改為只講屬性篩選的單選縮減，A6 補上一句說明第三種排序與單顆循環晶片衝突、要做的話排序控制項需改為可展開選單，並在 a11y 那一列補記搜尋輸入框失去可見標籤後需要 accessibilityLabel。驗證：閱讀該檔確認四處皆已更新且無殘留的世代篩選描述。

## 5. 驗收

- [x] 5.1 讓四項不變式與型別檢查全數通過：執行 pnpm run check 得到零退出碼，執行 npm exec tsc -- --noEmit -p src/tsconfig.json 零錯誤。驗證：兩個指令的退出碼與輸出。
- [x] 5.2 在實機（或依 design/HANDOFF.md §12.17 注入像素字型後的 web 預覽）確認三件只有該環境能判定的事：屬性列每排九顆、兩排左緣對齊、placeholder 在中英兩個語系皆不截斷。驗證：目視確認三項；若 placeholder 截斷，啟用 design.md 風險段記載的退路（搜尋標籤放回、排序退回自己一列），並回頭修改 `The query bar occupies two rows and states the sort order as its current value` 這條需求。
