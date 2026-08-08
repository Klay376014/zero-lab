## 1. 卡片取得排序狀態

交付 spec 需求 **Base-stat figure is shown exactly when it decides the order** 的前半（值從哪裡來、條件由誰決定），並執行 design 的**決定一：卡片讀全域 `sortOrder`，不從 `DexGrid` 傳 prop** 與**決定三：判斷式寫 `sortOrder === 'stats'`**。

- [x] 在 `SpeciesCard.vue` 匯入全域 `sortOrder`（來自 `src/state/query.ts`，已 export），並加一個 computed 判斷是否為種族值排序。依 design 的決定三，判斷式寫 `sortOrder.value === 'stats'`。**不要引入 `'bst'` 字面值**，那是設計稿的命名，移植版的排序集合是 `['number', 'stats']`
- [x] 在同一個檔案加一個 computed 產生要顯示的數字，值取自資料層既有的 `bestBst(species)`。**傳入的是物種而不是當前形態** —— 對應 spec 的 scenario「Figure reflects the strongest form, not the drawn form」。顯示值必須與排序用的值同語意，否則卡片會顯示一個無法解釋其位置的數字
- [x] 依 design 的決定一，**不要**把排序改成 prop 由 `DexGrid` 傳入。理由：卡片已經直接讀全域語系，同一元件對兩個同性質的全域狀態用兩種取得方式比任何單一做法都難讀

## 2. 屬性列尾端改為群組

交付 spec 需求 **Card composition** 的修改部分（尾端群組的存在、成員順序、靠右機制），並執行 design 的**決定二：屬性列尾端改為一個容器，用 `margin-left: auto` 而不是 `gap`**。

- [x] 在 `SpeciesCard.vue` 的屬性列內，把形態數徽章包進一個新的尾端群組 view，並在群組內於徽章**之前**加入種族值數字 —— 對應 Card composition 的 scenario「Trailing group keeps its members in a fixed order」。兩者各自帶自己的顯示條件：數字只在種族值排序時出現，徽章只在物種有多個形態時出現
- [x] 在 `App.css` 為尾端群組新增規則，靠右對齊改用 `margin-left: auto` 掛在群組上；同時把 `CardFormCount` 既有的 `margin-left: auto` 移除。Card composition 明文禁止成員各自搶剩餘空間，因為那會變成一個貼左一個貼右而不是並排靠右
- [x] 群組內兩個成員的間距用 margin，**不要用 `gap`**。依 design 的決定二：`App.css` 全檔沒有任何 `gap` 宣告，這個平台上它未經驗證；而 `margin-left: auto` 已在既有程式碼中成立
- [x] 為種族值數字新增樣式規則：字級與粗細比照設計稿的做法（11px、粗體、字距不額外加寬），顏色用既有的墨色 token，不引入新顏色。**不得使用 inset 陰影**（`pnpm run check` 會擋）

## 3. 驗證

- [x] 逐條核對 spec 需求 `Base-stat figure is shown exactly when it decides the order` 的四個 scenario：排序為種族值時每張可見卡片都有數字、切回編號排序後全部消失且卡片未重新掛載、數字取最強形態而非當前繪製形態、數字序列不遞增
- [x] 執行 `pnpm run check`，確認 exit 0 且四項不變式無違規
- [x] 執行 `npm exec tsc -- --noEmit -p src/tsconfig.json`，確認 exit 0
- [x] 在 web 預覽切到種族值排序，確認：妙蛙花（#0003）同時顯示數字與形態數徽章 `2` 且數字在左；百變怪（#0132）只顯示數字；切回編號排序後兩者的尾端分別只剩徽章與空白
- [x] 在 web 預覽確認種族值排序下，從第一張卡片往下讀數字，序列不遞增
- [x] 在 web 預覽切換排序並確認卡片圖片沒有重新載入或閃爍 —— 切換排序不得造成卡片重新掛載
- [x] **iOS 實機驗收**：種族值排序下捲過數列，確認數字與形態數徽章在同一水平線、貼齊卡片右緣、不與屬性縮寫重疊。最壞情況是雙屬性又有多形態的物種（如噴火龍 #0006）。**這一項 web 預覽答不了** —— 像素字型在預覽不載入，拉丁與數字的寬度會量錯（HANDOFF §12）
- [x] 若實機上擠不下，退路是讓屬性列在該情況換行，**不要縮小數字字級**（會破壞像素字型的整數倍縮放）。**條件未發生**（2026-08-08，iOS 實機）：最壞情況擠得下，退路未啟用，屬性列未換行、字級未動

## 4. 收尾

- [x] 從 `ROADMAP.md` 的 A 節移除 A8 一項，並確認開頭「A 節現為五項」那句改為四項、列舉改為 A4、A5、A6、A10。**編號不重編**，A8 移走後保留缺號
- [x] 更新 `ROADMAP.md` 開頭的「最後對照」行與 commit 雜湊
