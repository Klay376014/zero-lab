## Why

招式表目前是終點：使用者看到「暴風雪」，但無從得知還有誰會這招。整份資料集裡「招式 → 寶可夢」這個方向從未被開放過 —— 12,939 組學習關係只能從寶可夢那一端讀。

這同時補上圖鑑缺的第二種瀏覽動線：現在只能由寶可夢出發，加上這條之後可以由招式出發，在物種之間橫向移動。

## What Changes

- 招式表的每一列成為可點擊的控制項，並帶按壓位移標記
- 新增第二層 overlay，列出會該招式的寶可夢，兩隻一列的精簡清單
- 點選清單中的寶可夢，**取代**目前的詳情選取，關閉時回到網格而非回到來源寶可夢
- 詳情面板加上以物種為值的 reconciliation key，讓物種切換時面板重新掛載，捲動位置由既有機制回到頂端，而不是新增讀寫捲動位置的程式
- 資料層新增「招式 → 會該招式的物種」的惰性 memo 衍生存取器，與既有的 `allTypes`／`searchHaystack` 同層同模式
- 開啟學習者時選擇的形態：預設基本形態，但當基本形態的招式區段不含該招式時，改開第一個含它的形態
- 建立 `openspec/LANGUAGE.md`，登錄本次引進的概念用語，避免 UI 用語與實作用語在後續 artifact 中混用

## Non-Goals

- **不做成通用共用元件。** 全專案目前只有招式表一處顯示招式，沒有第二個使用者。刪除測試不通過的抽象層不建立
- **不做返回堆疊。** 選取語意是取代，`selected` 維持單一值而非陣列
- **不重用 `SpeciesCard`。** 清單最多 207 筆，而 `design/HANDOFF.md` §12.14 已記 208 張卡的首次繪製比直覺慢得多；精簡列不付第二次那個成本
- **不在詳情面板內部新增區段。** 清單是面板的兄弟層，不動 `species-detail` 對面板捲動容器數量的既有禁令
- **不在清單上加搜尋或篩選。** 中位數 14 筆，先交付無控制項的清單
- **不新增 `GlyphSurface` 成員。** 清單重用既有表面語彙，讓對比檢查的涵蓋範圍不變

## Capabilities

### New Capabilities

- `move-learners`: 由一個招式反查會該招式的物種、以第二層 overlay 呈現該清單、以及選中一筆時如何切換詳情選取與挑選形態

### Modified Capabilities

- `learnset-table`: 招式列從惰性展示改為可點擊控制項，並定義它開啟什麼
- `press-feedback`: 帶按壓標記的控制項集合是列舉的，招式列加入該集合
- `species-detail`: 面板之上多一層 overlay，且物種切換時面板重新掛載
- `dex-data`: 新增反向索引衍生存取器與本功能的使用者字串

## Impact

- Affected specs: `move-learners`（新增）、`learnset-table`、`press-feedback`、`species-detail`、`dex-data`
- Affected code:
  - New:
    - src/state/moveLearners.ts
    - src/components/MoveLearners.vue
    - openspec/LANGUAGE.md
  - Modified:
    - src/data/dex.ts
    - src/data/i18n.ts
    - src/components/LearnsetTable.vue
    - src/components/SpeciesDetail.vue
    - src/App.vue
    - src/App.css
  - Removed: （無）
