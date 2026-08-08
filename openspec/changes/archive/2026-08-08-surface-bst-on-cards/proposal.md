## Why

以種族值排序時，畫面上看不到排序的依據。使用者看到一個順序，卻沒有任何數字說明為什麼這張卡在那張之前 —— 排序結果無法在畫面上驗證。

設計稿有這個數字（`state.sort === 'bst'` 時把最佳形態的種族值總和印在卡片屬性列右側），移植版沒有。這是 ROADMAP A8，屬於「設計稿有、移植版沒有，且從未被任何一批 spec 要求過」的缺口。

`bestBst()` 已經存在於資料層，目前只有排序函式用它。把同一個值顯示出來，等於讓排序自我證明。

## What Changes

- 卡片的屬性列在**排序為種族值時**多顯示一個數字：該物種所有形態中最高的種族值總和
- 排序為編號時不顯示，卡片回到現在的樣子
- 屬性列右側改為一個容器，容納種族值數字與既有的形態數徽章兩者。兩者可同時出現，種族值在前、形態數在後，與設計稿的順序一致
- 不新增任何 i18n 字串：顯示的是純數字，沒有標籤

## Non-Goals

- **不加 hover 提示。** 設計稿的 `.bs` 帶 `title="最強形態的種族值總和"`，移植版四處 `title` 已全部移除且不補替代物（ROADMAP C 節、HANDOFF §12.16）。這一項不開先例
- **不改排序邏輯。** 排序規則、比較函式、穩定性都不動。本次只把已經在用的值顯示出來
- **不加無障礙標籤。** 平台的 accessibility 屬性尚未查證，整個主題是 ROADMAP B 節的獨立項目。在這裡加一個孤例會讓那個項目更難收斂
- **不動詳情面板的種族值區。** 那是 species-detail 的既有行為，本次不碰
- **不加第三種排序。** 名稱排序是 ROADMAP A6，與本次無關

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `species-card`: 「Card composition」需求目前把屬性列的尾端只描述為形態數徽章。改為描述一個尾端群組，內含種族值數字（僅在種族值排序時）與形態數徽章（僅在多形態時），並定義兩者同時存在與同時缺席時的版面

## Impact

- Affected specs: `species-card`
- Affected code:
  - Modified:
    - src/components/SpeciesCard.vue
    - src/App.css
  - New: (none)
  - Removed: (none)
- 不影響資料層：`bestBst` 已存在且不修改
- 不影響 `pnpm run check` 的四項不變式：不新增字符表面、不新增 i18n 字串、不使用 inset 陰影、不新增選中態規則
