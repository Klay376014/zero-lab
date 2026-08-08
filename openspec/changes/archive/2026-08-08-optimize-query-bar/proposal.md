## Why

在 390×844 的手機上，查詢列吃掉主畫面約 186px，網格只剩約 447px —— 卡片高約 181px，等於一次只看得到 2.5 列。查詢列的四列裡有兩列不值這個代價：

- **世代列**是九顆晶片，在 324px 內容寬下 8 顆一行、被迫換到第二行，而 `.Chip` 沒有 `margin-bottom`，兩行是相黏的。它佔約 54px。
- **排序列**整整一行只承載一個二值選擇，佔約 30px。

此外屬性列的十八顆晶片以 11 + 7 換行，兩行長度不齊；晶片本身是 22×22，遠低於觸控目標的下限。

## What Changes

- **移除世代篩選**。`genFilter` 狀態、`matchesGen`、查詢列的整列控制項、以及 `i18n` 的 `gen` 標籤鍵全部移除。**BREAKING**（對 spec 而言）：`dex-query` 現行需求明寫查詢狀態是四個控制項，改為三個。
- **世代不再有任何控制項入口**。搜尋語料的 `gen<n>` token **保留且不變** —— 它的存在理由改寫為純搜尋能力，不再與任何控制項對應。
- **排序併入搜尋列**，改為單顆循環晶片：按一下在「編號」與「種族值」之間切換，晶片文字即當前排序。排序列整列移除。
- **移除搜尋列的「搜尋」標籤**，把 32px 讓給輸入框。輸入框的 placeholder（`名稱 / 編號 / 屬性 / 形態`）在 13px 下約需 200px，是這一列上資訊量最高的元素，也是 `dex-query` 現行 haystack 需求的立論依據，不能被截斷。
- **屬性晶片固定九顆一排、兩排平均分配**。做法沿用 `App.css` 中 `.DexCell` 已確立的手法：百分比寬（`9 × 11.111% = 100%`）＋ padding 當間隙 ＋ `flex-shrink: 0`，因為平台的 box model 把 padding 算在宣告寬度內。晶片的 `margin-right` 移除，否則會擠成八顆一排。
- **屬性晶片的觸控目標放大**，垂直 padding 由 2px 提至 5px，晶片由 22×22 變為約 32×28。
- `press-feedback` 的控制項清單同步：移除世代篩選鈕，「every sort button」改為單顆排序循環鈕。

淨效果：查詢列約 186px → 約 114px，網格約 447px → 約 519px，可見卡片由約 2.5 列變為約 2.87 列。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `dex-query`: 查詢狀態由四個控制項（搜尋／屬性／世代／排序）縮為三個；`gen<n>` 搜尋 token 的存在理由改寫；排序集合的呈現不受約束這件事維持不變
- `press-feedback`: 控制項清單移除世代篩選鈕，排序由多顆鈕改為單顆循環鈕

## Impact

- Affected specs: `dex-query`、`press-feedback`
- Affected code:
  - Modified:
    - `src/state/query.ts`
    - `src/components/QueryBar.vue`
    - `src/data/i18n.ts`
    - `src/App.css`
    - `ROADMAP.md`
  - New: (none)
  - Removed: (none)
- 驗收：`pnpm run check` 與 TypeScript 型別檢查皆須通過。**另有一項只有實機能判定**：移除「搜尋」標籤後 placeholder 是否仍會截斷 —— `design/HANDOFF.md` §12.5 與 §12.17 已確立在 web 預覽量到的文字寬度是錯的，因為像素字面在該環境不載入。
