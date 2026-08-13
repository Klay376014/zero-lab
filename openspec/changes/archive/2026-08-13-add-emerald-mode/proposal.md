## Why

介面目前只有兩種配色，而 `cycleMode()` 是取餘數輪替：兩個模式時「按一下切換」成立，第三個以後就變成
「按 N-1 次才回得去」，控制項本身不再說出有幾個選項、也不說出目前在哪一個。

第三種配色的需求同時暴露一件量得出來的事：MODERN 讓型別字符用型別自己的顏色，這只在深色面板上成立。
亮底面板上十八個型別色有 10 到 15 個（依面而定）掉到對比底線 2.5 以下，而且不是調得動的 ——
電系 #FAC000 畫在純白上也只有 1.67，而白是亮色面板的上限。所以新增一個亮底主題必須連帶決定字符怎麼畫，不能只加一組 token。

## What Changes

- 新增第三個配色模式 `EMERALD`（日間林道）：亮底、暖色，十個 token 全部從一張綠寶石風地圖實際取樣。
  取樣依據與量測結果留在 design/theme-emerald-mock.html。
- 型別字符在 `EMERALD` 下改畫在「自己的型別色底板」上：字符填 `inkOn(型別色)`，底板就是型別色。
  這是把既有的 `typechip` 做法搬到中性面板上，不新增任何顏色、也不新增量測底線。
- **BREAKING**（僅內部 API）：`cycleMode()` 移除，改為 `setMode(id)`。`modeIndex` 與它的取餘數邏輯一併移除。
- 新增主題選單控制項：masthead 的模式按鈕改為開選單，選單列只有名稱、不附色塊預覽。
- `scripts/check-contrast.mjs` 改為讀取所有模式的 token（現在的非全域正則只讀得到第一個 `tokens` 區塊，
  加第三個模式它會安靜地漏掉），並把底板這個新排列納入量測。

## Capabilities

### New Capabilities

- `theme-menu`: 選擇配色模式的下拉選單控制項 —— 它的觸發按鈕、開合、選中列的呈現、關閉方式，
  以及它為什麼不能用半透明遮罩關閉。

### Modified Capabilities

- `retro-theme`: 模式數量由「恰好兩個」改為「至少兩個」並新增 EMERALD 的 token 契約；
  字符填色規則新增「底板」這個排列，回報字符背景的那個函式在有底板時改回報型別色；
  模式狀態由索引輪替改為以識別字選定。
- `type-glyph`: 字符元件的輸出在主題層回報底板色時多一層底板，字符自身的 16 像素格線不變。
- `press-feedback`: 控制集合新增選單的每一列；完全透明的關閉攔截層明文排除在集合外。

## Impact

- Affected specs: `theme-menu`（新增）、`retro-theme`、`type-glyph`、`press-feedback`
- Affected code:
  - New:
    - src/components/ThemeMenu.vue
    - tests/theme.test.ts
  - Modified:
    - src/theme/modes.ts
    - src/state/display.ts
    - src/components/TypeGlyph.vue
    - src/App.vue
    - src/App.css
    - scripts/check-contrast.mjs
  - Removed: （無檔案刪除；`cycleMode` 與 `modeIndex` 兩個匯出在 src/state/display.ts 內移除）
- 條件性影響：底板讓 16 像素的字符佔位變成 18 像素。`.DexCell` 的 201px 列距是實機量測值而不是推導值，
  所以卡片列距必須重量；若真的變了，src/state/rowMetrics.ts、src/App.css 的保留高度與
  `visible-range-window` spec 的 Example 表要一起動。
- 不影響 ROADMAP.md：第三個主題不是設計稿的差距項，A／B／C 三節都沒有對應條目可以移除。
